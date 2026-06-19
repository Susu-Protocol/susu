import { NextRequest, NextResponse } from 'next/server';
import { buildSwapPtb, getSwapQuote } from '@/lib/deepbook/swap';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { signerAddress, suiCoinId, suiMist } = body as {
            signerAddress: string;
            suiCoinId:     string;
            suiMist:       string;
        };

        if (!signerAddress || !suiCoinId || !suiMist) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const suiAmount = BigInt(suiMist);

        // Get quote to compute minOut with 2% slippage
        const quote = await getSwapQuote(suiAmount);
        const minUsdcOut = (quote.usdcOut * 98n) / 100n;

        const txBytes = await buildSwapPtb({
            signerAddress,
            suiCoinId,
            suiAmount,
            minUsdcOut,
        });

        return NextResponse.json({
            txBytes:    Array.from(txBytes),
            usdcOut:    quote.usdcOut.toString(),
            minUsdcOut: minUsdcOut.toString(),
            priceUsdc:  quote.priceUsdc,
        });
    } catch (err) {
        console.error('[deepbook/swap]', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Swap build failed' },
            { status: 500 },
        );
    }
}
