'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatInFiat, getCurrency } from '@/lib/fiat/currencies';
import { getStoredCurrency } from './CurrencySelector';

interface Props {
    usdcRaw:    bigint;
    className?: string;
    compact?:   boolean;
    showCode?:  boolean;
    currency?:  string;   // override stored preference
}

let _cachedRates: Record<string, number> | null = null;
let _ratesFetchedAt = 0;

async function getRates(): Promise<Record<string, number>> {
    if (_cachedRates && Date.now() - _ratesFetchedAt < 3_600_000) return _cachedRates;
    try {
        const res = await fetch('/api/fiat/rates');
        if (res.ok) {
            const data = await res.json();
            _cachedRates = data.rates;
            _ratesFetchedAt = Date.now();
            return _cachedRates!;
        }
    } catch { /* ignore */ }
    return { USD: 1 };
}

export function CurrencyAmount({ usdcRaw, className, compact, showCode, currency }: Props) {
    const [formatted, setFormatted] = useState<string | null>(null);
    const [code,      setCode]      = useState<string>('USD');

    const refresh = useCallback(async (selectedCode?: string) => {
        const sel = selectedCode ?? currency ?? getStoredCurrency();
        setCode(sel);
        const rates = await getRates();
        const rate  = rates[sel] ?? 1;
        setFormatted(formatInFiat(usdcRaw, sel, rate, { compact }));
    }, [usdcRaw, currency, compact]);

    useEffect(() => {
        refresh();

        if (!currency) {
            const handler = (e: Event) => {
                const code = (e as CustomEvent<string>).detail;
                refresh(code);
            };
            window.addEventListener('susu:currency-change', handler);
            return () => window.removeEventListener('susu:currency-change', handler);
        }
    }, [refresh, currency]);

    if (formatted === null) return <span className={className}>...</span>;

    const cur = getCurrency(code);
    return (
        <span className={className} title={`${cur.flag} ${formatted}`}>
            {formatted}
            {showCode && <span className="text-(--text-muted) text-xs ml-1">{code}</span>}
        </span>
    );
}
