import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Key, Database, Cpu, CheckCircle2, X, ExternalLink, RefreshCw } from 'lucide-react';
import { getAuthToken } from '../lib/firebase';
import type { SecurityStatusInfo } from '../types';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  email?: string | null;
}

export function SecurityModal({ isOpen, onClose, uid, email }: SecurityModalProps) {
  const [serverInfo, setServerInfo] = useState<SecurityStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) throw new Error('No active authentication token found.');

      const res = await fetch('/api/security/info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Security status check failed (${res.status})`);
      }

      const data = await res.json();
      setServerInfo(data);
    } catch (err: any) {
      console.error('Failed to load security info:', err);
      setError(err?.message || 'Error communicating with security endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSecurityStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div id="security-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="security-modal-dialog" 
        className="bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-stone-100">Privacy & Security Inspector</h2>
              <p className="text-xs text-stone-400">Mandatory security and isolation architecture</p>
            </div>
          </div>
          <button
            id="close-security-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Identity & Boundary Status */}
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Verified Identity Context
              </span>
              <button 
                onClick={fetchSecurityStatus} 
                disabled={loading}
                className="text-xs text-stone-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-verify</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800">
                <span className="text-stone-400 block text-[11px] mb-0.5">Authenticated User (Derived UID):</span>
                <span className="font-mono text-stone-200 break-all text-[11px]">{uid}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800">
                <span className="text-stone-400 block text-[11px] mb-0.5">Email Identity:</span>
                <span className="text-stone-200">{email || 'Authenticated via Google Identity'}</span>
              </div>
            </div>
          </div>

          {/* Core Security Guarantees */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Architectural Invariants
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Item 1 */}
              <div className="p-3.5 rounded-xl bg-stone-850 border border-stone-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-stone-200 flex items-center justify-between">
                    <span>Isolated Firestore Partition</span>
                    <span className="font-mono text-[10px] text-amber-400/90 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                      users/{'{uid}'}/journals
                    </span>
                  </div>
                  <p className="text-stone-400 mt-1 leading-relaxed text-[11px]">
                    Every journal document and message belongs exclusively to your cryptographic UID. Queries from other users cannot list, view, or modify your records.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3.5 rounded-xl bg-stone-850 border border-stone-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-stone-200 flex items-center justify-between">
                    <span>Server-Side Gemini API Containment</span>
                    <span className="font-mono text-[10px] text-emerald-400/90 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      gemini-2.5-flash
                    </span>
                  </div>
                  <p className="text-stone-400 mt-1 leading-relaxed text-[11px]">
                    All AI interactions and summarizations execute strictly on the backend. The browser never receives or exposes Gemini API keys or service account credentials.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-3.5 rounded-xl bg-stone-850 border border-stone-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-stone-200">
                    Deny-by-Default Firestore Security Rules
                  </div>
                  <p className="text-stone-400 mt-1 leading-relaxed text-[11px]">
                    Enforced at the cloud database level: <code className="text-stone-300">allow read, write: if request.auth.uid == userId</code>. Unauthenticated access and cross-user snooping are rejected immediately.
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="p-3.5 rounded-xl bg-stone-850 border border-stone-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-stone-200">
                    Google Cloud Secret Manager Architecture
                  </div>
                  <p className="text-stone-400 mt-1 leading-relaxed text-[11px]">
                    In deployed production environments, secrets are lazily fetched from Secret Manager using least-privilege IAM service identity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-900/90 flex items-center justify-between text-xs text-stone-400">
          <span>GeminiVault Security Constitution v1.0 Compliant</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
