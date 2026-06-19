import { NextRequest, NextResponse } from 'next/server';
import { getSwapQuote, getSuiMidPrice } from '@/lib/deepbook/swap';

// GET /api/deepbook/quote?suiMist=5000000000
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const suiMistStr = searchParams.get('suiMist');

    try {
        if (suiMistStr) {
            const suiMist = BigInt(suiMistStr);
            const quote   = await getSwapQuote(suiMist);
            return NextResponse.json({
                suiIn:     quote.suiIn.toString(),
                usdcOut:   quote.usdcOut.toString(),
                priceUsdc: quote.priceUsdc,
            });
        }

        // No amount provided — return mid-price only
        const price = await getSuiMidPrice();
        return NextResponse.json({ priceUsdc: price });
    } catch (err) {
        console.error('[deepbook/quote]', err);
        // Fallback: use reasonable testnet price
        return NextResponse.json(
            { error: 'Quote unavailable', priceUsdc: 3.5 },
            { status: 503 },
        );
    }
}
