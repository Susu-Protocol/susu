import { NextRequest, NextResponse } from 'next/server';
import { buildDepositToVaultPtb } from '@/lib/sui/ptb';
import { getSuiClient } from '@/lib/sui/client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { circleId, usdcCoinId, amount, signerAddress } = body;

        if (!circleId || !usdcCoinId || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const tx = buildDepositToVaultPtb({
            circleId,
            usdcCoinId,
            amount: BigInt(amount),
            signerAddress,
        });

        const client = getSuiClient();
        const txBytes = await tx.build({ client });
        return NextResponse.json({ txBytes: Array.from(txBytes) });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
