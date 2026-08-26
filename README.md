# GeminiVault Journal

> **Privacy-First Longitudinal AI Reflection System**  
> From private conversations to meaningful patterns across time.

**Live Application:**  
https://geminivault-journal-767337350931.asia-south1.run.app

**Google Cloud Run Service:** `geminivault-journal`  
**Region:** `asia-south1`

---

## 1. One-Line Pitch

GeminiVault Journal transforms authenticated Gemini conversations into structured **Cognitive Summaries** and then into secure longitudinal **Journal Evolution Intelligence**.

---

## 2. The Challenge

AI-assisted applications can look impressive in a prototype while overlooking critical production concerns such as:

- authentication boundaries,
- private-user data isolation,
- server-side authorization,
- credential management,
- production deployment, and
- cross-user access prevention.

GeminiVault Journal was built around a security-first development approach in Google AI Studio and implements production capabilities using Firebase Authentication, Cloud Firestore, Gemini, Google Cloud Secret Manager, and Google Cloud Run.

---

## 3. What Makes This Submission Different

The core innovation is not simply AI journaling.

GeminiVault introduces a three-stage reflection pipeline:

```text
Conversation
     ↓
Cognitive Summary & Synthesis
     ↓
Journal Evolution Intelligence
```

Instead of treating journal sessions as disconnected chats, the system analyzes the authenticated user's summarized journal history to surface continuity and change across time.

Journal Evolution Intelligence can identify:

- recurring themes,
- priority evolution,
- unresolved questions across journal history,
- decision or perspective shifts,
- commitments and intentions, and
- an overall longitudinal synthesis.

---

## 4. Live Demo

**Production application:**  
https://geminivault-journal-767337350931.asia-south1.run.app

The application has been deployed and tested on Google Cloud Run with authenticated multi-turn interaction, cognitive summarization, and Journal Evolution Intelligence.

---

## 5. User Journey

```text
Google Sign-In
      ↓
Private Journal Session
      ↓
Multi-Turn Gemini Conversation
      ↓
Save & Summarize
      ↓
Cognitive Summary & Synthesis
      ↓
Accumulated Private Journal History
      ↓
Journal Evolution Intelligence
```

The workflow deliberately keeps authentication and private-user context at the center of the experience rather than treating them as deployment add-ons.

---

## 6. Core Challenge Capabilities

### Firebase Authentication

Users authenticate through Google Sign-In using Firebase Authentication.

Protected backend operations verify authenticated identity before deriving the user's UID.

### Multi-Turn Gemini Interaction

Users conduct genuine multi-turn journal conversations with Gemini.

Gemini requests execute through the server-side application backend rather than exposing the Gemini server credential to the browser.

### User-Isolated Cloud Firestore Storage

Private application data is organized beneath the authenticated user's UID.

Representative structure:

```text
users/
  {uid}/
    journals/
      {journalId}
    insights/
      evolution
```

Client-accessible Firestore rules enforce authenticated owner access.

### Secure Secret Management

The production backend retrieves the Gemini credential through Google Cloud Secret Manager.

The hardened production runtime references:

```text
projects/for-apac-projects/secrets/gemini-api-key/versions/latest
```

No Gemini secret value is required in client-side `VITE_*` variables.

---

## 7. Original Feature: Journal Evolution Intelligence

**Journal Evolution Intelligence** is the primary feature built beyond the baseline Personal Gemini Journal.

It converts multiple summarized journal sessions into longitudinal reflection.

Conceptually:

```text
Verified Firebase Identity
          ↓
      Verified UID
          ↓
Trusted Cloud Run Backend
          ↓
Server-Side Firestore Access
          ↓
users/{verifiedUid}/journals
          ↓
Summarized Sessions
          ↓
Gemini Longitudinal Analysis
          ↓
Evolution Intelligence
```

The browser is not treated as the authority for selecting which user's journal history is analyzed.

The feature can surface:

### Recurring Themes
Themes that appear repeatedly across summarized journal sessions, including frequency and directional patterns.

### Priority Evolution
How the user's articulated priorities shift across sessions.

### Unresolved Questions
Questions or dilemmas that persist across the journal history.

### Decision Drift
Changes in positions, decisions, or perspectives between earlier and later reflections.

### Commitments & Intentions
Repeated actions, intentions, and commitments that emerge across sessions.

### Overall Longitudinal Synthesis
A consolidated reflection describing continuity, change, and emerging patterns across the available journal history.

The feature also includes an insufficient-data state rather than fabricating longitudinal insights when adequate summarized history is unavailable.

---

## 8. Security by Design

Security controls implemented in the project include:

