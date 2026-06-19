import { NextResponse } from 'next/server';
import { fetchRates } from '@/lib/fiat/rates';

export const revalidate = 3600; // 1 hour

export async function GET() {
    const data = await fetchRates();
    return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    });
}
