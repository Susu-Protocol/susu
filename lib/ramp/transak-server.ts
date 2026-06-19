// Server-only Transak integration. Never import this from a client component —
// it handles the partner API secret and access token.
import crypto from 'crypto';
import type { RampMode } from './transak';

const ENV = (process.env.NEXT_PUBLIC_TRANSAK_ENV ?? 'STAGING') as 'STAGING' | 'PRODUCTION';
const API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY ?? '';
const API_SECRET = process.env.TRANSAK_SECRET_KEY ?? '';

const REFRESH_TOKEN_URL = {
    STAGING: 'https://api-stg.transak.com/partners/api/v2/refresh-token',
    PRODUCTION: 'https://api.transak.com/partners/api/v2/refresh-token',
};

const SESSION_URL = {
    STAGING: 'https://api-gateway-stg.transak.com/api/v2/auth/session',
    PRODUCTION: 'https://api-gateway.transak.com/api/v2/auth/session',
};

// The access token is valid 7 days; Transak's docs warn against refreshing on
// every request, so we cache it in module scope for the life of the server process.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
        return cachedToken.accessToken;
    }

    const res = await fetch(REFRESH_TOKEN_URL[ENV], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-secret': API_SECRET,
        },
        body: JSON.stringify({ apiKey: API_KEY }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Transak refresh-token failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    const accessToken = json?.data?.accessToken;
    const expiresAt = json?.data?.expiresAt;
    if (!accessToken) {
        throw new Error('Transak refresh-token response missing accessToken');
    }

    cachedToken = {
        accessToken,
        // expiresAt comes back as a unix timestamp (seconds); fall back to 6 days if absent.
        expiresAt: expiresAt ? expiresAt * 1000 : Date.now() + 6 * 24 * 60 * 60 * 1000,
    };
    return accessToken;
}

export interface CreateSessionParams {
    walletAddress: string;
    mode: RampMode;
    referrerDomain: string;
    fiatCurrency?: string;
    fiatAmount?: number;
    cryptoAmount?: number;
    email?: string;
}

const NETWORK = 'sui';
const CRYPTO_CODE = 'USDC';
const THEME_COLOR = 'C4522A';

export async function createWidgetSession(params: CreateSessionParams): Promise<string> {
    const accessToken = await getAccessToken();

    const widgetParams: Record<string, unknown> = {
        apiKey: API_KEY,
        referrerDomain: params.referrerDomain,
        network: NETWORK,
        cryptoCurrencyCode: CRYPTO_CODE,
        walletAddress: params.walletAddress,
        productsAvailed: [params.mode],
        disableWalletAddressForm: true,
        themeColor: THEME_COLOR,
        isFeeCalculationHidden: false,
    };
    if (params.fiatCurrency) widgetParams.fiatCurrency = params.fiatCurrency;
    if (params.fiatAmount) widgetParams.fiatAmount = params.fiatAmount;
    if (params.cryptoAmount) widgetParams.cryptoAmount = params.cryptoAmount;
    if (params.email) widgetParams.email = params.email;

    const res = await fetch(SESSION_URL[ENV], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access-token': accessToken,
        },
        body: JSON.stringify({ widgetParams }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Transak create-session failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    const widgetUrl = json?.data?.widgetUrl;
    if (!widgetUrl) {
        throw new Error('Transak create-session response missing widgetUrl');
    }
    return widgetUrl;
}

function base64UrlDecode(str: string): Buffer {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Verifies and decodes a Transak webhook JWT. Per their docs, the webhook body's
 * `data` field is a JWT signed (HS256) with the Partner Access Token as the secret.
 */
export async function verifyAndDecodeWebhook(token: string): Promise<Record<string, unknown> | null> {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const accessToken = await getAccessToken();
    const expectedSig = crypto
        .createHmac('sha256', accessToken)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    if (expectedSig.length !== signatureB64.length) return null;
    const valid = crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signatureB64));
    if (!valid) return null;

    try {
        return JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
    } catch {
        return null;
    }
}
