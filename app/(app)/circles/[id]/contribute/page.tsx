'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getEnokiAddress, signWithEnoki } from '@/lib/sui/enoki';
import { executeTransaction, getUsdcCoins } from '@/lib/sui/client';
import { formatUSDC, msToCountdown } from '@/lib/utils';
import { estimateYield } from '@/lib/scallop/supply';
import { CurrencyAmount } from '@/components/fiat/CurrencyAmount';
import { SwapModal } from '@/components/deepbook/SwapModal';
import { RampModal } from '@/components/ramp/RampModal';
import { Transaction } from '@mysten/sui/transactions';
import { Coins, ArrowRightLeft, ArrowDownToLine } from 'lucide-react';

export default function ContributePage() {
    const { id } = useParams<{ id: string }>();
    const router  = useRouter();

    const [circle, setCircle] = useState<{
        name:             string;
        config:           { contributionAmount: bigint; allowYield: boolean };
        currentCycle:     number;
        currentCycleData?: { endMs: bigint; recipient: string; collected: bigint; targetAmount: bigint };
        members:          string[];
    } | null>(null);

    const [step,            setStep]            = useState<'review' | 'confirm' | 'success'>('review');
    const [submitting,      setSubmitting]       = useState(false);
    const [error,           setError]            = useState('');
    const [estimatedYield,  setEstimatedYield]   = useState<bigint>(0n);
    const [txDigest,        setTxDigest]         = useState('');
    const [usdcBalance,     setUsdcBalance]      = useState<bigint>(0n);
    const [walletAddress,   setWalletAddress]    = useState('');
    const [swapOpen,        setSwapOpen]         = useState(false);
    const [rampOpen,        setRampOpen]         = useState(false);

    useEffect(() => {
        fetch(`/api/circles/${id}`)
            .then(r => r.json())
            .then(data => {
                const c = {
                    ...data,
                    config: {
                        ...data.config,
                        contributionAmount: BigInt(data.config.contributionAmount ?? '0'),
                    },
                    currentCycleData: data.currentCycleData ? {
                        ...data.currentCycleData,
                        endMs:        BigInt(data.currentCycleData.endMs        ?? '0'),
                        collected:    BigInt(data.currentCycleData.collected    ?? '0'),
                        targetAmount: BigInt(data.currentCycleData.targetAmount ?? '0'),
                    } : undefined,
                };
                setCircle(c);

                if (c.config.allowYield && c.currentCycleData) {
                    const timeUntil = Math.max(0, Number(c.currentCycleData.endMs) - Date.now());
                    const totalPool = BigInt(c.members.length) * c.config.contributionAmount;
                    estimateYield(totalPool, timeUntil).then(setEstimatedYield);
                }
            })
            .catch(() => setError('Failed to load circle details'));
    }, [id]);

    // Fetch USDC balance to decide whether to show swap / onramp CTAs
    useEffect(() => {
        getEnokiAddress().then(addr => {
            if (!addr) return;
            setWalletAddress(addr);
            getUsdcCoins(addr).then(coins => {
                const total = coins.reduce((acc, c) => acc + c.balance, 0n);
                setUsdcBalance(total);
            });
        });
    }, []);

    async function contribute() {
        setSubmitting(true);
        setError('');
        try {
            const signerAddress = await getEnokiAddress();
            if (!signerAddress) throw new Error('Please sign in first');
            if (!circle) throw new Error('Circle not loaded');

            const coins = await getUsdcCoins(signerAddress);
            if (coins.length === 0) throw new Error('No USDC found in your wallet. Use the swap below to get USDC.');

            const usdcCoin = coins.find(c => c.balance >= circle.config.contributionAmount);
            if (!usdcCoin) throw new Error('Insufficient USDC. Use the swap below to top up.');

            const isLast = circle.currentCycleData
                ? circle.currentCycleData.collected + circle.config.contributionAmount >= circle.currentCycleData.targetAmount
                : false;

            const res = await fetch('/api/contribute', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    circleId:           id,
                    cycleId:            circle.currentCycleData?.recipient ?? '',
                    contributionAmount: circle.config.contributionAmount.toString(),
                    allowYield:         circle.config.allowYield,
                    isLastContribution: isLast,
                    usdcCoinId:         usdcCoin.id,
                    signerAddress,
                }),
            });

            if (!res.ok) throw new Error((await res.json()).error);
            const { txBytes } = await res.json();
            const tx    = Transaction.from(new Uint8Array(txBytes));
            const bytes = await tx.build({ onlyTransactionKind: false });
            const sig   = await signWithEnoki(bytes);
            const result = await executeTransaction(bytes, sig);

            if (result.effects?.status.status === 'success') {
                setTxDigest(result.digest);
                setStep('success');
            } else {
                throw new Error(result.effects?.status.error ?? 'Transaction failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Contribution failed');
            setSubmitting(false);
        }
    }

    function refreshBalance() {
        getEnokiAddress().then(addr => {
            if (!addr) return;
            getUsdcCoins(addr).then(coins => {
                const total = coins.reduce((acc, c) => acc + c.balance, 0n);
                setUsdcBalance(total);
            });
        });
    }

    function handleSwapSuccess() { setSwapOpen(false); refreshBalance(); }
    function handleRampSuccess() { setRampOpen(false); refreshBalance(); }

    if (!circle) {
        return (
            <div className="max-w-sm mx-auto py-20 text-center">
                <div className="h-8 w-8 rounded-full border-2 border-(--terracotta)/20 border-t-(--terracotta) animate-spin mx-auto" />
                <p className="mt-4 text-sm text-(--text-muted)">Loading circle...</p>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="max-w-sm mx-auto py-20 text-center">
                <p className="text-5xl mb-4">🎉</p>
                <h2 className="font-display text-2xl font-bold text-(--text-primary)">
                    Contribution recorded!
                </h2>
                <p className="mt-2 text-sm text-(--text-muted)">
                    Your {formatUSDC(circle.config.contributionAmount)} contribution to {circle.name} is confirmed on Sui.
                </p>
                {txDigest && (
                    <a
                        href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block text-xs text-(--terracotta) hover:underline"
                    >
                        View on Sui Explorer →
                    </a>
                )}
                <div className="mt-8">
                    <Button onClick={() => router.push(`/circles/${id}`)}>Back to circle</Button>
                </div>
            </div>
        );
    }

    const needsUsdc = circle && usdcBalance < circle.config.contributionAmount;

    return (
        <>
            <SwapModal
                open={swapOpen}
                onClose={() => setSwapOpen(false)}
                targetUsdc={circle.config.contributionAmount}
                onSuccess={handleSwapSuccess}
                label="circle contribution"
            />

            <RampModal
                open={rampOpen}
                onClose={() => setRampOpen(false)}
                walletAddress={walletAddress}
                defaultMode="BUY"
                onSuccess={handleRampSuccess}
            />

            <div className="max-w-sm mx-auto space-y-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-(--text-primary)">
                        Contribute to {circle.name}
                    </h1>
                    <p className="text-sm text-(--text-muted) mt-1">Cycle {circle.currentCycle + 1}</p>
                </div>

                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 space-y-4">
                    <div className="text-center py-4">
                        <p className="text-5xl font-mono font-bold text-(--text-primary)">
                            {formatUSDC(circle.config.contributionAmount)}
                        </p>
                        <CurrencyAmount
                            usdcRaw={circle.config.contributionAmount}
                            className="text-base text-(--text-muted) mt-1 block"
                        />
                        <p className="text-xs text-(--text-muted) mt-0.5">due this cycle</p>
                    </div>

                    {circle.currentCycleData?.endMs && (
                        <div className="flex justify-between text-sm border-t border-(--border-subtle) pt-4">
                            <span className="text-(--text-muted)">Deadline</span>
                            <span className="font-mono text-(--text-primary)">
                                {msToCountdown(circle.currentCycleData.endMs)}
                            </span>
                        </div>
                    )}

                    {circle.currentCycleData?.recipient && (
                        <div className="flex justify-between text-sm">
                            <span className="text-(--text-muted)">This cycle&apos;s recipient</span>
                            <span className="font-mono text-xs text-(--text-primary)">
                                {circle.currentCycleData.recipient.slice(0, 8)}...
                            </span>
                        </div>
                    )}

                    {circle.config.allowYield && estimatedYield > 0n && (
                        <div className="flex justify-between text-sm">
                            <span className="text-(--text-muted)">Est. yield if all contribute today</span>
                            <span className="font-mono text-(--gold-dim)">+{formatUSDC(estimatedYield)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm border-t border-(--border-subtle) pt-4">
                        <span className="text-(--text-muted)">Your USDC balance</span>
                        <span className={`font-mono text-sm ${needsUsdc ? 'text-red-500' : 'text-(--text-primary)'}`}>
                            {formatUSDC(usdcBalance)}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-(--text-muted)">Network fee</span>
                        <span className="font-mono text-(--text-muted)">≈ $0.001</span>
                    </div>

                    <p className="text-xs text-(--text-muted)">
                        Your contribution is locked in the smart contract and disbursed to this cycle&apos;s recipient when all members contribute.
                    </p>
                </div>

                {/* ── Fund CTAs ───────────────────────────────────────── */}
                {needsUsdc && (
                    <div className="rounded-2xl border border-(--terracotta)/30 bg-(--terracotta)/5 p-4 space-y-3">
                        <div className="flex items-start gap-2">
                            <Coins size={15} className="text-(--terracotta) shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-(--text-primary)">
                                    Not enough USDC — choose how to top up
                                </p>
                                <p className="text-xs text-(--text-muted) mt-0.5">
                                    Buy with local currency or swap your SUI.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="md"
                                className="gap-2 border-(--terracotta)/40 text-(--terracotta)"
                                onClick={() => setRampOpen(true)}
                            >
                                <ArrowDownToLine size={14} />
                                Buy with fiat
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                className="gap-2 border-(--terracotta)/40 text-(--terracotta)"
                                onClick={() => setSwapOpen(true)}
                            >
                                <ArrowRightLeft size={14} />
                                Swap SUI
                            </Button>
                        </div>
                        <p className="text-xs text-(--text-muted)">
                            Bank transfer · M-Pesa · UPI · PIX · Card · DeepBook swap
                        </p>
                    </div>
                )}

                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        {error}
                        {error.includes('swap') && (
                            <button
                                onClick={() => setSwapOpen(true)}
                                className="block mt-2 text-xs text-(--terracotta) hover:underline"
                            >
                                Open swap →
                            </button>
                        )}
                    </div>
                )}

                <Button
                    onClick={contribute}
                    disabled={submitting || needsUsdc}
                    size="xl"
                    className="w-full"
                >
                    {submitting
                        ? 'Confirming...'
                        : needsUsdc
                        ? 'Get USDC first (swap below)'
                        : `Contribute ${formatUSDC(circle.config.contributionAmount)}`}
                </Button>

                <Button variant="ghost" size="md" className="w-full" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </>
    );
}
