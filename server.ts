import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Firestore } from '@google-cloud/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '2mb' }));

// Cached Clients and Secret
let cachedGeminiKey: string | null = null;
let aiClient: GoogleGenAI | null = null;
let firestoreClient: Firestore | null = null;

const PRODUCTION_GEMINI_SECRET_NAME = 'projects/for-apac-projects/secrets/gemini-api-key/versions/latest';

/**
 * Initializes and returns the trusted server-side Google Cloud Firestore client.
 * Uses Google Cloud Application Default Credentials (ADC) / Cloud Run service account.
 * Targets the specific database ID configured for this application.
 */
function getFirestoreClient(): Firestore {
  if (!firestoreClient) {
    const projectId = firebaseConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'for-apac-projects';
    const databaseId = firebaseConfig.firestoreDatabaseId || 'ai-studio-128fc970-9e47-48fc-b1e9-687b9c975691';
    firestoreClient = new Firestore({
      projectId,
      databaseId,
    });
  }
  return firestoreClient;
}

/**
 * Lazily retrieves the Gemini API key from Google Cloud Secret Manager or environment variable.
 * Guarantees that credentials remain strictly server-side and are never exposed to the client.
 */
async function getGeminiApiKey(): Promise<string> {
  if (cachedGeminiKey) {
    return cachedGeminiKey;
  }

  const secretResource = process.env.GEMINI_SECRET_NAME || PRODUCTION_GEMINI_SECRET_NAME;

  // 1. Primary Production Route: Fetch from Google Cloud Secret Manager
  if (secretResource && secretResource.trim() !== '') {
    try {
      const secretClient = new SecretManagerServiceClient();
      const [version] = await secretClient.accessSecretVersion({
        name: secretResource.trim(),
      });
      const secretPayload = version.payload?.data?.toString();
      if (secretPayload && secretPayload.trim() !== '') {
        cachedGeminiKey = secretPayload.trim();
        return cachedGeminiKey;
      }
    } catch (err: any) {
      // In local container sandbox environments without GCP Application Default Credentials, log a diagnostic notice
      console.warn(`[Security Notice] Secret Manager access for "${secretResource}" could not be completed at runtime: ${err?.message || err}. Checking server environment variables.`);
    }
  }

  // 2. Secondary/Development Route: Check direct server-side environment variable
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    cachedGeminiKey = process.env.GEMINI_API_KEY.trim();
    return cachedGeminiKey;
  }

  throw new Error(`Gemini API credentials could not be resolved from Secret Manager (${secretResource}) or server environment variables.`);
}

/**
 * Returns an initialized GoogleGenAI client singleton.
 */
async function getAI(): Promise<GoogleGenAI> {
  if (!aiClient) {
    const apiKey = await getGeminiApiKey();
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
  idToken?: string;
}

/**
 * Authentication Middleware:
 * Extracts and verifies the Firebase ID Token with Google Identity Toolkit REST API.
 * Guarantees that caller identity is cryptographically verified server-side.
 * The derived authenticated UID is attached to req.user and is the sole source of identity truth.
 */
async function authenticateFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized: Missing Bearer ID token.' });
    return;
  }

  try {
    const apiKey = firebaseConfig.apiKey;
    if (!apiKey) {
      res.status(500).json({ error: 'Server authentication configuration missing.' });
      return;
    }

    // Securely verify token against Google Identity Toolkit endpoint
    const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    const verifyRes = await fetch(lookupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!verifyRes.ok) {
      const errBody = await verifyRes.text();
      console.warn('Firebase token verification rejected by identity provider:', errBody);
      res.status(401).json({ error: 'Unauthorized: Authentication token is invalid, expired, or revoked.' });
      return;
    }

    const data = await verifyRes.json() as { users?: Array<{ localId: string; email?: string }> };
    if (!data.users || data.users.length === 0 || !data.users[0].localId) {
      res.status(401).json({ error: 'Unauthorized: Could not determine verified user identity.' });
      return;
    }

    const verifiedUser = data.users[0];
    req.user = {
      uid: verifiedUser.localId,
      email: verifiedUser.email,
    };

    next();
  } catch (err) {
    console.error('Server error during token verification:', err);
    res.status(401).json({ error: 'Unauthorized: Internal identity verification failure.' });
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'GeminiVault Journal Backend'
  });
});

/**
 * Security & Architecture Status Inspector endpoint
 */
