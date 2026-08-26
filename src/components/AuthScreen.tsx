import { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { ShieldCheck, Lock, Sparkles, Key, FileCheck, Layers, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err?.message || 'Failed to complete Google Sign-In. Please check popups or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-container" className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-between selection:bg-amber-500/30">
      {/* Top Bar */}
      <header id="auth-header" className="px-6 py-5 border-b border-stone-800 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold tracking-tight text-lg text-stone-100">GeminiVault</span>
            <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700 font-mono">Journal v1.0</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-stone-400 bg-stone-800/60 px-3 py-1.5 rounded-lg border border-stone-700/60">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict User Isolation Enforced</span>
        </div>
      </header>

      {/* Main Hero Card */}
      <main id="auth-main" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full">
          <div className="bg-stone-850 border border-stone-800 rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Subtle glow accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-800 border border-stone-700 text-amber-400 mb-2">
                <Sparkles className="w-7 h-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-medium tracking-tight text-stone-50">
                Your Private AI Sanctuary
              </h1>
              <p className="text-stone-400 text-base leading-relaxed max-w-md mx-auto">
                Reflect, converse, and uncover cognitive insights with multi-turn Gemini intelligence, persisted strictly to your private vault.
              </p>
            </div>

            {error && (
              <div id="auth-error-alert" className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                <p className="flex-1">{error}</p>
              </div>
            )}

            {/* Google Sign-In Action */}
            <div className="space-y-4">
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 py-3.5 px-6 rounded-xl bg-stone-100 text-stone-900 font-medium hover:bg-white active:scale-[0.99] transition-all duration-150 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying session with Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                    <ArrowRight className="w-4 h-4 text-stone-500" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-stone-500">
                Protected by Firebase Authentication. No passwords stored.
              </p>
            </div>

            {/* Architecture Guarantees Grid */}
            <div className="mt-8 pt-8 border-t border-stone-800/80 grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-stone-200">UID-Scoped Isolation</div>
                  <div className="text-[11px] text-stone-400">users/{'{uid}'}/journals</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 flex items-start space-x-2.5">
                <Key className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-stone-200">Server-Side Gemini</div>
                  <div className="text-[11px] text-stone-400">Zero API key leakage</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 flex items-start space-x-2.5">
                <FileCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-stone-200">Deny-All Rules</div>
                  <div className="text-[11px] text-stone-400">Strict Firestore boundary</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 flex items-start space-x-2.5">
                <Layers className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-stone-200">Auto Summarizer</div>
                  <div className="text-[11px] text-stone-400">Themes & Next Steps</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="auth-footer" className="px-6 py-4 border-t border-stone-800 text-center text-xs text-stone-500">
        GeminiVault Journal &bull; Built with Google AI Studio &bull; End-to-End Cryptographic Identity & Data Isolation
      </footer>
    </div>
  );
}
