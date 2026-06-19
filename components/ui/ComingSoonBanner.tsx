'use client';

import { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

const DISMISS_KEY = 'susu:dismissed-mobile-ussd-banner';

export function ComingSoonBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(localStorage.getItem(DISMISS_KEY) !== '1');
    }, []);

    function dismiss() {
        localStorage.setItem(DISMISS_KEY, '1');
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="bg-(--terracotta)/8 border-b border-(--terracotta)/15">
            <div className="mx-auto max-w-6xl px-5 py-2.5 flex items-center gap-3">
                <Smartphone size={14} className="text-(--terracotta) shrink-0" />
                <p className="text-xs text-(--text-secondary) flex-1 min-w-0">
                    <span className="font-semibold text-(--terracotta)">Mobile App &amp; USSD</span>
                    {' '}coming soon with mainnet — save from any phone, no internet required.
                </p>
                <button
                    onClick={dismiss}
                    aria-label="Dismiss"
                    className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-(--text-muted) hover:bg-(--terracotta)/10 hover:text-(--text-primary) transition-colors"
                >
                    <X size={13} />
                </button>
            </div>
        </div>
    );
}
