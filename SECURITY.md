# GeminiVault Journal — Security & Architecture Architecture Document

## 1. Executive Security Summary
GeminiVault Journal is designed under the **Secure AI Application Engineering Constitution (v1.0)**. Security and cryptographic tenant isolation are non-negotiable architectural requirements that take absolute precedence over implementation shortcuts.

---

## 2. Protected Assets & Sensitive Data
1. **User Journal Content**: Private personal thoughts, reflections, introspections, sensitive cognitive logs, and decision trees.
2. **Multi-Turn Conversation Transcripts**: Raw back-and-forth interactions between the user and Gemini.
3. **AI Cognitive Summaries & Syntheses**: Extracted themes, critical ideas, decision logs, open vulnerabilities/questions, and next steps.
4. **User Identifiers**: Google-authenticated UID, email, and profile data.
5. **Privileged Backend Secrets**: Server-side Google Gemini API credentials and Secret Manager access permissions.

---

## 3. Trust Boundaries & Threat Model

```
+-----------------------------------------------------------------------------+
|                          UNTRUSTED CLIENT REALM                             |
|  - Web Browser / Single-Page Application (React + Vite)                     |
|  - Local Storage / Session State                                            |
|  - Untrusted User Prompts & Injections                                      |
+-----------------------------------------------------------------------------+
               | (HTTPS with Firebase ID Token)        | (Direct SDK via Rules)
               v                                       v
+------------------------------------+  +-------------------------------------+
|        TRUSTED SERVER REALM        |  |        CLOUD FIRESTORE REALM        |
| - Express 4 / Node.js Backend      |  | - Deny-by-default Security Rules    |
| - Token Signature Verification     |  | - Strict Path-Based Tenancy:        |
| - Server-Side Gemini API Client    |  |   users/{uid}/journals/{journalId}  |
| - Google Cloud Secret Manager Client| | - Reject cross-user read/write/list |
+------------------------------------+  +-------------------------------------+
```

### Trust Boundary Rules:
- **Client is Untrusted**: Any UID, parameter, or header sent from the browser is treated as untrusted until verified cryptographically.
- **Server Identity Derivation**: The backend derives caller identity exclusively from the validated Firebase ID token via the Google Identity Toolkit verification endpoint.
- **No Client Secrets**: The Gemini API key is never bundled, streamed, or exposed in any client-facing response or bundle.

---

## 4. Authentication Model
- **Provider**: Firebase Authentication with Google Identity (`signInWithPopup`).
- **Token Handling**: Client acquires signed JSON Web Tokens (Firebase ID Tokens) with short TTLs.
- **Backend Verification**: Each protected request (`POST /api/chat`, `POST /api/summarize`, `GET /api/security/info`) transmits `Authorization: Bearer <idToken>`. The server securely verifies the token and binds the verified `localId` (UID) to `req.user.uid`.
- **Fail-Closed**: Any missing, malformed, expired, or invalid token yields an immediate `401 Unauthorized`.

---

## 5. Authorization & Tenant Isolation Model
- **Firestore Isolation Hierarchy**:
  ```
  users/{uid}/journals/{journalId}
  users/{uid}/journals/{journalId}/messages/{messageId}
  ```
- **Rule Enforcement (`firestore.rules`)**:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if false;
      }
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        match /journals/{journalId} {
          allow read, write, delete: if request.auth != null && request.auth.uid == userId;
          match /messages/{messageId} {
            allow read, write, delete: if request.auth != null && request.auth.uid == userId;
          }
        }
      }
    }
  }
  ```
- **Defense-in-Depth**:
  1. Even if an attacker guesses a valid `journalId` belonging to User B, Firestore rejects the operation because the outer path requires `request.auth.uid == userId`.
  2. The server-side API only processes message payloads supplied within the caller's active context and never accesses external user paths.

---

## 6. Secret Management Model
- **Development & AI Studio**: Uses securely injected `process.env.GEMINI_API_KEY`.
- **Production Google Cloud Deployment**:
  - Configurable with Google Cloud Secret Manager using `GEMINI_SECRET_NAME` (e.g., `projects/${PROJECT_ID}/secrets/gemini-api-key/versions/latest`).
  - Fetched via `@google-cloud/secret-manager` using least-privilege IAM service account credentials (`roles/secretmanager.secretAccessor`).
  - Lazy initialization prevents runtime startup crashes if secrets are delayed.
  - Zero secrets in `.env.example`, Git, or client code.

---

## 7. Generative AI Security & Prompt Injection Mitigation
- **Untrusted Input Treatment**: User prompts and journal transcripts are treated as untrusted data.
- **Data Minimization**: Only the active journal's transcripts are transmitted to Gemini.
- **Model Output Sanitization**: Output is parsed strictly and rendered using sanitized React Markdown components to prevent XSS. No raw `innerHTML` or `dangerouslySetInnerHTML` is used.
- **Isolation of Insights**: AI summaries and titles are saved strictly to `users/{uid}/journals/{journalId}`.

---

## 8. Incident Response & Security Contacts
For security disclosures or architecture audits, contact the application security administrator or file a private security report in the project repository.
