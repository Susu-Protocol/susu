'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    circleId: string;
    seatsLeft: number;
}

export function InviteLink({ circleId, seatsLeft }: Props) {
    const [copied, setCopied] = useState(false);

    const url = typeof window !== 'undefined'
        ? `${window.location.origin}/circles/${circleId}`
        : `https://susuprotocol.vercel.app/circles/${circleId}`;

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    }

    async function share() {
        if (navigator.share) {
            await navigator.share({ title: 'Join my Susu circle', url }).catch(() => {});
        } else {
            copy();
        }
    }

    return (
        <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-warm) p-5 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-(--text-primary)">Invite members</p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {seatsLeft} seat{seatsLeft !== 1 ? 's' : ''} remaining
                </span>
            </div>
            <div className="flex gap-2">
                <code className="flex-1 min-w-0 rounded-xl border border-(--border-default) bg-(--bg-surface) px-3 py-2 text-xs text-(--text-secondary) truncate font-mono">
                    {url}
                </code>
                <Button variant="outline" size="sm" onClick={copy} className="shrink-0 gap-1.5">
                    {copied ? <Check size={13} className="text-(--success)" /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="ghost" size="icon" onClick={share} className="shrink-0">
                    <Share2 size={14} />
                </Button>
            </div>
            <p className="text-xs text-(--text-muted)">
                Anyone with this link can view and join the circle.
            </p>
        </div>
    );
}
