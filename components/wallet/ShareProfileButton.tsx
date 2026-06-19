'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface Props { address: string }

export function ShareProfileButton({ address }: Props) {
    const [done, setDone] = useState(false);

    async function share() {
        const url = typeof window !== 'undefined'
            ? `${window.location.origin}/profile/${address}`
            : `https://susuprotocol.vercel.app/profile/${address}`;

        if (navigator.share) {
            await navigator.share({ title: 'My Susu savings profile', url }).catch(() => {});
        } else {
            await navigator.clipboard.writeText(url).catch(() => {});
        }
        setDone(true);
        setTimeout(() => setDone(false), 2000);
    }

    return (
        <button
            onClick={share}
            className="flex items-center gap-1.5 rounded-xl border border-(--border-default) px-3 py-2 text-xs text-(--text-secondary) hover:bg-(--bg-warm) hover:text-(--text-primary) transition-colors"
        >
            {done
                ? <><Check size={12} className="text-(--success)" /> Copied!</>
                : <><Share2 size={12} /> Share profile</>}
        </button>
    );
}
