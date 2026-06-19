import { NextRequest, NextResponse } from 'next/server';
import { getCircle } from '@/lib/sui/read';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const circle = await getCircle(id);
        if (!circle) {
            return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
        }
        return NextResponse.json(circle, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