- Firebase Authentication
- server-side verification of authenticated identity
- UID-derived user scoping
- deny-by-default Firestore security posture
- owner-isolated Firestore paths
- server-side Gemini execution
- Google Cloud Secret Manager
- dedicated Cloud Run runtime service account
- Application Default Credentials for trusted Google Cloud access
- least-privilege IAM for required Firestore operations
- no Gemini secret in frontend `VITE_*` configuration
- no client authority to choose another user's longitudinal dataset

The architecture is designed to reduce specific authentication, authorization, data-isolation, and secret-exposure risks. It is not a claim of perfect or formally verified security.

For further detail, see:

- [`SECURITY.md`](SECURITY.md)
- [`SECURITY_TESTS.md`](SECURITY_TESTS.md)
- [`firestore.rules`](firestore.rules)

---

## 9. Architecture

```text
┌─────────────────────────────────────────────┐
│                React Client                 │
│                                             │
│  Sign-In • Journal • Summary • Evolution   │
└──────────────────────┬──────────────────────┘
                       │ Firebase ID Token
                       ▼
┌─────────────────────────────────────────────┐
│        Node.js / Express on Cloud Run       │
│                                             │
│  • verifies authenticated identity          │
│  • derives verified UID                     │
│  • executes Gemini calls server-side        │
│  • performs trusted Firestore retrieval     │
└───────┬───────────────────┬─────────────────┘
        │                   │
        ▼                   ▼
┌────────────────┐   ┌──────────────────────┐
│ Cloud Firestore│   │ Google Secret Manager│
│                │   │                      │
│ users/{uid}/   │   │ Gemini credential    │
│ journals       │   │ server-side only     │
│ insights       │   └──────────────────────┘
└────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│                  Gemini                     │
│                                             │
│ Conversation • Summary • Evolution Analysis│
└─────────────────────────────────────────────┘
```

---

## 10. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Node.js, Express |
| AI | Gemini |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Production Runtime | Google Cloud Run |
| Secrets | Google Cloud Secret Manager |
| Identity / Authorization | Firebase identity verification, Google Cloud IAM |
| Trusted Cloud Access | Application Default Credentials |
| Development Environment | Google AI Studio |

---

## 11. Authentication and Data Flow

For protected operations:

1. The user authenticates using Firebase Authentication.
2. The browser sends the Firebase identity token to the backend.
3. The backend verifies the authenticated identity.
4. The verified UID determines the authorized user context.
5. Firestore operations remain scoped to the user's data hierarchy.
6. Gemini processing occurs server-side.

For Journal Evolution Intelligence, journal history is retrieved by the trusted backend using the verified UID rather than accepting a browser-selected UID or client-supplied journal dataset.

This prevents the client from becoming the authority over the ownership boundary used for longitudinal analysis.

---

## 12. Firestore Isolation

The project uses user-scoped document paths such as:

```text
users/{userId}/journals/{journalId}
users/{userId}/insights/{insightId}
```

Firestore client rules enforce an owner check based on:

```text
request.auth != null &&
request.auth.uid == userId
```

A default-deny posture prevents unmatched database access.

See [`firestore.rules`](firestore.rules).

---

## 13. Secret Management

The Gemini server credential is managed through Google Cloud Secret Manager.

The production Cloud Run service uses a dedicated runtime identity and retrieves the configured secret server-side.

Production configuration uses:

```text
GEMINI_SECRET_NAME=
projects/for-apac-projects/secrets/gemini-api-key/versions/latest
```

The repository intentionally contains **no Gemini API secret value**.

`.env.example` contains empty placeholders only.

The production architecture therefore separates:

```text
Browser
   ↓
Authenticated Backend
   ↓
Secret Manager
   ↓
Gemini
```

rather than shipping the Gemini credential with client-side application code.

---

## 14. Running Locally

Install dependencies:

```bash
npm install
```

Create a local environment file from the provided example:

```bash
cp .env.example .env
```

Populate only the environment values required for your own environment.

Run the development application:

```bash
npm run dev
```

Do not commit `.env`.

---

## 15. Production Build

Build the frontend and backend bundle:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

The Cloud Run runtime binds to the port supplied through `process.env.PORT` and listens on `0.0.0.0`.

The production backend is bundled into the runtime artifact and serves the production frontend assets together with the protected API routes.

---

## 16. Google AI Studio Development Approach

Before building the application, Google AI Studio was configured with security-oriented custom instructions covering areas including:

- secure coding,
- threat-aware design,
- authentication boundaries,
- user-data isolation,
- server-side authorization,
- secret management, and
- least-privilege access.

Google AI Studio was then used as an AI-assisted development environment to generate, inspect, test, and iteratively improve the application.

The project was subsequently validated in a real Google Cloud production environment rather than relying solely on development-preview behavior.

Security claims are based on the implemented architecture and production verification, not on an assumption that AI-generated code is automatically secure.

---

## 17. Competition Evaluation Mapping