app.get('/api/security/info', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configuredSecretResource = process.env.GEMINI_SECRET_NAME || PRODUCTION_GEMINI_SECRET_NAME;
    const hasKeyOrSecret = Boolean(process.env.GEMINI_API_KEY || configuredSecretResource);
    res.json({
      authenticated: true,
      uid: req.user?.uid || null,
      email: req.user?.email || null,
      isolationPath: `users/${req.user?.uid}/journals/{journalId}`,
      geminiModel: 'gemini-2.5-flash',
      secretManagerResource: configuredSecretResource,
      secretManagerConfigured: Boolean(configuredSecretResource),
      serverTokenVerification: 'Google Identity Toolkit Cryptographic Verification',
      rulesStatus: 'Deny-by-default with strict UID ownership enforcement',
      backendKeyConfigured: hasKeyOrSecret,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve security configuration status.' });
  }
});

/**
 * POST /api/chat
 * Multi-turn conversational journaling with Gemini.
 * Authenticated user only; context is maintained strictly within user session.
 */
app.post('/api/chat', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages, journalId, currentTitle } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Bad Request: "messages" array is required.' });
      return;
    }

    const ai = await getAI();

    // Prepare conversation contents for multi-turn chat
    // Map previous conversation turns to role 'user' or 'model'
    const contents = messages.map((m: { sender: string; content: string }) => ({
      role: m.sender === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 10000) }],
    }));

    const systemInstruction = `You are Gemini, a deeply thoughtful, empathetic, reflective, and intellectually curious personal journaling companion inside GeminiVault Journal.
Your role is to help the user reflect deeply on their thoughts, feelings, work, decisions, and experiences.
Key principles:
1. Be warm, attentive, mindful, and constructive.
2. Ask thoughtful clarifying questions that help the user uncover deeper insights or underlying motives.
3. Validate emotional and intellectual experiences without being sycophantic.
4. Encourage structured thinking (e.g. pros/cons, identifying underlying fears or goals, formulating next steps).
5. Never judge, lecture, or sound robotic. Use concise, eloquent, and conversational language.
6. If the user presents a creative idea or journal reflection, help them refine and expand upon it thoughtfully.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const replyText = response.text || 'I am here with you. Could you share a bit more about what you are experiencing?';

    res.json({
      reply: replyText,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error during /api/chat generation:', err);
    res.status(500).json({
      error: 'Failed to generate AI reflection response.',
      details: err?.message || 'Unknown internal error'
    });
  }
});

/**
 * POST /api/summarize
 * Generates an automatic structured summary of the journal session.
 * Captures themes, key ideas, decisions, unresolved questions, and potential next steps.
 */
app.post('/api/summarize', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages, currentTitle } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Bad Request: "messages" array must contain conversation turns.' });
      return;
    }

    const ai = await getAI();

    // Combine transcript safely
    const transcript = messages
      .map((m: { sender: string; content: string }) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n\n')
      .slice(0, 25000);

    const prompt = `You are an expert cognitive synthesizer and journaling analyst.
Analyze the following private journal session transcript carefully:

---
${transcript}
---

Generate a comprehensive, structured summary capturing:
1. majorThemes: A list of 2 to 5 core topics or themes explored.
2. keyIdeas: A list of 2 to 5 important insights, concepts, or realizations.
3. decisions: A list of decisions made, clarified, or contemplated (or empty array if none).
4. unresolvedQuestions: A list of 1 to 4 open questions or lingering uncertainties.
5. nextSteps: A list of 1 to 4 actionable next steps or focus areas for the user.
6. rawSummaryText: A 2-paragraph cohesive narrative summary synthesizing the emotional tone, cognitive flow, and key takeaway of this journal session.
7. suggestedTitle: A concise, evocative title (3 to 6 words) representing this specific journal entry.

Return ONLY a valid JSON object matching this exact structure:
{
  "majorThemes": ["..."],
  "keyIdeas": ["..."],
  "decisions": ["..."],
  "unresolvedQuestions": ["..."],
  "nextSteps": ["..."],
  "rawSummaryText": "...",
  "suggestedTitle": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback extraction if enclosed in markdown code fences
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const summary = {
      themes: Array.isArray(parsed.majorThemes) ? parsed.majorThemes : [],
      keyIdeas: Array.isArray(parsed.keyIdeas) ? parsed.keyIdeas : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      unresolvedQuestions: Array.isArray(parsed.unresolvedQuestions) ? parsed.unresolvedQuestions : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      rawSummaryText: typeof parsed.rawSummaryText === 'string' ? parsed.rawSummaryText : 'Journal reflection summary successfully compiled.',
      generatedAt: new Date().toISOString(),
    };

    const suggestedTitle = typeof parsed.suggestedTitle === 'string' && parsed.suggestedTitle.trim().length > 0 
      ? parsed.suggestedTitle.trim() 
      : currentTitle || 'Journal Reflection';

    res.json({
      summary,
      suggestedTitle,
    });
  } catch (err: any) {
    console.error('Error during /api/summarize generation:', err);
    res.status(500).json({
      error: 'Failed to generate journal summary.',
      details: err?.message || 'Unknown internal error'
    });
  }
});

