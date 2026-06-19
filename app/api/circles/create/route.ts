import { NextRequest, NextResponse } from 'next/server';
import { buildCreateCirclePtb } from '@/lib/sui/ptb';
import { getSuiClient } from '@/lib/sui/client';
import type { CreateCircleParams } from '@/types/circle';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const params: CreateCircleParams = {
            name: body.name,
            contributionAmount: BigInt(body.contributionAmount),
            cycleDurationMs: BigInt(body.cycleDurationMs),
            maxMembers: Number(body.maxMembers),
            rotationType: Number(body.rotationType) as 0 | 1,
            penaltyRateBps: BigInt(body.penaltyRateBps ?? 200),
            allowYield: Boolean(body.allowYield),
            yieldMode: Number(body.yieldMode ?? 0) as 0 | 1 | 2,
            entryDepositRequired: Boolean(body.entryDepositRequired),
            entryDepositAmount: BigInt(body.entryDepositAmount ?? 0),
            signerAddress: body.signerAddress,
        };

        if (!params.name || params.name.length === 0) {
            return NextResponse.json({ error: 'Circle name is required' }, { status: 400 });
        }
        if (params.maxMembers < 2 || params.maxMembers > 20) {
            return NextResponse.json({ error: 'Member count must be 2–20' }, { status: 400 });
        }
        if (params.contributionAmount <= 0n) {
            return NextResponse.json({ error: 'Contribution amount must be positive' }, { status: 400 });
        }

        const tx = buildCreateCirclePtb(params);
        tx.setSender(params.signerAddress);
        const client = getSuiClient();
        const txBytes = await tx.build({ client });

        return NextResponse.json({ txBytes: Array.from(txBytes) });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
