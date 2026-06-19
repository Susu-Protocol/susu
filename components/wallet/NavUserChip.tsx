'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, ExternalLink, Copy, Check, User } from 'lucide-react';
import { shortenAddress, explorerUrl } from '@/lib/utils';
import { AddressAvatar } from './AddressAvatar';

interface Props {
    address: string;
}

export function NavUserChip({ address }: Props) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    async function copyAddress() {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    async function signOut() {
        const { enokiLogout } = await import('@/lib/sui/enoki');
        await enokiLogout();
        window.location.href = '/';
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 rounded-xl border border-(--border-subtle) bg-(--bg-surface) px-3 py-2 text-sm hover:bg-(--bg-warm) transition-colors"
            >
                <AddressAvatar address={address} size={24} />
                <span className="hidden sm:block font-mono text-xs text-(--text-secondary)">
                    {shortenAddress(address)}
                </span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-1 shadow-lg z-50 animate-scale-in">
                    {/* Address header */}
                    <div className="px-3 py-2.5 border-b border-(--border-subtle) mb-1">
                        <div className="flex items-center gap-2">
                            <AddressAvatar address={address} size={32} />
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-(--text-primary)">Connected</p>
                                <p className="font-mono text-xs text-(--text-muted) truncate">{shortenAddress(address, 6)}</p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={`/profile/${address}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm text-(--text-secondary) hover:bg-(--bg-warm) hover:text-(--text-primary) transition-colors"
                    >
                        <User size={14} /> My profile
                    </Link>

                    <button
                        onClick={copyAddress}
                        className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm text-(--text-secondary) hover:bg-(--bg-warm) hover:text-(--text-primary) transition-colors"
                    >
                        {copied ? <Check size={14} className="text-(--success)" /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy address'}
                    </button>

                    <a
                        href={explorerUrl('address', address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm text-(--text-secondary) hover:bg-(--bg-warm) hover:text-(--text-primary) transition-colors"
                    >
                        <ExternalLink size={14} /> View on explorer
                    </a>

                    <div className="mt-1 border-t border-(--border-subtle) pt-1">
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm text-(--danger) hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={14} /> Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
