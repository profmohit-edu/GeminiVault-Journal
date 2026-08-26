export interface JournalMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalSummary {
  themes: string[];
  keyIdeas: string[];
  decisions: string[];
  unresolvedQuestions: string[];
  nextSteps: string[];
  rawSummaryText: string;
  generatedAt: string;
}

export interface Journal {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: JournalMessage[];
  summary?: JournalSummary | null;
  status?: 'active' | 'archived';
}

export interface EvolutionTheme {
  theme: string;
  frequency: number;
  evidence: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface EvolutionUnresolvedQuestion {
  question: string;
  firstSeen: string;
  lastSeen: string;
  stillOpen: boolean;
}

export interface EvolutionCommitment {
  commitment: string;
  status: 'emerging' | 'repeated' | 'resolved' | 'abandoned';
}

export interface EvolutionPriorityChange {
  from: string;
  to: string;
  explanation: string;
}

export interface EvolutionDecisionDrift {
  earlierPosition: string;
  laterPosition: string;
  interpretation: string;
}

export interface EvolutionAnalysis {
  recurringThemes: EvolutionTheme[];
  unresolvedQuestions: EvolutionUnresolvedQuestion[];
  commitments: EvolutionCommitment[];
  priorityChanges: EvolutionPriorityChange[];
  decisionDrift: EvolutionDecisionDrift[];
  overallReflection: string;
  analyzedJournalsCount?: number;
  generatedAt?: string;
}

export interface SecurityStatusInfo {
  authenticated: boolean;
  uid: string | null;
  email: string | null;
  isolationPath: string;
  geminiModel: string;
  secretManagerConfigured: boolean;
  serverTokenVerification: string;
  rulesStatus: string;
}

