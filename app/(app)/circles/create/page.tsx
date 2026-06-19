'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getEnokiAddress, signWithEnoki } from '@/lib/sui/enoki';
import { executeTransaction } from '@/lib/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Check, AlertCircle, Users, Clock, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
    name: string;
    denomination: 'USDC' | 'SUI';
    contributionAmount: string;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    maxMembers: number;
    rotationType: 0 | 1;
    yieldMode: 0 | 1 | 2;
    entryDepositRequired: boolean;
    allowYield: boolean;
}

const FREQUENCY_MS: Record<string, bigint> = {
    weekly:   BigInt(7 * 24 * 3600 * 1000),
    biweekly: BigInt(14 * 24 * 3600 * 1000),
    monthly:  BigInt(30 * 24 * 3600 * 1000),
};

const USDC_DECIMALS = 6;

const STEPS = [
    { n: 1, title: 'Name & currency' },
    { n: 2, title: 'Amount & timing' },
    { n: 3, title: 'Members' },
    { n: 4, title: 'Yield & deposit' },
    { n: 5, title: 'Review & deploy' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => onChange(!value)}
            className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terracotta) ${value ? 'bg-(--terracotta)' : 'bg-(--border-default)'}`}
        >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
    );
}

/* ── Live preview card ──────────────────────────────────────────────────── */
function PreviewCard({ form }: { form: FormData }) {
    const amount = parseFloat(form.contributionAmount || '0');
    const pot = amount * form.maxMembers;
    const freqLabel = form.frequency === 'biweekly' ? 'Bi-weekly' : form.frequency.charAt(0).toUpperCase() + form.frequency.slice(1);

    return (
        <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-(--text-primary) truncate">
                    {form.name || 'Your circle'}
                </h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 font-medium shrink-0 ml-2">
                    Forming
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-xl bg-(--bg-warm) p-2.5">
                    <p className="font-mono font-bold text-(--terracotta)">${amount > 0 ? amount.toFixed(0) : '—'}</p>
                    <p className="text-xs text-(--text-muted) mt-0.5">per cycle</p>
                </div>
                <div className="rounded-xl bg-(--bg-warm) p-2.5">
                    <p className="font-bold text-(--text-primary)">{form.maxMembers}</p>
                    <p className="text-xs text-(--text-muted) mt-0.5">members</p>
                </div>
                <div className="rounded-xl bg-(--bg-warm) p-2.5">
                    <p className="font-bold text-(--text-primary)">{freqLabel}</p>
                    <p className="text-xs text-(--text-muted) mt-0.5">frequency</p>
                </div>
            </div>

            <div className="rounded-xl border border-(--border-subtle) p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-(--text-muted)">Pot per cycle</span>
                    <span className="font-mono font-semibold text-(--text-primary)">${pot.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-(--text-muted)">Payout order</span>
                    <span className="text-(--text-secondary)">{form.rotationType === 0 ? 'Fixed' : 'Random'}</span>
                </div>
                {form.allowYield && (
                    <div className="flex justify-between">
                        <span className="text-(--text-muted)">Yield</span>
                        <span className="text-(--gold-dim) font-medium">~3% APY</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                {form.allowYield && (
                    <span className="rounded-full bg-(--gold)/10 border border-(--gold)/25 px-2 py-0.5 text-xs text-(--gold-dim) font-medium">
                        Yield-earning
                    </span>
                )}
                {form.entryDepositRequired && (
                    <span className="rounded-full bg-(--terracotta)/10 border border-(--terracotta)/20 px-2 py-0.5 text-xs text-(--terracotta) font-medium">
                        Entry deposit
                    </span>
                )}
                <span className="rounded-full bg-(--border-subtle) px-2 py-0.5 text-xs text-(--text-muted)">
                    {form.denomination}
                </span>
            </div>
        </div>
    );
}

export default function CreateCirclePage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<FormData>({
        name: '',
        denomination: 'USDC',
        contributionAmount: '100',
        frequency: 'monthly',
        maxMembers: 5,
        rotationType: 0,
        yieldMode: 0,
        entryDepositRequired: false,
        allowYield: true,
    });

    function update<K extends keyof FormData>(key: K, val: FormData[K]) {
        setForm(f => ({ ...f, [key]: val }));
    }

    async function submit() {
        setSubmitting(true);
        setError('');
        try {
            const signerAddress = await getEnokiAddress();
            if (!signerAddress) throw new Error('Please sign in first');

            const amountRaw = BigInt(Math.round(parseFloat(form.contributionAmount) * 10 ** USDC_DECIMALS));

            const res = await fetch('/api/circles/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    contributionAmount: amountRaw.toString(),
                    cycleDurationMs: FREQUENCY_MS[form.frequency].toString(),
                    maxMembers: form.maxMembers,
                    rotationType: form.rotationType,
                    penaltyRateBps: 200,
                    allowYield: form.allowYield,
                    yieldMode: form.yieldMode,
                    entryDepositRequired: form.entryDepositRequired,
                    entryDepositAmount: '0',
                    signerAddress,
                }),
            });

            if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to build transaction');
            const { txBytes } = await res.json();
            const tx = Transaction.from(new Uint8Array(txBytes));
            const bytes = await tx.build({ onlyTransactionKind: false });
            const signature = await signWithEnoki(bytes);
            const result = await executeTransaction(bytes, signature);

            if (result.effects?.status.status === 'success') {
                router.push('/dashboard');
            } else {
                throw new Error(result.effects?.status.error ?? 'Transaction failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setSubmitting(false);
        }
    }

    const canAdvance = !(step === 1 && !form.name.trim());

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-(--text-primary)">Create a savings circle</h1>
                <p className="mt-1.5 text-sm text-(--text-muted)">
                    Step {step} of 5 — {STEPS[step - 1].title}
                </p>
            </div>

            {/* Progress */}
            <div className="flex gap-1.5 mb-8">
                {STEPS.map(s => (
                    <button
                        key={s.n}
                        onClick={() => s.n < step && setStep(s.n as Step)}
                        className={`flex-1 h-1.5 rounded-full transition-all ${
                            s.n < step ? 'bg-(--terracotta) cursor-pointer' :
                            s.n === step ? 'bg-(--terracotta)' :
                            'bg-(--border-subtle)'
                        }`}
                    />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
                {/* ── Form panel ──────────────────────────────────────────── */}
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6">
                    {/* Step 1 — Name & currency */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-(--text-primary) mb-2">
                                    Circle name <span className="text-(--danger)">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => update('name', e.target.value)}
                                    placeholder="e.g. Lagos Friday Susu"
                                    className="w-full rounded-xl border border-(--border-default) bg-(--bg-cream) px-4 py-3 text-sm focus:border-(--terracotta) focus:outline-none transition-colors"
                                    maxLength={50}
                                    autoFocus
                                />
                                <p className="text-xs text-(--text-muted) mt-1.5">{form.name.length}/50 characters</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-(--text-primary) mb-2">Currency</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['USDC', 'SUI'] as const).map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => update('denomination', d)}
                                            className={`rounded-xl border py-4 text-sm font-medium transition-all ${
                                                form.denomination === d
                                                    ? 'border-(--terracotta) bg-(--terracotta)/5 text-(--terracotta) shadow-sm'
                                                    : 'border-(--border-default) text-(--text-secondary) hover:bg-(--bg-warm)'
                                            }`}
                                        >
                                            <p className="font-bold">{d}</p>
                                            <p className="text-xs mt-0.5 font-normal text-(--text-muted)">
                                                {d === 'USDC' ? 'Stablecoin, no price risk' : 'Native Sui token'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Amount & timing */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-(--text-primary) mb-2">
                                    Contribution per cycle ({form.denomination})
                                </label>
                                <div className="relative">
                                    <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                                    <input
                                        type="number"
                                        value={form.contributionAmount}
                                        onChange={e => update('contributionAmount', e.target.value)}
                                        className="w-full rounded-xl border border-(--border-default) bg-(--bg-cream) px-4 py-3 pl-9 text-sm font-mono focus:border-(--terracotta) focus:outline-none transition-colors"
                                        min="1" step="1"
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                    {[25, 50, 100, 500].map(v => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => update('contributionAmount', v.toString())}
                                            className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                                                form.contributionAmount === v.toString()
                                                    ? 'border-(--terracotta) bg-(--terracotta)/5 text-(--terracotta)'
                                                    : 'border-(--border-default) text-(--text-muted) hover:bg-(--bg-warm)'
                                            }`}
                                        >
                                            ${v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-(--text-primary) mb-2">Contribution frequency</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {([
                                        { val: 'weekly', label: 'Weekly', sub: 'Every 7 days' },
                                        { val: 'biweekly', label: 'Bi-weekly', sub: 'Every 14 days' },
                                        { val: 'monthly', label: 'Monthly', sub: 'Every 30 days' },
                                    ] as const).map(f => (
                                        <button
                                            key={f.val}
                                            type="button"
                                            onClick={() => update('frequency', f.val)}
                                            className={`rounded-xl border py-3 text-sm transition-all ${
                                                form.frequency === f.val
                                                    ? 'border-(--terracotta) bg-(--terracotta)/5 text-(--terracotta)'
                                                    : 'border-(--border-default) text-(--text-secondary) hover:bg-(--bg-warm)'
                                            }`}
                                        >
                                            <p className="font-medium">{f.label}</p>
                                            <p className="text-xs mt-0.5 text-(--text-muted) font-normal">{f.sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Members */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-(--text-primary)">Number of members</label>
                                    <span className="font-mono text-xl font-bold text-(--terracotta)">{form.maxMembers}</span>
                                </div>
                                <input
                                    type="range" min={2} max={20}
                                    value={form.maxMembers}
                                    onChange={e => update('maxMembers', Number(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-(--text-muted) mt-1">
                                    <span>2 members</span><span>20 members</span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-(--border-subtle) bg-(--bg-warm) p-4 space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-(--text-muted)">
                                        <Users size={13} /> Total pot per cycle
                                    </span>
                                    <span className="font-mono font-bold text-(--text-primary)">
                                        ${(parseFloat(form.contributionAmount || '0') * form.maxMembers).toFixed(2)} {form.denomination}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-(--text-muted)">
                                        <Clock size={13} /> Total duration
                                    </span>
                                    <span className="text-(--text-secondary)">
                                        {form.maxMembers} {form.frequency === 'weekly' ? 'weeks' : form.frequency === 'biweekly' ? 'bi-weekly periods' : 'months'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-(--text-primary) mb-2">Payout order</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {([
                                        { val: 0, title: 'Fixed order', desc: 'Members receive in join order. Predictable and transparent.' },
                                        { val: 1, title: 'Random (commit-reveal)', desc: 'Cryptographically fair randomness. No one can game the order.' },
                                    ] as const).map(o => (
                                        <button
                                            key={o.val}
                                            type="button"
                                            onClick={() => update('rotationType', o.val)}
                                            className={`rounded-xl border p-4 text-left transition-all ${
                                                form.rotationType === o.val
                                                    ? 'border-(--terracotta) bg-(--terracotta)/5'
                                                    : 'border-(--border-default) hover:bg-(--bg-warm)'
                                            }`}
                                        >
                                            <p className="text-sm font-semibold text-(--text-primary)">{o.title}</p>
                                            <p className="text-xs text-(--text-muted) mt-1 leading-relaxed">{o.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4 — Yield & deposit */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-(--border-subtle) p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-(--text-primary) flex items-center gap-1.5">
                                            <TrendingUp size={14} className="text-(--gold-dim)" /> Enable yield
                                        </p>
                                        <p className="text-xs text-(--text-muted) mt-0.5">
                                            Idle pool funds earn ~3% APY via Scallop between cycles
                                        </p>
                                    </div>
                                    <Toggle value={form.allowYield} onChange={v => update('allowYield', v)} />
                                </div>
                            </div>

                            {form.allowYield && (
                                <div>
                                    <label className="block text-sm font-semibold text-(--text-primary) mb-2">Yield distribution</label>
                                    <div className="space-y-2">
                                        {([
                                            { val: 0, title: 'Recipient bonus', desc: 'Yield goes to the cycle winner on top of the pot. Extra reward for waiting.' },
                                            { val: 1, title: 'Pro-rata split', desc: 'Yield is split among all on-time contributors proportionally.' },
                                            { val: 2, title: 'Reserve fund', desc: 'Yield builds a buffer that covers late penalties and protects the group.' },
                                        ] as const).map(o => (
                                            <button
                                                key={o.val}
                                                type="button"
                                                onClick={() => update('yieldMode', o.val)}
                                                className={`w-full rounded-xl border p-4 text-left transition-all ${
                                                    form.yieldMode === o.val
                                                        ? 'border-(--terracotta) bg-(--terracotta)/5'
                                                        : 'border-(--border-default) hover:bg-(--bg-warm)'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {form.yieldMode === o.val && <Check size={13} className="text-(--terracotta) shrink-0" />}
                                                    <p className="text-sm font-semibold text-(--text-primary)">{o.title}</p>
                                                </div>
                                                <p className="text-xs text-(--text-muted) mt-1 leading-relaxed ml-5">{o.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl border border-(--border-subtle) p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-(--text-primary)">Entry deposit</p>
                                        <p className="text-xs text-(--text-muted) mt-0.5">
                                            Forfeited if member exits early — signals commitment
                                        </p>
                                    </div>
                                    <Toggle value={form.entryDepositRequired} onChange={v => update('entryDepositRequired', v)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5 — Review */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <h3 className="font-display text-lg font-semibold text-(--text-primary)">
                                Review your circle
                            </h3>
                            <div className="rounded-xl border border-(--border-subtle) overflow-hidden">
                                {[
                                    { label: 'Name', value: form.name || '—' },
                                    { label: 'Currency', value: form.denomination },
                                    { label: 'Contribution', value: `$${form.contributionAmount} per ${form.frequency === 'biweekly' ? 'bi-weekly' : form.frequency} cycle` },
                                    { label: 'Members', value: `${form.maxMembers} (pot: $${(parseFloat(form.contributionAmount || '0') * form.maxMembers).toFixed(2)})` },
                                    { label: 'Payout order', value: form.rotationType === 0 ? 'Fixed (join order)' : 'Random (commit-reveal)' },
                                    { label: 'Yield', value: form.allowYield ? `Enabled — ${['Recipient bonus', 'Pro-rata', 'Reserve'][form.yieldMode]}` : 'Disabled' },
                                    { label: 'Entry deposit', value: form.entryDepositRequired ? 'Required' : 'None' },
                                    { label: 'Gas fee', value: '≈ $0.001' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between text-sm px-4 py-3 border-b border-(--border-subtle) last:border-0 hover:bg-(--bg-warm) transition-colors">
                                        <span className="text-(--text-muted)">{label}</span>
                                        <span className="font-medium text-(--text-primary) text-right ml-4">{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-xl border border-(--border-subtle) bg-(--bg-warm) p-4 text-sm text-(--text-secondary)">
                                <p className="font-medium text-(--text-primary) mb-1">What happens next</p>
                                <p className="text-xs leading-relaxed">
                                    A new circle object is created on Sui. A MembershipToken NFT will be minted to your wallet.
                                    Share the circle link to recruit other members, then start the circle once all {form.maxMembers} seats are filled.
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Live preview ─────────────────────────────────────────── */}
                <div className="hidden lg:block">
                    <p className="text-xs font-semibold uppercase tracking-widest text-(--text-muted) mb-3">Live preview</p>
                    <PreviewCard form={form} />
                </div>
            </div>

            {/* ── Navigation ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mt-6">
                {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(s => (s - 1) as Step)} className="gap-1.5">
                        <ChevronLeft size={15} /> Back
                    </Button>
                ) : (
                    <div />
                )}
                {step < 5 ? (
                    <Button
                        onClick={() => setStep(s => (s + 1) as Step)}
                        disabled={!canAdvance}
                        className="gap-1.5"
                    >
                        Continue <ChevronRight size={15} />
                    </Button>
                ) : (
                    <Button onClick={submit} disabled={submitting} className="gap-1.5 min-w-36">
                        {submitting ? (
                            <>
                                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                Deploying…
                            </>
                        ) : 'Deploy circle'}
                    </Button>
                )}
            </div>
        </div>
    );
}
