import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCircle } from '@/lib/sui/read';
import { ContributionRing } from '@/components/circle/ContributionRing';
import { MemberRow } from '@/components/circle/MemberRow';
import { RotationQueue } from '@/components/circle/RotationQueue';
import { YieldAccrualChart } from '@/components/circle/YieldAccrualChart';
import { InviteLink } from '@/components/circle/InviteLink';
import { JoinCircleButton, StartCircleButton } from '@/components/circle/CircleActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatUSDC, msToCountdown, cycleFrequencyLabel, explorerUrl } from '@/lib/utils';
import { CIRCLE_STATUS } from '@/lib/constants';
import { ExternalLink, Users, TrendingUp, Clock, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

const STATUS_BADGE: Record<number, { label: string; variant: 'success' | 'gold' | 'muted' | 'warning' }> = {
    0: { label: 'Forming', variant: 'gold' },
    1: { label: 'Active', variant: 'success' },
    2: { label: 'Complete', variant: 'muted' },
    3: { label: 'Paused', variant: 'warning' },
};

export default async function CircleDetailPage({ params }: Props) {
    const { id } = await params;
    const cookieStore = await cookies();
    const myAddress = cookieStore.get('susu_address')?.value ?? '';

    const circle = await getCircle(id).catch(() => null);
    if (!circle) notFound();

    const isMember = circle.members.includes(myAddress);
    const isOrganizer = circle.organizer === myAddress;
    const currentRecipient = circle.rotationQueue[circle.currentCycle];
    const contributions = circle.currentCycleData?.contributions ?? {};

    const members = circle.members.map(addr => ({
        address: addr,
        contributed: addr in contributions,
        late: addr in contributions && !contributions[addr as keyof typeof contributions],
        isRecipient: addr === currentRecipient,
    }));

    const collected = circle.currentCycleData?.collected ?? 0n;
    const target = circle.currentCycleData?.targetAmount ?? 0n;
    const progress = target > 0n ? Number((collected * 100n) / target) : 0;
    const deadline = circle.currentCycleData?.endMs;

    const iContributed = myAddress in contributions;
    const showContribute = isMember && circle.status === CIRCLE_STATUS.ACTIVE && !iContributed;
    const seatsLeft = circle.config.maxMembers - circle.members.length;
    const circlesFull = seatsLeft === 0;
    const statusBadge = STATUS_BADGE[circle.status] ?? { label: 'Unknown', variant: 'muted' as const };

    return (
        <div className="space-y-6">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="font-display text-2xl font-bold text-(--text-primary)">
                                {circle.name}
                            </h1>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                            {circle.config.allowYield && (
                                <span className="rounded-full border border-(--gold)/30 bg-(--gold)/8 px-2.5 py-0.5 text-xs font-medium text-(--gold-dim)">
                                    Yield-earning
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-(--text-muted)">
                            {cycleFrequencyLabel(circle.config.cycleDurationMs)} · {formatUSDC(circle.config.contributionAmount)} per cycle ·{' '}
                            {circle.members.length}/{circle.config.maxMembers} members
                        </p>
                        <a
                            href={explorerUrl('object', id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-xs text-(--text-muted) hover:text-(--terracotta) transition-colors"
                        >
                            <ExternalLink size={11} /> View on explorer
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                        {showContribute && (
                            <Link href={`/circles/${id}/contribute`}>
                                <Button size="md" className="gap-2">
                                    Contribute {formatUSDC(circle.config.contributionAmount)}
                                    <ArrowRight size={14} />
                                </Button>
                            </Link>
                        )}
                        {iContributed && circle.status === CIRCLE_STATUS.ACTIVE && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
                                ✓ Contributed this cycle
                            </span>
                        )}
                        {circle.status === CIRCLE_STATUS.FORMING && isOrganizer && circlesFull && (
                            <StartCircleButton circleId={id} />
                        )}
                        {circle.status === CIRCLE_STATUS.FORMING && !isMember && !circlesFull && (
                            <JoinCircleButton circleId={id} seatsLeft={seatsLeft} />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Active cycle progress ────────────────────────────────────── */}
            {circle.status === CIRCLE_STATUS.ACTIVE && (
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* Quick stats */}
                    {[
                        { icon: TrendingUp, label: 'Pool balance', value: formatUSDC(circle.poolBalance), color: 'text-(--terracotta)' },
                        { icon: Users, label: 'Contributed', value: `${members.filter(m => m.contributed).length}/${circle.members.length}`, color: 'text-(--text-primary)' },
                        { icon: Clock, label: 'Time left', value: deadline ? msToCountdown(deadline) : '—', color: 'text-(--gold-dim)', mono: true },
                    ].map(s => (
                        <div key={s.label} className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-(--text-muted)">
                                <s.icon size={13} /> <span className="text-xs">{s.label}</span>
                            </div>
                            <p className={`text-xl font-bold ${s.mono ? 'font-mono' : 'font-display'} ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Contribution ring + rotation queue ───────────────────────── */}
            {circle.status === CIRCLE_STATUS.ACTIVE && (
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Ring */}
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-display text-lg font-semibold text-(--text-primary)">
                                Cycle {circle.currentCycle + 1} progress
                            </h2>
                            {circle.config.allowYield && (
                                <span className="text-xs text-(--gold-dim) font-medium">~3% APY accruing</span>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <ContributionRing members={members} size={240} />
                            <div className="w-full space-y-1.5">
                                <div className="flex justify-between text-xs text-(--text-muted)">
                                    <span>{formatUSDC(collected)} collected</span>
                                    <span>{formatUSDC(target)} target</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        </div>
                    </div>

                    {/* Rotation queue */}
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6">
                        <h2 className="font-display text-lg font-semibold text-(--text-primary) mb-4">
                            Payout rotation
                        </h2>
                        <RotationQueue
                            queue={circle.rotationQueue}
                            currentCycle={circle.currentCycle}
                        />
                    </div>
                </div>
            )}

            {/* ── Members ──────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-semibold text-(--text-primary)">
                        Members
                    </h2>
                    <span className="text-xs text-(--text-muted)">
                        {circle.members.length}/{circle.config.maxMembers}
                    </span>
                </div>
                <div className="divide-y divide-(--border-subtle)">
                    {circle.members.map((addr, i) => (
                        <MemberRow
                            key={addr}
                            address={addr}
                            contributed={addr in contributions}
                            onTime={(contributions as Record<string, { onTime: boolean }>)[addr]?.onTime ?? false}
                            amount={(contributions as Record<string, { amount: bigint }>)[addr]?.amount}
                            isRecipient={addr === currentRecipient}
                            isOrganizer={addr === circle.organizer}
                            position={i + 1}
                        />
                    ))}
                </div>

                {/* Forming: show empty seats */}
                {circle.status === CIRCLE_STATUS.FORMING && seatsLeft > 0 && (
                    <div className="mt-4 space-y-2">
                        {Array.from({ length: seatsLeft }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 py-2.5 border-t border-dashed border-(--border-subtle)">
                                <span className="font-mono text-xs text-(--text-muted) w-5 text-right">{circle.members.length + i + 1}</span>
                                <div className="h-7 w-7 rounded-full border-2 border-dashed border-(--border-default) flex items-center justify-center">
                                    <span className="text-(--border-default) text-xs">?</span>
                                </div>
                                <span className="text-sm text-(--text-muted) italic">Open seat</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Yield chart ──────────────────────────────────────────────── */}
            {circle.config.allowYield && (
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6">
                    <div className="flex items-start justify-between mb-1">
                        <h2 className="font-display text-lg font-semibold text-(--text-primary)">
                            Yield earned
                        </h2>
                        <span className="text-xs font-medium text-(--gold-dim) bg-(--gold)/10 rounded-full px-2.5 py-0.5">
                            {formatUSDC(circle.accumulatedYield)} total
                        </span>
                    </div>
                    <p className="text-xs text-(--text-muted) mb-5">
                        Simulated Scallop yield at ~3% APY on USDC pooled between disbursements
                    </p>
                    <YieldAccrualChart data={[]} />
                </div>
            )}

            {/* ── History link ─────────────────────────────────────────────── */}
            <div className="flex justify-center">
                <Link href={`/circles/${id}/history`}>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-(--text-muted)">
                        View cycle history <ArrowRight size={13} />
                    </Button>
                </Link>
            </div>

            {/* ── Invite link ──────────────────────────────────────────────── */}
            {circle.status === CIRCLE_STATUS.FORMING && seatsLeft > 0 && (
                <InviteLink circleId={id} seatsLeft={seatsLeft} />
            )}

            {/* ── Complete state ───────────────────────────────────────────── */}
            {circle.status === CIRCLE_STATUS.COMPLETE && (
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-warm) p-8 text-center">
                    <p className="text-4xl mb-3">🎉</p>
                    <h3 className="font-display text-xl font-semibold text-(--text-primary)">
                        Circle complete!
                    </h3>
                    <p className="text-sm text-(--text-muted) mt-2">
                        All {circle.totalCycles} members have received their payout.
                        {circle.config.allowYield && ` ${formatUSDC(circle.accumulatedYield)} was earned in yield.`}
                    </p>
                    <div className="mt-6">
                        <Link href="/circles">
                            <Button variant="outline">Browse more circles</Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