/**
 * POST /api/evolution-analysis
 * Journal Evolution Intelligence: Longitudinal reflection analysis across the authenticated user's private journal summaries.
 * Strict UID boundary: Authenticated user context derived solely from cryptographically verified token.
 * Data Isolation: Retrieves journal records directly from Firestore server-side using trusted Google Cloud SDK with ADC.
 * Never accesses, correlates, or exposes another user's journal records.
 */
app.post('/api/evolution-analysis', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const verifiedUid = req.user?.uid;
    if (!verifiedUid) {
      res.status(401).json({ error: 'Unauthorized: Verified user identity missing.' });
      return;
    }

    // Trusted Server-Side Firestore Retrieval:
    // Securely query users/{verifiedUid}/journals using Google Cloud ADC / Cloud Run service account.
    // Strictly isolates query scope to verifiedUid; never queries globally or across tenants.
    let retrievedJournals: any[] = [];
    try {
      const db = getFirestoreClient();
      const snapshot = await db
        .collection('users')
        .doc(verifiedUid)
        .collection('journals')
        .limit(50)
        .get();

      if (!snapshot.empty) {
        retrievedJournals = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    } catch (firestoreErr: any) {
      // Log sanitized status/code only — never log auth tokens or private data
      console.error(`[Firestore Server-Side Access Error] Code: ${firestoreErr?.code || 'UNKNOWN'}, message: ${firestoreErr?.message || 'Error querying user journals'}`);
      res.status(500).json({ error: 'Failed to securely retrieve user journals from Firestore.' });
      return;
    }

    // Filter to only journals that have valid summaries
    const summarizedEntries = retrievedJournals.filter((j: any) => 
      j && 
      j.summary && 
      (Array.isArray(j.summary.themes) || typeof j.summary.rawSummaryText === 'string')
    );

    if (summarizedEntries.length < 2) {
      res.status(400).json({ 
        error: 'Insufficient data: At least two summarized journal sessions are required for Evolution Intelligence analysis.' 
      });
      return;
    }

    // Safe helper to extract timestamp from string or Firestore Timestamp
    const getTime = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'string') return new Date(val).getTime() || 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (typeof val.toDate === 'function') return val.toDate().getTime();
      return 0;
    };

    // Sort chronologically and limit to 15 most recent summarized journals to control prompt size & cost
    const sortedEntries = [...summarizedEntries]
      .sort((a, b) => getTime(a.createdAt || a.updatedAt) - getTime(b.createdAt || b.updatedAt))
      .slice(-15);

    // Build concise, privacy-safe longitudinal context for Gemini
    const longitudinalRecords = sortedEntries.map((j: any, index: number) => {
      const title = String(j.title || 'Untitled Journal').slice(0, 150);
      let date = `Session ${index + 1}`;
      if (j.createdAt) {
        if (typeof j.createdAt === 'string') date = j.createdAt.slice(0, 40);
        else if (typeof j.createdAt.toDate === 'function') date = j.createdAt.toDate().toISOString().slice(0, 40);
      } else if (j.updatedAt) {
        if (typeof j.updatedAt === 'string') date = j.updatedAt.slice(0, 40);
        else if (typeof j.updatedAt.toDate === 'function') date = j.updatedAt.toDate().toISOString().slice(0, 40);
      }
      const themes = Array.isArray(j.summary.themes) ? j.summary.themes.slice(0, 6).map((t: string) => String(t).slice(0, 100)) : [];
      const keyIdeas = Array.isArray(j.summary.keyIdeas) ? j.summary.keyIdeas.slice(0, 6).map((k: string) => String(k).slice(0, 150)) : [];
      const decisions = Array.isArray(j.summary.decisions) ? j.summary.decisions.slice(0, 6).map((d: string) => String(d).slice(0, 150)) : [];
      const unresolved = Array.isArray(j.summary.unresolvedQuestions) ? j.summary.unresolvedQuestions.slice(0, 6).map((u: string) => String(u).slice(0, 150)) : [];
      const nextSteps = Array.isArray(j.summary.nextSteps) ? j.summary.nextSteps.slice(0, 6).map((n: string) => String(n).slice(0, 150)) : [];
      const overview = String(j.summary.rawSummaryText || '').slice(0, 500);

      return `[Entry ${index + 1}] Date: ${date} | Title: "${title}"
Themes: ${themes.join(', ') || 'N/A'}
Key Ideas: ${keyIdeas.join('; ') || 'N/A'}
Decisions: ${decisions.join('; ') || 'N/A'}
Open Questions: ${unresolved.join('; ') || 'N/A'}
Next Steps / Commitments: ${nextSteps.join('; ') || 'N/A'}
Summary: ${overview}`;
    }).join('\n\n---\n\n');

    const prompt = `You are a longitudinal reflection analyst for GeminiVault Journal.
Analyze the following chronological series of private journal summaries belonging to the authenticated user.

---
${longitudinalRecords}
---

Produce a rigorous, structured longitudinal evolution analysis adhering strictly to these rules:
1. RECURRING THEMES: Identify 2 to 5 recurring themes across sessions. Include frequency (count of entries), specific evidence (titles of entries), and trend ("increasing", "stable", or "decreasing").
2. UNRESOLVED QUESTIONS: Identify open questions carried across or lingering from journals. Note firstSeen (e.g. entry title or date), lastSeen, and whether it remains open (stillOpen: true/false).
3. COMMITMENTS: Identify 1 to 5 repeated actions, goals, or intentions stated by the user, categorized as "emerging", "repeated", "resolved", or "abandoned".
4. PRIORITY CHANGES: Identify how the user's focus or priorities evolved from earlier sessions to later sessions (from -> to with concise explanation).
5. DECISION DRIFT: Identify where the user's decisions, stances, or approaches shifted or matured between sessions (earlierPosition -> laterPosition with interpretation).
6. OVERALL REFLECTION: A concise, constructive 2-paragraph synthesis of the user's personal/intellectual growth trajectory.

CRITICAL SAFETY & ETHICAL BOUNDARIES:
- Do NOT diagnose mental health conditions.
- Do NOT infer protected personal traits.
- Do NOT make clinical claims.
- Base all insights solely on the provided user journal records without fabricating external data.

Return ONLY a valid JSON object matching this exact schema:
{
  "recurringThemes": [
    {
      "theme": "string",
      "frequency": 0,
      "evidence": ["string"],
      "trend": "increasing"
    }
  ],
  "unresolvedQuestions": [
    {
      "question": "string",
      "firstSeen": "string",
      "lastSeen": "string",
      "stillOpen": true
    }
  ],
  "commitments": [
    {
      "commitment": "string",
      "status": "emerging"
    }
  ],
  "priorityChanges": [
    {
      "from": "string",
      "to": "string",
      "explanation": "string"
    }
  ],
  "decisionDrift": [
    {
      "earlierPosition": "string",
      "laterPosition": "string",
      "interpretation": "string"
    }
  ],
  "overallReflection": "string"
}`;

    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const validatedAnalysis = {
      recurringThemes: Array.isArray(parsed.recurringThemes) ? parsed.recurringThemes : [],
      unresolvedQuestions: Array.isArray(parsed.unresolvedQuestions) ? parsed.unresolvedQuestions : [],
      commitments: Array.isArray(parsed.commitments) ? parsed.commitments : [],
      priorityChanges: Array.isArray(parsed.priorityChanges) ? parsed.priorityChanges : [],
      decisionDrift: Array.isArray(parsed.decisionDrift) ? parsed.decisionDrift : [],
      overallReflection: typeof parsed.overallReflection === 'string' 
        ? parsed.overallReflection 
        : 'Longitudinal reflection analysis completed based on your private journal vault.',
      analyzedJournalsCount: sortedEntries.length,
      generatedAt: new Date().toISOString(),
    };

    console.log(`[Security Audit] Generated Evolution Intelligence for authenticated user (Journals analyzed: ${sortedEntries.length})`);

    res.json({
      analysis: validatedAnalysis,
    });
  } catch (err: any) {
    console.error('Error during /api/evolution-analysis generation:', err?.message || err);
    res.status(500).json({
      error: 'Failed to generate Evolution Intelligence analysis.',
      details: err?.message || 'Unknown internal error'
    });
  }
});

// ----------------------------------------------------
// VITE SPA MIDDLEWARE INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : (typeof __dirname !== 'undefined' && fs.existsSync(path.join(__dirname, 'index.html'))
        ? __dirname
        : path.join(process.cwd(), 'dist'));
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GeminiVault Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
