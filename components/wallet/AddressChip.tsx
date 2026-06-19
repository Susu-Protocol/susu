'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { shortenAddress, explorerUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
    address: string;
    showExplorer?: boolean;
    className?: string;
}

export function AddressChip({ address, showExplorer, className }: Props) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full bg-(--bg-warm) px-3 py-1 text-xs font-mono text-(--text-secondary)',
                className,
            )}
        >
            <span>{shortenAddress(address)}</span>
            <button
                onClick={copy}
                className="text-(--text-muted) hover:text-(--text-primary) transition-colors"
                aria-label="Copy address"
            >
                {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
            {showExplorer && (
                <a
                    href={explorerUrl('address', address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--text-muted) hover:text-(--terracotta) transition-colors"
                >
                    <ExternalLink size={11} />
                </a>
            )}
        </div>
    );
}
