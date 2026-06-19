import { NextRequest, NextResponse } from 'next/server';
import { buildEndCyclePtb } from '@/lib/sui/ptb';
import { getSuiClient } from '@/lib/sui/client';
import type { EndCycleParams } from '@/types/circle';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const params: EndCycleParams = {
            circleId: body.circleId,
            cycleId: body.cycleId,
            yieldPositionId: body.yieldPositionId,
            scallopPoolId: body.scallopPoolId,
            onTimeMembers: body.onTimeMembers ?? [],
            membershipTokenIds: body.membershipTokenIds ?? [],
            isLastCycle: Boolean(body.isLastCycle),
            signerAddress: body.signerAddress,
        };

        if (!params.circleId || !params.cycleId) {
            return NextResponse.json(
                { error: 'circleId and cycleId are required' },
                { status: 400 },
            );
        }

        const tx = buildEndCyclePtb(params);
        const client = getSuiClient();
        const txBytes = await tx.build({ client });

        return NextResponse.json({ txBytes: Array.from(txBytes) });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
