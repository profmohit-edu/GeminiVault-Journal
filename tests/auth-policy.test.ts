import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  canAccessUidScope,
  extractVerifiedIdentity,
  journalRootForUid,
} from '../src/lib/authPolicy';

test('accepts a verified anonymous Firebase identity without an email', () => {
  assert.deepEqual(extractVerifiedIdentity([{ localId: 'anon-uid-123' }]), {
    uid: 'anon-uid-123',
    email: undefined,
    authenticationMethod: 'anonymous',
  });
});

test('preserves existing Google authentication classification', () => {
  assert.deepEqual(extractVerifiedIdentity([{
    localId: 'google-uid-456',
    email: 'privacy-safe@example.invalid',
    providerUserInfo: [{ providerId: 'google.com' }],
  }]), {
    uid: 'google-uid-456',
    email: 'privacy-safe@example.invalid',
    authenticationMethod: 'google',
  });
});

test('rejects lookup results without a server-verified localId', () => {
  assert.equal(extractVerifiedIdentity([]), null);
  assert.equal(extractVerifiedIdentity([{}]), null);
});

test('constructs a UID-scoped journal root', () => {
  assert.equal(journalRootForUid('anon-uid-123'), 'users/anon-uid-123/journals');
  assert.throws(() => journalRootForUid(''), /Verified UID/);
});

test('denies cross-UID access while allowing the authenticated UID', () => {
  assert.equal(canAccessUidScope('uid-a', 'uid-a'), true);
  assert.equal(canAccessUidScope('uid-a', 'uid-b'), false);
  assert.equal(canAccessUidScope('', 'uid-a'), false);
});

test('Firestore rules enforce authenticated UID equality and deny unmatched paths', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /request\.auth\.uid\s*==\s*userId/);
  assert.match(rules, /match \/\{document=\*\*\}[\s\S]*allow read, write: if false/);
});
