import { NextRequest, NextResponse } from 'next/server';
import { readAccruedYield } from '@/lib/scallop/yield';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { positionId } = body;

        if (!positionId) {
            return NextResponse.json({ error: 'positionId is required' }, { status: 400 });
        }

        const summary = await readAccruedYield(positionId);
        return NextResponse.json({
            principal: summary.principal.toString(),
            yield: summary.yield.toString(),
            apy: summary.apy,
            elapsedMs: summary.elapsedMs.toString(),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
