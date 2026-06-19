import { NextRequest, NextResponse } from 'next/server';
import { buildContributePtb } from '@/lib/sui/ptb';
import { getSuiClient } from '@/lib/sui/client';
import type { ContributeParams } from '@/types/circle';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const params: ContributeParams = {
            circleId: body.circleId,
            cycleId: body.cycleId,
            contributionAmount: BigInt(body.contributionAmount),
            allowYield: Boolean(body.allowYield),
            isLastContribution: Boolean(body.isLastContribution),
            usdcCoinId: body.usdcCoinId,
            scallopPoolId: body.scallopPoolId,
            signerAddress: body.signerAddress,
        };

        if (!params.circleId || !params.usdcCoinId) {
            return NextResponse.json(
                { error: 'circleId and usdcCoinId are required' },
                { status: 400 },
            );
        }

        const tx = buildContributePtb(params);
        const client = getSuiClient();
        const txBytes = await tx.build({ client });

        return NextResponse.json({ txBytes: Array.from(txBytes) });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
