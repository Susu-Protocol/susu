import { NextRequest, NextResponse } from 'next/server';
import { verifyAndDecodeWebhook } from '@/lib/ramp/transak-server';

// Transak calls this URL when an order's status changes. The body's `data`
// field is a JWT signed (HS256) with our Partner Access Token as the secret —
// see https://docs.transak.com/guides/how-to-decrypt-webhook-payload

export async function POST(req: NextRequest) {
    const payload = await req.json().catch(() => null);
    const token = payload?.data as string | undefined;
    if (!token) {
        return NextResponse.json({ error: 'Missing data field' }, { status: 400 });
    }

    const claims = await verifyAndDecodeWebhook(token).catch(() => null);
    if (!claims) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData = claims.webhookData as Record<string, unknown> | undefined;
    const eventID     = claims.eventID as string;
    const status      = webhookData?.status as string;
    const orderId     = webhookData?.id as string;
    const walletAddr  = webhookData?.walletAddress as string;

    console.log(`[transak-webhook] event=${eventID} order=${orderId} status=${status} wallet=${walletAddr}`);

    // In production: persist order to DB, send notification, trigger any post-ramp logic
    // For example, after AWAITING_PAYMENT_FROM_USER for a SELL order, you'd build
    // and execute the on-chain USDC transfer automatically.

    return NextResponse.json({ received: true });
}