| Criterion | GeminiVault Evidence |
|---|---|
| **Authenticity** | Journal Evolution Intelligence extends the baseline Personal Gemini Journal into longitudinal cognitive synthesis |
| **Usability** | Firebase Google Sign-In, private journal workflow, conversational interaction, Cognitive Summary & Synthesis, and Evolution Intelligence dashboard |
| **Stability** | Production deployment on Google Cloud Run, successful startup, health endpoint, static asset delivery, and successful production API requests |
| **Security** | UID-based isolation, deny-by-default Firestore rules, server-side Gemini, Secret Manager, dedicated runtime identity, and least-privilege cloud access |

---

## 18. Why This Is More Than Chat Memory

Chat history stores previous interactions.

Memory helps an assistant retain useful context.

Session summarization condenses an individual conversation.

**Journal Evolution Intelligence analyzes multiple summarized sessions to identify continuity and change across the user's private journal history.**

The distinction is:

```text
Remembering previous information
              ≠
Analyzing how reflection evolves across sessions
```

GeminiVault therefore treats longitudinal reflection as a separate analytical layer rather than simply displaying old conversations.

---

## 19. Responsible AI

Evolution Intelligence is intended as a reflective aid rather than an objective or diagnostic assessment.

The design therefore emphasizes:

- analysis grounded in available summarized journal sessions,
- clear insufficient-data behavior,
- authenticated user isolation,
- user control over journal creation and summarization, and
- conservative interpretation of longitudinal patterns.

AI-generated longitudinal observations should be treated as reflective interpretations that may require user judgment and contextual validation.

The application is not intended to provide medical, psychological, or diagnostic advice.

---

## 20. Current Limitations

- Longitudinal output quality depends on the quantity and quality of summarized journal sessions.
- A small number of sessions provides limited evidence for long-term patterns.
- AI-generated interpretations may require user judgment and contextual validation.
- Current production verification demonstrates the implemented workflow but does not constitute formal security certification.
- Cloud service availability and external API availability can affect application operation.

---

## 21. Future Scope

Potential future extensions include:

- richer longitudinal visualization,
- user-controlled insight categories,
- exportable reflection reports,
- configurable retention and deletion controls,
- additional audit and observability capabilities,
- stronger automated security regression testing, and
- larger-scale longitudinal evaluation.

Future development should preserve the same authenticated, user-isolated, server-authorized data boundary.

---

## Challenge Requirement Traceability

| Requirement | GeminiVault Implementation | Status |
|---|---|---|
| Firebase Authentication | Google Sign-In through Firebase Authentication | Verified |
| Multi-turn Gemini | Server-side conversational Gemini workflow | Verified |
| Persistent storage | UID-scoped Cloud Firestore journal storage | Verified |
| User isolation | Firestore rules + server-derived authenticated UID | Verified |
| Secret management | Google Cloud Secret Manager | Verified |
| Production deployment | Google Cloud Run | Verified |
| Original enhancement | Journal Evolution Intelligence | Verified in production |

---

## Production Verification

The production service has been deployed to Google Cloud Run as:

```text
Project: for-apac-projects
Service: geminivault-journal
Region: asia-south1
```

Production verification included:

- successful Cloud Run revision readiness,
- 100% traffic routed to the ready revision,
- successful application startup,
- HTTP `200` health response,
- successful frontend/static asset delivery,
- successful authenticated Gemini chat requests,
- successful journal summarization, and
- successful Journal Evolution Intelligence generation.

---

## Repository Security

Before public release, the repository and its Git history were reviewed for credential-like values.

The repository contains:

- no committed `.env`,
- no Gemini API secret,
- no service-account private-key file,
- no OAuth bearer token,
- no GitHub access token, and
- no private-key material.

The Firebase web configuration contains a Firebase client `apiKey`. This is part of the browser-delivered Firebase configuration and is distinct from the server-side Gemini credential.

The Gemini credential remains server-side and is retrieved through Google Cloud Secret Manager in production.

---

## Additional Security Documentation

The repository includes dedicated security artifacts:

### `SECURITY.md`

Documents the security architecture, trust boundaries, authentication model, secret handling, and production controls.

### `SECURITY_TESTS.md`

Documents security-oriented validation and regression scenarios.

### `firestore.rules`

Defines the user-isolated Firestore access-control boundary.

These files are intentionally included so that the project's security claims can be inspected rather than merely stated.

---

## Submission Deliverables

This repository supports the challenge submission together with:

1. **Cloud Run live application / walkthrough**
2. **Application source code**
3. **Deployment and configuration documentation**
4. **Firestore security rules**
5. **Security architecture documentation**
6. **Journal Evolution Intelligence explanation**
7. **Public social showcase**

---

## Competition

GeminiVault Journal was built for the Personal Gemini Journal challenge and extended beyond the baseline implementation with secure longitudinal reflection intelligence.

**#AccelerateAIwithCloudRun**