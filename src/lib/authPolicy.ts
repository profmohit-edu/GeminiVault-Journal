export interface IdentityToolkitUser {
  localId?: string;
  email?: string;
  providerUserInfo?: Array<{ providerId?: string }>;
}

export interface VerifiedIdentity {
  uid: string;
  email?: string;
  authenticationMethod: 'anonymous' | 'google' | 'firebase';
}

export function extractVerifiedIdentity(users?: IdentityToolkitUser[]): VerifiedIdentity | null {
  const user = users?.[0];
  if (!user?.localId) return null;
  const providers = user.providerUserInfo?.map((item) => item.providerId) ?? [];
  const authenticationMethod = providers.includes('google.com')
    ? 'google'
    : (!user.email && providers.length === 0 ? 'anonymous' : 'firebase');
  return { uid: user.localId, email: user.email, authenticationMethod };
}

export function journalRootForUid(uid: string): string {
  if (!uid.trim()) throw new Error('Verified UID is required.');
  return `users/${uid}/journals`;
}

export function canAccessUidScope(authenticatedUid: string, requestedUid: string): boolean {
  return Boolean(authenticatedUid) && authenticatedUid === requestedUid;
}
