'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowDown, Zap, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getEnokiAddress, signWithEnoki } from '@/lib/sui/enoki';
import { getSuiCoins, executeTransaction } from '@/lib/sui/client';
import { formatUSDC } from '@/lib/utils';

interface Props {
    open:          boolean;
    onClose:       () => void;
    targetUsdc:    bigint;   // USDC amount the user wants to acquire (6 dec)
    onSuccess?:    (usdcCoinType: string) => void;
    label?:        string;   // e.g. "circle contribution"
}

type Phase = 'quote' | 'confirm' | 'swapping' | 'success' | 'error';

const USDC_SCALAR = 1_000_000n;
const SUI_SCALAR  = 1_000_000_000n;

function fmtSui(mist: bigint) {
    return (Number(mist) / 1e9).toFixed(4) + ' SUI';
}

function fmtUsdc(raw: bigint) {
    return (Number(raw) / 1e6).toFixed(2) + ' USDC';
}

export function SwapModal({ open, onClose, targetUsdc, onSuccess, label = 'contribution' }: Props) {
    const [phase,       setPhase]       = useState<Phase>('quote');
    const [suiNeeded,   setSuiNeeded]   = useState<bigint>(0n);
    const [usdcOut,     setUsdcOut]     = useState<bigint>(0n);
    const [priceUsdc,   setPriceUsdc]   = useState<number>(0);
    const [suiBalance,  setSuiBalance]  = useState<bigint>(0n);
    const [suiCoinId,   setSuiCoinId]   = useState<string>('');
    const [txDigest,    setTxDigest]    = useState('');
    const [errMsg,      setErrMsg]      = useState('');

    const fetchQuote = useCallback(async () => {
        if (!open) return;
        setPhase('quote');
        try {
            const address = await getEnokiAddress();
            if (!address) return;

            // Use mid-price to estimate SUI needed
            const priceRes  = await fetch('/api/deepbook/quote');
            const priceData = await priceRes.json();
            const price: number = priceData.priceUsdc ?? 3.5;
            setPriceUsdc(price);

            const targetUsd  = Number(targetUsdc) / 1e6;
            const suiEst     = BigInt(Math.ceil((targetUsd / price) * 1.03 * 1e9)); // 3% buffer
            const quoteRes   = await fetch(`/api/deepbook/quote?suiMist=${suiEst}`);
            const quoteData  = await quoteRes.json();

            setSuiNeeded(suiEst);
            setUsdcOut(BigInt(quoteData.usdcOut ?? (suiEst * BigInt(Math.floor(price * 1e6)) / USDC_SCALAR)));

            // Fetch SUI balance
            const coins = await getSuiCoins(address);
            const total = coins.reduce((acc, c) => acc + c.balance, 0n);
            setSuiBalance(total);

            // Pick largest coin
            const largest = coins.sort((a, b) => (b.balance > a.balance ? 1 : -1))[0];
            if (largest) setSuiCoinId(largest.id);

            setPhase('confirm');
        } catch (e) {
            setErrMsg(e instanceof Error ? e.message : 'Could not fetch quote');
            setPhase('error');
        }
    }, [open, targetUsdc]);

    useEffect(() => { if (open) fetchQuote(); }, [open, fetchQuote]);

    async function executeSwap() {
        setPhase('swapping');
        setErrMsg('');
        try {
            const address = await getEnokiAddress();
            if (!address) throw new Error('Please sign in first');
            if (!suiCoinId) throw new Error('No SUI coin found in wallet');
            if (suiBalance < suiNeeded) throw new Error('Insufficient SUI balance for this swap');

            const res = await fetch('/api/deepbook/swap', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    signerAddress: address,
                    suiCoinId,
                    suiMist: suiNeeded.toString(),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Swap build failed');
            }

            const { txBytes } = await res.json();
            const bytes    = new Uint8Array(txBytes);
            const sig      = await signWithEnoki(bytes);
            const result   = await executeTransaction(bytes, sig);

            if (result.effects?.status.status === 'success') {
                setTxDigest(result.digest);
                setPhase('success');
                onSuccess?.(result.digest);
            } else {
                throw new Error(result.effects?.status.error ?? 'Transaction failed');
            }
        } catch (e) {
            setErrMsg(e instanceof Error ? e.message : 'Swap failed');
            setPhase('error');
        }
    }

    const insufficientSui = suiBalance < suiNeeded && suiBalance > 0n;

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Swap SUI → USDC</DialogTitle>
                    <DialogDescription>
                        DeepBook v3 on-chain swap to fund your {label}
                    </DialogDescription>
                </DialogHeader>

                {/* ── Quote loading ───────────────────────────────────── */}
                {phase === 'quote' && (
                    <div className="py-10 flex flex-col items-center gap-3">
                        <div className="h-8 w-8 rounded-full border-2 border-(--terracotta)/20 border-t-(--terracotta) animate-spin" />
                        <p className="text-sm text-(--text-muted)">Fetching live quote...</p>
                    </div>
                )}

                {/* ── Confirm ─────────────────────────────────────────── */}
                {phase === 'confirm' && (
                    <div className="space-y-4 mt-4">
                        {/* From */}
                        <div className="rounded-xl bg-(--bg-warm) border border-(--border-subtle) p-4">
                            <p className="text-xs text-(--text-muted) mb-1">You pay</p>
                            <p className="text-2xl font-mono font-bold text-(--text-primary)">
                                {fmtSui(suiNeeded)}
                            </p>
                            <p className="text-xs text-(--text-muted) mt-1">
                                Balance: {fmtSui(suiBalance)}
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <div className="h-7 w-7 rounded-full bg-(--bg-surface) border border-(--border-subtle) flex items-center justify-center">
                                <ArrowDown size={13} className="text-(--text-muted)" />
                            </div>
                        </div>

                        {/* To */}
                        <div className="rounded-xl bg-(--bg-warm) border border-(--border-subtle) p-4">
                            <p className="text-xs text-(--text-muted) mb-1">You receive (est.)</p>
                            <p className="text-2xl font-mono font-bold text-(--terracotta)">
                                {fmtUsdc(usdcOut)}
                            </p>
                            <p className="text-xs text-(--text-muted) mt-1">
                                via DeepBook v3 · 2% max slippage
                            </p>
                        </div>

                        {/* Price row */}
                        <div className="flex justify-between text-xs text-(--text-muted) px-1">
                            <span>Price</span>
                            <span>1 SUI ≈ ${priceUsdc.toFixed(4)}</span>
                        </div>

                        {/* Warnings */}
                        {insufficientSui && (
                            <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <span>
                                    Insufficient SUI. You need {fmtSui(suiNeeded)} but only have {fmtSui(suiBalance)}.
                                </span>
                            </div>
                        )}

                        <div className="flex gap-2 rounded-xl bg-(--bg-warm) border border-(--border-subtle) p-3 text-xs text-(--text-secondary)">
                            <Zap size={13} className="text-(--terracotta) shrink-0 mt-0.5" />
                            <span>
                                Atomic on-chain swap via DeepBook CLOB. USDC lands in your wallet instantly.
                            </span>
                        </div>

                        <Button
                            onClick={executeSwap}
                            disabled={insufficientSui}
                            size="xl"
                            className="w-full"
                        >
                            Confirm swap
                        </Button>

                        <Button variant="ghost" size="md" className="w-full" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                )}

                {/* ── Swapping ─────────────────────────────────────────── */}
                {phase === 'swapping' && (
                    <div className="py-10 flex flex-col items-center gap-3">
                        <div className="h-8 w-8 rounded-full border-2 border-(--terracotta)/20 border-t-(--terracotta) animate-spin" />
                        <p className="text-sm text-(--text-muted)">Broadcasting to Sui...</p>
                        <p className="text-xs text-(--text-muted)">Signing with your zkLogin key</p>
                    </div>
                )}

                {/* ── Success ──────────────────────────────────────────── */}
                {phase === 'success' && (
                    <div className="py-8 flex flex-col items-center gap-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-(--text-primary)">Swap complete!</p>
                            <p className="text-sm text-(--text-muted) mt-1">
                                {fmtUsdc(usdcOut)} landed in your wallet.
                            </p>
                        </div>
                        {txDigest && (
                            <a
                                href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-(--terracotta) hover:underline"
                            >
                                View on Sui Explorer <ExternalLink size={10} />
                            </a>
                        )}
                        <Button onClick={onClose} size="md" className="mt-2 w-full">Done</Button>
                    </div>
                )}

                {/* ── Error ────────────────────────────────────────────── */}
                {phase === 'error' && (
                    <div className="space-y-4 mt-4">
                        <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{errMsg}</span>
                        </div>
                        <Button variant="outline" size="md" className="w-full" onClick={fetchQuote}>
                            Try again
                        </Button>
                        <Button variant="ghost" size="md" className="w-full" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
