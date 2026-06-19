import { NextRequest, NextResponse } from 'next/server';
import { createWidgetSession } from '@/lib/ramp/transak-server';
import { APP_URL } from '@/lib/constants';
import type { RampMode } from '@/lib/ramp/transak';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const walletAddress = body?.walletAddress as string | undefined;
    const mode = body?.mode as RampMode | undefined;

    if (!walletAddress || (mode !== 'BUY' && mode !== 'SELL')) {
        return NextResponse.json({ error: 'walletAddress and mode (BUY|SELL) are required' }, { status: 400 });
    }

    const referrerDomain = new URL(APP_URL).hostname;

    try {
        const widgetUrl = await createWidgetSession({
            walletAddress,
            mode,
            referrerDomain,
            fiatCurrency: body?.fiatCurrency,
            fiatAmount: body?.fiatAmount,
            cryptoAmount: body?.cryptoAmount,
            email: body?.email,
        });
        return NextResponse.json({ widgetUrl });
    } catch (err) {
        console.error('[ramp/session]', err);
        return NextResponse.json({ error: 'Failed to create Transak session' }, { status: 502 });
    }
}
