import { NextResponse } from 'next/server';
import { getSuiClient } from '@/lib/sui/client';
import { generateNonce, generateRandomness } from '@mysten/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export async function GET() {
    try {
        const client = getSuiClient();
        const state = await client.getLatestSuiSystemState();
        const currentEpoch = Number(state.epoch);
        const maxEpoch = currentEpoch + 2;

        const ephemeralKeyPair = Ed25519Keypair.generate();
        const randomness = generateRandomness();
        const nonce = generateNonce(
            ephemeralKeyPair.getPublicKey(),
            maxEpoch,
            randomness,
        );

        return NextResponse.json({
            nonce,
            maxEpoch,
            randomness,
            ephemeralPublicKey: ephemeralKeyPair.getPublicKey().toBase64(),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
