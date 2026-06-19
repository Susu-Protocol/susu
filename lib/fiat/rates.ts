// Exchange rates: how many units of currency X per 1 USD
// Fetched server-side and cached; client reads via /api/fiat/rates

export interface RatesResponse {
    base:      string;
    rates:     Record<string, number>;
    updatedAt: number; // unix ms
}

const FALLBACK_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    NGN: 1580,
    KES: 129,
    GHS: 15.6,
    ZAR: 18.2,
    INR: 83.5,
    KRW: 1340,
    IDR: 15900,
    MXN: 17.1,
    BRL: 4.97,
    AUD: 1.54,
    JPY: 149,
    CNY: 7.24,
    PHP: 56.4,
    EGP: 30.9,
    TZS: 2500,
};

// Server-side: fetch live rates (free tier, no key)
export async function fetchRates(): Promise<RatesResponse> {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
            next: { revalidate: 3600 }, // revalidate every hour
        });
        if (!res.ok) throw new Error('Rate API error');
        const data = await res.json();
        return {
            base:      'USD',
            rates:     data.rates as Record<string, number>,
            updatedAt: Date.now(),
        };
    } catch {
        return { base: 'USD', rates: FALLBACK_RATES, updatedAt: Date.now() };
    }
}

// Convert a USD amount to local currency
export function convertFromUSD(usdAmount: number, rate: number): number {
    return usdAmount * rate;
}

// Convert a local currency amount to USD
export function convertToUSD(localAmount: number, rate: number): number {
    return localAmount / rate;
}

// Convert USDC (6-decimal bigint) to local currency number
export function usdcToLocal(usdcRaw: bigint, rate: number): number {
    return (Number(usdcRaw) / 1_000_000) * rate;
}
