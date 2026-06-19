'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, XCircle, Clock, Loader2, ChevronRight } from 'lucide-react';
import { listenTransak, classifyEvent, type RampMode, type TransakEvent } from '@/lib/ramp/transak';
import { getMethodsForCurrency } from '@/lib/ramp/methods';
import { getStoredCurrency } from '@/components/fiat/CurrencySelector';
import { getCurrency } from '@/lib/fiat/currencies';

interface Props {
    open:          boolean;
    onClose:       () => void;
    walletAddress: string;
    defaultMode?:  RampMode;
    prefillUsdc?:  number;    // for offramp: pre-fill the USDC amount
    onSuccess?:    (event: TransakEvent) => void;
}

type Phase = 'choose' | 'loading' | 'widget' | 'pending' | 'success' | 'failed';

export function RampModal({ open, onClose, walletAddress, defaultMode, prefillUsdc, onSuccess }: Props) {
    const [mode,        setMode]       = useState<RampMode>(defaultMode ?? 'BUY');
    const [phase,       setPhase]      = useState<Phase>('choose');
    const [iframeUrl,   setIframeUrl]  = useState('');
    const [lastEvent,   setLastEvent]  = useState<TransakEvent | null>(null);
    const [currency,    setCurrency]   = useState('USD');
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (open) {
            setCurrency(getStoredCurrency());
            setPhase('choose');
            setLastEvent(null);
            setMode(defaultMode ?? 'BUY');
        }
    }, [open, defaultMode]);

    const launchWidget = useCallback(async (selectedMode: RampMode) => {
        setMode(selectedMode);
        const cur = getStoredCurrency();
        setCurrency(cur);
        setPhase('loading');

        try {
            const res = await fetch('/api/ramp/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    mode:         selectedMode,
                    fiatCurrency: cur,
                    cryptoAmount: selectedMode === 'SELL' ? prefillUsdc : undefined,
                }),
            });
            if (!res.ok) throw new Error('session request failed');
            const { widgetUrl } = await res.json();
            setIframeUrl(widgetUrl);
            setPhase('widget');
        } catch {
            setPhase('failed');
            return;
        }

        // Clean up previous listener
        cleanupRef.current?.();
        cleanupRef.current = listenTransak((event) => {
            if (event.eventName === 'TRANSAK_WIDGET_CLOSE') {
                onClose();
                return;
            }
            setLastEvent(event);
            const state = classifyEvent(event.eventName);
            if (state === 'success') {
                setPhase('success');
                onSuccess?.(event);
            } else if (state === 'failed') {
                setPhase('failed');
            } else if (state === 'pending') {
                setPhase('pending');
            }
        });
    }, [walletAddress, prefillUsdc, onSuccess, onClose]);

    useEffect(() => () => cleanupRef.current?.(), []);

    if (!open) return null;

    const cur     = getCurrency(currency);
    const methods = getMethodsForCurrency(currency);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet / modal */}
            <div className="relative w-full sm:max-w-md mx-auto bg-(--bg-surface) rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '96dvh' }}>

                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-(--border-subtle) shrink-0">
                    <div className="flex items-center gap-2">
                        {phase === 'choose' && (
                            <>
                                <div className="h-8 w-8 rounded-xl bg-(--terracotta)/10 flex items-center justify-center">
                                    {mode === 'BUY'
                                        ? <ArrowDownToLine size={15} className="text-(--terracotta)" />
                                        : <ArrowUpFromLine size={15} className="text-(--terracotta)" />}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-(--text-primary) text-sm">
                                        {mode === 'BUY' ? 'Add money' : 'Withdraw to bank'}
                                    </h2>
                                    <p className="text-xs text-(--text-muted)">Powered by Transak</p>
                                </div>
                            </>
                        )}
                        {phase === 'loading' && (
                            <h2 className="font-semibold text-(--text-primary) text-sm">Setting up secure session…</h2>
                        )}
                        {phase === 'widget' && (
                            <div>
                                <h2 className="font-semibold text-(--text-primary) text-sm">
                                    {mode === 'BUY' ? 'Buy USDC' : 'Sell USDC'}
                                </h2>
                                <p className="text-xs text-(--text-muted)">Fiat ↔ USDC on Sui</p>
                            </div>
                        )}
                        {(phase === 'pending' || phase === 'success' || phase === 'failed') && (
                            <h2 className="font-semibold text-(--text-primary) text-sm">Order status</h2>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-(--bg-warm) text-(--text-muted) transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Body ────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">

                    {/* Choose phase ──────────────────────────────────── */}
                    {phase === 'choose' && (
                        <div className="p-5 space-y-5">
                            {/* Mode tabs */}
                            <div className="flex gap-2 p-1 bg-(--bg-warm) rounded-xl">
                                {(['BUY', 'SELL'] as RampMode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                                            mode === m
                                                ? 'bg-(--bg-surface) text-(--text-primary) shadow-sm'
                                                : 'text-(--text-muted) hover:text-(--text-secondary)'
                                        }`}
                                    >
                                        {m === 'BUY'
                                            ? <><ArrowDownToLine size={13} /> Add money</>
                                            : <><ArrowUpFromLine size={13} /> Withdraw</>}
                                    </button>
                                ))}
                            </div>

                            {/* Currency display */}
                            <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-warm) p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">{cur.flag}</span>
                                    <div>
                                        <p className="font-semibold text-(--text-primary) text-sm">{cur.name}</p>
                                        <p className="text-xs text-(--text-muted)">{cur.code} · change in nav</p>
                                    </div>
                                </div>

                                {/* Payment methods */}
                                {methods && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-(--text-muted) uppercase tracking-wide">
                                            Available {mode === 'BUY' ? 'payment' : 'payout'} methods
                                        </p>
                                        {(mode === 'BUY' ? methods.onramp : methods.offramp).map(m => (
                                            <div key={m.id + m.label} className="flex items-center gap-2 text-sm">
                                                <span className="text-base leading-none">{m.icon}</span>
                                                <span className="text-(--text-primary)">{m.label}</span>
                                                {m.instant && (
                                                    <span className="ml-auto text-xs text-green-600 font-medium">Instant</span>
                                                )}
                                                {!m.instant && (
                                                    <span className="ml-auto text-xs text-(--text-muted)">1-3 days</span>
                                                )}
                                            </div>
                                        ))}
                                        <p className="text-xs text-(--text-muted) pt-1 border-t border-(--border-subtle) mt-2">
                                            Limits: ${methods.minUsd}–${methods.maxUsd.toLocaleString()} USD equivalent
                                        </p>
                                    </div>
                                )}

                                {!methods && (
                                    <p className="text-sm text-(--text-muted)">
                                        Payment methods for your region will load inside the widget.
                                    </p>
                                )}
                            </div>

                            {/* Info rows */}
                            <div className="rounded-2xl border border-(--border-subtle) p-4 space-y-3 text-sm">
                                {mode === 'BUY' ? (
                                    <>
                                        <InfoRow label="You get" value="USDC on Sui" />
                                        <InfoRow label="KYC" value="Light ID check (email + phone)" />
                                        <InfoRow label="Settlement" value="Seconds after payment" />
                                        <InfoRow label="Fees" value="~1.5–3% (shown in widget)" />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow label="You send" value="USDC from your Susu wallet" />
                                        <InfoRow label="You receive" value={`${cur.code} to your bank account`} />
                                        <InfoRow label="KYC" value="ID verification required" />
                                        <InfoRow label="Settlement" value={methods?.offramp.some(m => m.instant) ? 'Instant or 1-3 days' : '1-3 business days'} />
                                        <InfoRow label="Fees" value="~1.5% (shown in widget)" />
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => launchWidget(mode)}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-(--terracotta) text-white font-semibold py-4 text-sm hover:bg-(--terracotta-dim) transition-colors shadow-sm"
                            >
                                {mode === 'BUY' ? 'Buy USDC with ' + cur.code : 'Withdraw ' + cur.code + ' to bank'}
                                <ChevronRight size={16} />
                            </button>

                            <p className="text-center text-xs text-(--text-muted)">
                                Powered by Transak · Licensed money services business
                            </p>
                        </div>
                    )}

                    {/* Loading phase (creating the Transak session) ───── */}
                    {phase === 'loading' && (
                        <div className="flex flex-col items-center justify-center gap-3 p-12 text-center" style={{ height: '580px' }}>
                            <Loader2 size={24} className="animate-spin text-(--terracotta)" />
                            <p className="text-sm text-(--text-muted)">Connecting to Transak…</p>
                        </div>
                    )}

                    {/* Widget phase ───────────────────────────────────── */}
                    {phase === 'widget' && (
                        <div className="relative" style={{ height: '580px' }}>
                            <div className="absolute inset-0 flex items-center justify-center bg-(--bg-warm)">
                                <Loader2 size={24} className="animate-spin text-(--terracotta)" />
                            </div>
                            <iframe
                                src={iframeUrl}
                                className="absolute inset-0 w-full h-full border-0 z-10"
                                allow="camera;microphone;payment;clipboard-write"
                                referrerPolicy="strict-origin-when-cross-origin"
                                title="Transak Payment Widget"
                            />
                        </div>
                    )}

                    {/* Pending phase ──────────────────────────────────── */}
                    {phase === 'pending' && (
                        <div className="p-8 flex flex-col items-center gap-4 text-center">
                            <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
                                <Clock size={26} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-(--text-primary)">Order created</p>
                                <p className="text-sm text-(--text-muted) mt-1">
                                    Your {mode === 'BUY' ? 'purchase' : 'withdrawal'} is being processed. Check your email for updates.
                                </p>
                            </div>
                            {lastEvent?.status && (
                                <OrderSummary event={lastEvent} mode={mode} />
                            )}
                            <button onClick={onClose} className="text-sm text-(--terracotta) hover:underline">
                                Close and check later
                            </button>
                        </div>
                    )}

                    {/* Success phase ──────────────────────────────────── */}
                    {phase === 'success' && (
                        <div className="p-8 flex flex-col items-center gap-4 text-center">
                            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 size={26} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-display text-xl font-bold text-(--text-primary)">
                                    {mode === 'BUY' ? '🎉 USDC received!' : '🎉 Withdrawal sent!'}
                                </p>
                                <p className="text-sm text-(--text-muted) mt-1">
                                    {mode === 'BUY'
                                        ? 'Your USDC has landed in your Sui wallet.'
                                        : `${cur.code} is on its way to your bank account.`}
                                </p>
                            </div>
                            {lastEvent?.status && (
                                <OrderSummary event={lastEvent} mode={mode} />
                            )}
                            <button
                                onClick={onClose}
                                className="w-full rounded-2xl bg-(--terracotta) text-white font-semibold py-3 text-sm hover:bg-(--terracotta-dim) transition-colors mt-2"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* Failed phase ───────────────────────────────────── */}
                    {phase === 'failed' && (
                        <div className="p-8 flex flex-col items-center gap-4 text-center">
                            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle size={26} className="text-red-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-(--text-primary)">Order failed</p>
                                <p className="text-sm text-(--text-muted) mt-1">
                                    Something went wrong. Please try again or contact Transak support.
                                </p>
                            </div>
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={() => launchWidget(mode)}
                                    className="flex-1 rounded-xl border border-(--terracotta) text-(--terracotta) font-medium py-2.5 text-sm hover:bg-(--terracotta)/5 transition-colors"
                                >
                                    Try again
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 rounded-xl border border-(--border-default) text-(--text-secondary) font-medium py-2.5 text-sm hover:bg-(--bg-warm) transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-(--text-muted)">{label}</span>
            <span className="font-medium text-(--text-primary)">{value}</span>
        </div>
    );
}

function OrderSummary({ event, mode }: { event: TransakEvent; mode: RampMode }) {
    const s = event.status;
    if (!s) return null;
    return (
        <div className="w-full rounded-xl bg-(--bg-warm) border border-(--border-subtle) p-3 space-y-2 text-sm text-left">
            {s.fiatAmount && s.fiatCurrency && (
                <div className="flex justify-between">
                    <span className="text-(--text-muted)">{mode === 'BUY' ? 'You paid' : 'You sold'}</span>
                    <span className="font-mono font-medium text-(--text-primary)">
                        {s.fiatAmount.toLocaleString()} {s.fiatCurrency as string}
                    </span>
                </div>
            )}
            {s.cryptoAmount && (
                <div className="flex justify-between">
                    <span className="text-(--text-muted)">{mode === 'BUY' ? 'USDC received' : 'USDC sold'}</span>
                    <span className="font-mono font-medium text-(--text-primary)">
                        {Number(s.cryptoAmount).toFixed(2)} USDC
                    </span>
                </div>
            )}
            {s.transactionHash && typeof s.transactionHash === 'string' && (
                <a
                    href={`https://suiscan.xyz/mainnet/tx/${s.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-(--terracotta) hover:underline truncate"
                >
                    View on Sui Explorer →
                </a>
            )}
        </div>
    );
}
