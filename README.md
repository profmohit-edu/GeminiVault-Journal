# GeminiVault Journal — Secure Personal AI Journal

GeminiVault Journal is a production-oriented, full-stack personal AI journaling application built with Google AI Studio, React, TypeScript, Express, Firebase Authentication, Cloud Firestore, and Gemini Flash (`gemini-2.5-flash`).

---

## Key Features

1. **Firebase Authentication**: Sign in with Google Identity. All privileged operations require a cryptographically verified Firebase ID token.
2. **Strict Cryptographic Tenant Isolation**: User data is partitioned strictly by UID at `users/{uid}/journals/{journalId}`.
3. **Multi-Turn Conversational Journaling**: Engage in mindful, structured reflections with Gemini Flash. Context is preserved strictly within the authenticated session.
4. **Automatic Cognitive Summarization**: Generates themes, key insights, decisions made, unresolved questions, and next steps with a single click.
5. **Deny-by-Default Firestore Security Rules**: Rules enforce object-level ownership: `allow read, write: if request.auth.uid == userId`.
6. **Server-Side Secret Containment**: Zero client-side Gemini key exposure. Supports Google Cloud Secret Manager for enterprise deployments.
7. **Safe Markdown Rendering**: Strict sanitation prevents XSS and script injection from AI output or user inputs.

---

## Architecture Overview

```
Client (React 19 + Tailwind CSS)
   │
   ├─► Firebase Auth (Google Sign-In -> ID Token)
   ├─► Cloud Firestore (Client SDK, Path: users/{uid}/journals/{journalId})
   │
   └─► Express Backend (Node.js + TSX / CommonJS Bundle)
          ├─► Token Verification Middleware (Google Identity Toolkit)
          ├─► Server-Side Gemini Client (@google/genai, gemini-2.5-flash)
          └─► Google Cloud Secret Manager Integration
```

---

## Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env` and provide the required environment variables:

```bash
# GEMINI_API_KEY: Required for server-side Gemini AI calls
GEMINI_API_KEY="your-gemini-api-key"

# Optional: Google Cloud Secret Manager resource name (for Cloud Run production deployment)
GEMINI_SECRET_NAME="projects/PROJECT_ID/secrets/gemini-api-key/versions/latest"
```

### 2. Development Mode
Run the development server on port 3000:

```bash
npm run dev
```

### 3. Production Build & Start
Compile the client and bundle the backend server:

```bash
npm run build
npm start
```

---

## Security Documentation
- See [`SECURITY.md`](./SECURITY.md) for the complete security architecture and threat model.
- See [`SECURITY_TESTS.md`](./SECURITY_TESTS.md) for the verification test suite.
