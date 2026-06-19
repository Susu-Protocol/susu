export interface Currency {
    code:   string;
    symbol: string;
    name:   string;
    locale: string;
    flag:   string;
}

export const CURRENCIES: Record<string, Currency> = {
    USD: { code: 'USD', symbol: '$',  name: 'US Dollar',         locale: 'en-US', flag: '🇺🇸' },
    EUR: { code: 'EUR', symbol: '€',  name: 'Euro',              locale: 'de-DE', flag: '🇪🇺' },
    GBP: { code: 'GBP', symbol: '£',  name: 'British Pound',     locale: 'en-GB', flag: '🇬🇧' },
    NGN: { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',    locale: 'en-NG', flag: '🇳🇬' },
    KES: { code: 'KES', symbol: 'KSh',name: 'Kenyan Shilling',   locale: 'en-KE', flag: '🇰🇪' },
    GHS: { code: 'GHS', symbol: 'GH₵',name: 'Ghanaian Cedi',    locale: 'en-GH', flag: '🇬🇭' },
    ZAR: { code: 'ZAR', symbol: 'R',  name: 'South African Rand',locale: 'en-ZA', flag: '🇿🇦' },
    INR: { code: 'INR', symbol: '₹',  name: 'Indian Rupee',      locale: 'en-IN', flag: '🇮🇳' },
    KRW: { code: 'KRW', symbol: '₩',  name: 'South Korean Won',  locale: 'ko-KR', flag: '🇰🇷' },
    IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', flag: '🇮🇩' },
    MXN: { code: 'MXN', symbol: 'MX$',name: 'Mexican Peso',      locale: 'es-MX', flag: '🇲🇽' },
    BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real',    locale: 'pt-BR', flag: '🇧🇷' },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', flag: '🇦🇺' },
    JPY: { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',      locale: 'ja-JP', flag: '🇯🇵' },
    CNY: { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',      locale: 'zh-CN', flag: '🇨🇳' },
    PHP: { code: 'PHP', symbol: '₱',  name: 'Philippine Peso',   locale: 'fil-PH',flag: '🇵🇭' },
    EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound',    locale: 'ar-EG', flag: '🇪🇬' },
    TZS: { code: 'TZS', symbol: 'TSh',name: 'Tanzanian Shilling',locale: 'sw-TZ', flag: '🇹🇿' },
};

// Maps each seeded circle's country to its currency
export const COUNTRY_CURRENCY: Record<string, string> = {
    'Nigeria':       'NGN',
    'Kenya':         'KES',
    'India':         'INR',
    'South Korea':   'KRW',
    'Indonesia':     'IDR',
    'Mexico':        'MXN',
    'United States': 'USD',
    'France':        'EUR',
    'Brazil':        'BRL',
    'Australia':     'AUD',
    'Ghana':         'GHS',
    'South Africa':  'ZAR',
    'Japan':         'JPY',
    'China':         'CNY',
    'Philippines':   'PHP',
    'Egypt':         'EGP',
    'Tanzania':      'TZS',
    'United Kingdom':'GBP',
};

export function getCurrency(code: string): Currency {
    return CURRENCIES[code] ?? CURRENCIES.USD;
}

// Format a USDC amount (raw u64, 6 decimals) in a given fiat currency
export function formatInFiat(
    usdcRaw: bigint,
    currencyCode: string,
    rateUsdToLocal: number,
    opts?: { compact?: boolean },
): string {
    const usdValue = Number(usdcRaw) / 1_000_000;
    const localValue = usdValue * rateUsdToLocal;
    const cur = getCurrency(currencyCode);

    try {
        return new Intl.NumberFormat(cur.locale, {
            style:    'currency',
            currency: currencyCode,
            notation: opts?.compact ? 'compact' : 'standard',
            maximumFractionDigits: currencyCode === 'KRW' || currencyCode === 'IDR' ? 0 : 2,
        }).format(localValue);
    } catch {
        return `${cur.symbol}${localValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
}

export const POPULAR_CURRENCIES = ['USD', 'EUR', 'NGN', 'KES', 'INR', 'KRW', 'IDR', 'MXN', 'BRL', 'AUD', 'GBP', 'GHS'];
