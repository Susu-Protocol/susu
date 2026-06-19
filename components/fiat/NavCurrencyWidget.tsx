'use client';

import { useState, useEffect } from 'react';
import { CurrencySelector, getStoredCurrency, setStoredCurrency } from './CurrencySelector';

export function NavCurrencyWidget() {
    const [currency, setCurrency] = useState('USD');

    useEffect(() => {
        setCurrency(getStoredCurrency());
    }, []);

    function handleChange(code: string) {
        setCurrency(code);
        setStoredCurrency(code);
        // Dispatch a custom event so other components can react
        window.dispatchEvent(new CustomEvent('susu:currency-change', { detail: code }));
    }

    return <CurrencySelector value={currency} onChange={handleChange} size="sm" />;
}
