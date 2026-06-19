'use client';

import { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Copy, CheckCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { getUsdcCoins, getSuiBalance } from '@/lib/sui/client';
import { formatUSDC, getCookie } from '@/lib/utils';
import { CurrencyAmount } from '@/components/fiat/CurrencyAmount';
import { AddressAvatar } from '@/components/wallet/AddressAvatar';
import { RampModal } from '@/components/ramp/RampModal';
import { SwapModal } from '@/components/deepbook/SwapModal';
import type { RampMode } from '@/lib/ramp/transak';

const MIST = 1_000_000_000n;

function fmtSui(mist: bigint) {
    return (Number(mist) / 1e9).toFixed(4) + ' SUI';
}

export default function WalletPage() {
    const [address,     setAddress]     = useState('');
    const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null);
    const [suiBalance,  setSuiBalance]  = useState<bigint | null>(null);
    const [usdcCoinId,  setUsdcCoinId]  = useState('');
    const [copied,      setCopied]      = useState(false);
    const [loading,     setLoading]     = useState(true);

    const [rampOpen,    setRampOpen]    = useState(false);
    const [rampMode,    setRampMode]    = useState<RampMode>('BUY');
    const [swapOpen,    setSwapOpen]    = useState(false);

    async function loadBalances(addr: string) {
        setLoading(true);
        const [coins, sui] = await Promise.all([
            getUsdcCoins(addr).catch(() => []),
            getSuiBalance(addr).catch(() => 0n),
        ]);
        const total = coins.reduce((s, c) => s + c.balance, 0n);
        setUsdcBalance(total);
        setSuiBalance(sui);
        if (coins.length > 0) setUsdcCoinId(coins[0].id);
        setLoading(false);
    }

    useEffect(() => {
        // Read from the susu_address cookie set at login — the same source of
        // truth every other page uses. Balance reads are public RPC calls and
        // don't need a live Enoki signing session, so we don't depend on one.
        const addr = getCookie('susu_address');
        if (!addr) return;
        setAddress(addr);
        loadBalances(addr);
    }, []);

    function copyAddress() {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function openOnramp() { setRampMode('BUY'); setRampOpen(true); }
    function openOfframp() { setRampMode('SELL'); setRampOpen(true); }

    const usdcUsdc = usdcBalance ?? 0n;
    const suiMist  = suiBalance ?? 0n;

    return (
        <>
            <RampModal
                open={rampOpen}
                onClose={() => setRampOpen(false)}
                walletAddress={address}
                defaultMode={rampMode}
                prefillUsdc={rampMode === 'SELL' ? Number(usdcUsdc) / 1e6 : undefined}
                onSuccess={() => { setRampOpen(false); if (address) loadBalances(address); }}
            />

            <SwapModal
                open={swapOpen}
                onClose={() => setSwapOpen(false)}
                targetUsdc={usdcUsdc > 0n ? usdcUsdc : 10_000_000n}
                onSuccess={() => { setSwapOpen(false); if (address) loadBalances(address); }}
            />

            <div className="max-w-xl mx-auto space-y-6">
                {/* ── Header ───────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-3xl font-bold text-(--text-primary)">Wallet</h1>
                    <button
                        onClick={() => address && loadBalances(address)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-(--text-muted) hover:bg-(--bg-warm) transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* ── Address chip ─────────────────────────────── */}
                {address && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--border-subtle) bg-(--bg-warm) px-4 py-2.5">
                        <AddressAvatar address={address} size={28} />
                        <span className="font-mono text-xs text-(--text-secondary) flex-1 truncate">
                            {address}
                        </span>
                        <button onClick={copyAddress} className="shrink-0 text-(--text-muted) hover:text-(--text-primary) transition-colors">
                            {copied ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                        <a
                            href={`https://suiscan.xyz/testnet/account/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-(--text-muted) hover:text-(--terracotta) transition-colors"
                        >
                            <ExternalLink size={13} />
                        </a>
                    </div>
                )}

                {/* ── Balance cards ─────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    {/* USDC card */}
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-700">$</span>
                            </div>
                            <span className="text-sm font-medium text-(--text-muted)">USDC</span>
                        </div>
                        <div>
                            <p className="font-mono text-2xl font-bold text-(--text-primary)">
                                {loading ? '—' : formatUSDC(usdcUsdc)}
                            </p>
                            <CurrencyAmount
                                usdcRaw={usdcUsdc}
                                className="text-sm text-(--text-muted) mt-0.5 block"
                            />
                        </div>
                    </div>

                    {/* SUI card */}
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-(--sui-blue)/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-(--sui-blue)">SUI</span>
                            </div>
                            <span className="text-sm font-medium text-(--text-muted)">SUI</span>
                        </div>
                        <div>
                            <p className="font-mono text-2xl font-bold text-(--text-primary)">
                                {loading ? '—' : fmtSui(suiMist)}
                            </p>
                            <p className="text-xs text-(--text-muted) mt-0.5">for gas fees</p>
                        </div>
                    </div>
                </div>

                {/* ── Quick actions ─────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    <ActionBtn
                        icon={<ArrowDownToLine size={18} />}
                        label="Add money"
                        sublabel="Local currency → USDC"
                        color="bg-(--terracotta)"
                        onClick={openOnramp}
                    />
                    <ActionBtn
                        icon={<ArrowUpFromLine size={18} />}
                        label="Withdraw"
                        sublabel="USDC → Bank account"
                        color="bg-emerald-600"
                        onClick={openOfframp}
                    />
                    <ActionBtn
                        icon={<ArrowRightLeft size={18} />}
                        label="Swap"
                        sublabel="SUI → USDC on-chain"
                        color="bg-(--sui-blue)"
                        onClick={() => setSwapOpen(true)}
                    />
                </div>

                {/* ── Onramp CTA banner ─────────────────────────── */}
                <div className="rounded-2xl border border-(--terracotta)/20 bg-(--terracotta)/5 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold text-(--text-primary) text-sm">Fund your Susu wallet</p>
                            <p className="text-xs text-(--text-muted) mt-1 max-w-xs">
                                Buy USDC directly with your local currency using bank transfer,
                                mobile money (M-Pesa, UPI, GCash, PIX), or card.
                            </p>
                        </div>
                        <button
                            onClick={openOnramp}
                            className="shrink-0 flex items-center gap-2 rounded-xl bg-(--terracotta) text-white text-sm font-medium px-4 py-2.5 hover:bg-(--terracotta-dim) transition-colors"
                        >
                            <ArrowDownToLine size={14} /> Add money
                        </button>
                    </div>

                    {/* Payment method pills */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                        {[
                            { icon: '📱', label: 'M-Pesa' },
                            { icon: '🔷', label: 'UPI' },
                            { icon: '⚡', label: 'PIX' },
                            { icon: '⚡', label: 'SEPA' },
                            { icon: '📱', label: 'GCash' },
                            { icon: '⚡', label: 'SPEI' },
                            { icon: '💳', label: 'Card' },
                            { icon: '🏦', label: 'Bank transfer' },
                        ].map(m => (
                            <span
                                key={m.label}
                                className="flex items-center gap-1 rounded-full border border-(--terracotta)/15 bg-white/60 px-2.5 py-1 text-xs text-(--text-secondary)"
                            >
                                {m.icon} {m.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Offramp CTA ───────────────────────────────── */}
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <ArrowUpFromLine size={16} className="text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-(--text-primary)">Withdraw to your bank</p>
                        <p className="text-xs text-(--text-muted) mt-0.5">
                            Convert your USDC savings back to local currency. Directly to your bank or mobile money wallet.
                        </p>
                    </div>
                    <button
                        onClick={openOfframp}
                        disabled={usdcUsdc === 0n}
                        className="shrink-0 rounded-xl border border-emerald-600 text-emerald-700 text-xs font-medium px-3 py-2 hover:bg-emerald-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Withdraw
                    </button>
                </div>

                {/* ── Network info ──────────────────────────────── */}
                <div className="rounded-xl border border-(--border-subtle) bg-(--bg-warm) p-3 text-xs text-(--text-muted) space-y-1">
                    <p className="flex justify-between">
                        <span>Network</span>
                        <span className="font-mono">Sui Testnet</span>
                    </p>
                    <p className="flex justify-between">
                        <span>USDC type</span>
                        <span className="font-mono truncate max-w-[180px]">{process.env.NEXT_PUBLIC_USDC_TYPE?.slice(0, 20)}…</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Ramp provider</span>
                        <a href="https://transak.com" target="_blank" rel="noopener noreferrer" className="text-(--terracotta) hover:underline">
                            Transak ↗
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}

function ActionBtn({ icon, label, sublabel, color, onClick }: {
    icon:     React.ReactNode;
    label:    string;
    sublabel: string;
    color:    string;
    onClick:  () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 hover:bg-(--bg-warm) transition-all hover:shadow-sm text-center"
        >
            <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center text-white`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-(--text-primary)">{label}</p>
                <p className="text-xs text-(--text-muted) mt-0.5 leading-tight">{sublabel}</p>
            </div>
        </button>
    );
}
