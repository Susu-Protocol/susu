'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getEnokiAddress, signWithEnoki } from '@/lib/sui/enoki';
import { executeTransaction } from '@/lib/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { UserPlus, Play, AlertCircle } from 'lucide-react';

/* ── Join Circle ─────────────────────────────────────────────────────────── */
interface JoinButtonProps { circleId: string; seatsLeft: number; }

export function JoinCircleButton({ circleId, seatsLeft }: JoinButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function join() {
        setLoading(true);
        setError('');
        try {
            const signerAddress = await getEnokiAddress();
            if (!signerAddress) throw new Error('Please sign in first');

            const res = await fetch('/api/circles/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ circleId, signerAddress }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to build transaction');

            const { txBytes } = await res.json();
            const tx = Transaction.from(new Uint8Array(txBytes));
            const bytes = await tx.build({ onlyTransactionKind: false });
            const sig = await signWithEnoki(bytes);
            const result = await executeTransaction(bytes, sig);

            if (result.effects?.status.status === 'success') {
                router.refresh();
            } else {
                throw new Error(result.effects?.status.error ?? 'Transaction failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Join failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-2">
            <Button size="lg" variant="gold" onClick={join} disabled={loading || seatsLeft <= 0} className="gap-2">
                <UserPlus size={16} />
                {loading ? 'Joining…' : seatsLeft > 0 ? `Join circle (${seatsLeft} seats left)` : 'Circle full'}
            </Button>
            {error && (
                <div className="flex items-center gap-2 text-xs text-(--danger)">
                    <AlertCircle size={12} /> {error}
                </div>
            )}
        </div>
    );
}

/* ── Start Circle ────────────────────────────────────────────────────────── */
interface StartButtonProps { circleId: string; }

export function StartCircleButton({ circleId }: StartButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function start() {
        setLoading(true);
        setError('');
        try {
            const signerAddress = await getEnokiAddress();
            if (!signerAddress) throw new Error('Please sign in first');

            const res = await fetch('/api/circles/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ circleId, signerAddress }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to build transaction');

            const { txBytes } = await res.json();
            const tx = Transaction.from(new Uint8Array(txBytes));
            const bytes = await tx.build({ onlyTransactionKind: false });
            const sig = await signWithEnoki(bytes);
            const result = await executeTransaction(bytes, sig);

            if (result.effects?.status.status === 'success') {
                router.refresh();
            } else {
                throw new Error(result.effects?.status.error ?? 'Transaction failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start circle');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-2">
            <Button size="lg" onClick={start} disabled={loading} className="gap-2">
                <Play size={16} />
                {loading ? 'Starting…' : 'Start circle'}
            </Button>
            {error && (
                <div className="flex items-center gap-2 text-xs text-(--danger)">
                    <AlertCircle size={12} /> {error}
                </div>
            )}
        </div>
    );
}
