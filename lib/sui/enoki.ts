'use client';

/**
 * Enoki integration layer.
 *
 * EnokiFlow handles the entire zkLogin lifecycle:
 *   - Ephemeral key generation
 *   - Nonce creation (via Enoki API — no manual Sui epoch call needed)
 *   - Google OAuth redirect URL construction
 *   - id_token → ZK proof fetching (via Enoki API — no raw prover call)
 *   - Session persistence (localStorage)
 *   - Keypair derivation for signing transactions
 *
 * All consumer code imports from this module instead of the old zklogin.ts.
 */

import { EnokiFlow, createLocalStorage } from '@mysten/enoki';
import type { EnokiKeypair } from '@mysten/enoki';

type EnokiNetwork = 'mainnet' | 'testnet' | 'devnet';

const NETWORK: EnokiNetwork =
    (process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet') as EnokiNetwork;

// ─── Singleton ────────────────────────────────────────────────────────────────

let _flow: EnokiFlow | null = null;

/**
 * Returns the shared EnokiFlow instance (browser-only).
 * Lazily initialised on first call.
 */
export function getEnokiFlow(): EnokiFlow {
    if (typeof window === 'undefined') {
        throw new Error('EnokiFlow is client-side only');
    }
    if (!_flow) {
        _flow = new EnokiFlow({
            apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
            store: createLocalStorage(),
        });
    }
    return _flow;
}

// ─── Auth URL ─────────────────────────────────────────────────────────────────

/**
 * Build the Google OAuth redirect URL.
 * Enoki calls its own API to generate the ephemeral keypair + nonce,
 * then returns the fully-constructed authorization URL.
 */
export async function createGoogleAuthURL(): Promise<string> {
    const flow = getEnokiFlow();
    return flow.createAuthorizationURL({
        provider: 'google',
        clientId: process.env.NEXT_PUBLIC_ZKLOGIN_GOOGLE_CLIENT_ID!,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/login/callback`,
        network: NETWORK,
        extraParams: { scope: ['email'] },
    });
}

// ─── Callback handling ────────────────────────────────────────────────────────

/**
 * Process the id_token from the OAuth callback hash.
 * Enoki fetches the ZK proof, derives the Sui address, and persists the session.
 *
 * @param hash  Optional URL hash string (defaults to window.location.hash)
 * @returns     The Sui address, or null if nothing to handle
 */
export async function handleEnokiCallback(hash?: string): Promise<string | null> {
    const flow = getEnokiFlow();
    // handleAuthCallback returns the OAuth `state` param, not the address.
    // The address is stored in flow.$zkLoginState after the API call completes.
    await flow.handleAuthCallback(hash);
    return flow.$zkLoginState.get().address ?? null;
}

// ─── Session access ───────────────────────────────────────────────────────────

/**
 * Returns the raw Enoki session (contains ephemeral keypair, proof, etc.)
 * or null if the user is not signed in / session is expired.
 */
export async function getEnokiSession() {
    const flow = getEnokiFlow();
    return flow.getSession();
}

/**
 * Returns the EnokiKeypair for the active session.
 * The keypair can sign transactions and personal messages.
 * Throws if the user is not signed in or the session has expired.
 */
export async function requireKeypair(): Promise<EnokiKeypair> {
    const flow = getEnokiFlow();
    const session = await flow.getSession();
    if (!session) {
        throw new Error('Not signed in — please sign in with Google to continue.');
    }
    return flow.getKeypair({ network: NETWORK });
}

/**
 * Returns the Sui address for the active session, or null if not signed in.
 */
export async function getEnokiAddress(): Promise<string | null> {
    try {
        const flow = getEnokiFlow();
        // Try the fast path first: address cached in $zkLoginState
        const cached = flow.$zkLoginState.get().address;
        if (cached) return cached;
        // Fall back to full keypair derivation (triggers proof fetch if needed)
        const keypair = await requireKeypair();
        return keypair.getPublicKey().toSuiAddress();
    } catch {
        return null;
    }
}

// ─── Transaction signing ──────────────────────────────────────────────────────

/**
 * Sign raw transaction bytes with the Enoki zkLogin keypair.
 * Returns the serialised zkLogin signature string ready for executeTransactionBlock.
 */
export async function signWithEnoki(txBytes: Uint8Array): Promise<string> {
    const keypair = await requireKeypair();
    const { signature } = await keypair.signTransaction(txBytes);
    return signature;
}

// ─── Sign-out ─────────────────────────────────────────────────────────────────

/**
 * Clear the Enoki session and the server-side address cookie.
 */
export async function enokiLogout(): Promise<void> {
    const flow = getEnokiFlow();
    await flow.logout();
    document.cookie = 'susu_address=; path=/; max-age=0';
}
