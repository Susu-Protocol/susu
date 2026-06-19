import { NextRequest, NextResponse } from 'next/server';
import { buildStartCirclePtb } from '@/lib/sui/ptb';
import { getSuiClient } from '@/lib/sui/client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body.circleId) return NextResponse.json({ error: 'circleId is required' }, { status: 400 });
        if (!body.signerAddress) return NextResponse.json({ error: 'signerAddress is required' }, { status: 400 });

        const tx = buildStartCirclePtb({ circleId: body.circleId, signerAddress: body.signerAddress });
        tx.setSender(body.signerAddress);
        const client = getSuiClient();
        const txBytes = await tx.build({ client });

        return NextResponse.json({ txBytes: Array.from(txBytes) });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
