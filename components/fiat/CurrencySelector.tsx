'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CURRENCIES, POPULAR_CURRENCIES, getCurrency } from '@/lib/fiat/currencies';

const STORAGE_KEY = 'susu:currency';

export function getStoredCurrency(): string {
    if (typeof window === 'undefined') return 'USD';
    return localStorage.getItem(STORAGE_KEY) ?? 'USD';
}

export function setStoredCurrency(code: string) {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, code);
}

interface Props {
    value:    string;
    onChange: (code: string) => void;
    size?:    'sm' | 'md';
}

export function CurrencySelector({ value, onChange, size = 'md' }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const cur = getCurrency(value);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function select(code: string) {
        onChange(code);
        setStoredCurrency(code);
        setOpen(false);
    }

    const btnCls = size === 'sm'
        ? 'flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-(--border-subtle) bg-(--bg-surface) text-(--text-secondary) hover:bg-(--bg-warm) transition-colors'
        : 'flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-(--border-subtle) bg-(--bg-surface) text-(--text-primary) hover:bg-(--bg-warm) transition-colors';

    return (
        <div ref={ref} className="relative">
            <button type="button" className={btnCls} onClick={() => setOpen(v => !v)}>
                <span>{cur.flag}</span>
                <span>{cur.code}</span>
                <ChevronDown size={size === 'sm' ? 10 : 12} className="text-(--text-muted)" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-(--border-subtle) bg-(--bg-surface) shadow-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                        <p className="px-3 py-2 text-xs font-medium text-(--text-muted) uppercase tracking-wide border-b border-(--border-subtle)">
                            Popular
                        </p>
                        {POPULAR_CURRENCIES.map(code => (
                            <CurrencyRow key={code} code={code} selected={code === value} onSelect={select} />
                        ))}
                        <p className="px-3 py-2 text-xs font-medium text-(--text-muted) uppercase tracking-wide border-t border-b border-(--border-subtle)">
                            All
                        </p>
                        {Object.keys(CURRENCIES)
                            .filter(c => !POPULAR_CURRENCIES.includes(c))
                            .map(code => (
                                <CurrencyRow key={code} code={code} selected={code === value} onSelect={select} />
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CurrencyRow({ code, selected, onSelect }: { code: string; selected: boolean; onSelect: (c: string) => void }) {
    const cur = getCurrency(code);
    return (
        <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-(--bg-warm) transition-colors"
            onClick={() => onSelect(code)}
        >
            <span className="flex items-center gap-2">
                <span>{cur.flag}</span>
                <span className="text-(--text-primary)">{cur.code}</span>
                <span className="text-(--text-muted) text-xs">{cur.name}</span>
            </span>
            {selected && <Check size={12} className="text-(--terracotta)" />}
        </button>
    );
}
