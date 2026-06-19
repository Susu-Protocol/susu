import { cookies } from 'next/headers';
import Link from 'next/link';
import { getCirclesByMember, getReputationProfile } from '@/lib/sui/read';
import { CircleCard } from '@/components/circle/CircleCard';
import { Button } from '@/components/ui/button';
import { formatUSDC } from '@/lib/utils';
import { PlusCircle, ArrowRight, TrendingUp, Users, Award, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const address = cookieStore.get('susu_address')?.value ?? '';

    const [circles, profile] = await Promise.all([
        getCirclesByMember(address).catch(() => []),
        getReputationProfile(address).catch(() => ({
            address,
            membershipTokens: [],
            badges: [],
            totalCirclesCompleted: 0,
            totalContributedUSDC: 0n,
            onTimeContributionRate: 0,
            longestStreak: 0,
        })),
    ]);

    const activeCircles = circles.filter(c => c.status === 1);
    const formingCircles = circles.filter(c => c.status === 0);
    const completedCircles = circles.filter(c => c.status === 2);
    const onTimePercent = Math.round(profile.onTimeContributionRate * 100);

    return (
        <div className="space-y-8">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-(--text-primary)">
                        Dashboard
                    </h1>
                    <p className="mt-1.5 font-mono text-xs text-(--text-muted)">
                        {address.slice(0, 10)}…{address.slice(-6)}
                    </p>
                </div>
                <Link href="/circles/create">
                    <Button size="md" className="gap-1.5 shadow-sm">
                        <PlusCircle size={15} /> Create circle
                    </Button>
                </Link>
            </div>

            {/* ── Stats bar ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    {
                        label: 'Active circles',
                        value: activeCircles.length.toString(),
                        icon: Users,
                        color: 'text-(--terracotta)',
                        bg: 'bg-(--terracotta)/8',
                    },
                    {
                        label: 'Total contributed',
                        value: formatUSDC(profile.totalContributedUSDC),
                        icon: TrendingUp,
                        color: 'text-(--gold-dim)',
                        bg: 'bg-(--gold)/8',
                    },
                    {
                        label: 'On-time rate',
                        value: circles.length === 0 ? '—' : `${onTimePercent}%`,
                        icon: Clock,
                        color: 'text-green-600',
                        bg: 'bg-green-50',
                    },
                    {
                        label: 'Circles completed',
                        value: completedCircles.length.toString(),
                        icon: Award,
                        color: 'text-(--sui-blue)',
                        bg: 'bg-blue-50',
                    },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 space-y-3">
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${s.bg}`}>
                            <s.icon size={16} className={s.color} />
                        </div>
                        <div>
                            <p className="font-mono text-xl font-bold text-(--text-primary)">{s.value}</p>
                            <p className="text-xs text-(--text-muted) mt-0.5">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Active circles ───────────────────────────────────────────── */}
            {activeCircles.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xl font-semibold text-(--text-primary)">
                            Active circles
                        </h2>
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            {activeCircles.length} running
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {activeCircles.map(c => (
                            <CircleCard key={c.id} circle={c} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Forming circles ──────────────────────────────────────────── */}
            {formingCircles.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xl font-semibold text-(--text-primary)">
                            Forming — waiting for members
                        </h2>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            {formingCircles.length} open
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {formingCircles.map(c => (
                            <CircleCard key={c.id} circle={c} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Completed circles ────────────────────────────────────────── */}
            {completedCircles.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xl font-semibold text-(--text-primary)">
                            Completed
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {completedCircles.map(c => (
                            <CircleCard key={c.id} circle={c} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Empty state ──────────────────────────────────────────────── */}
            {circles.length === 0 && (
                <div className="rounded-3xl border-2 border-dashed border-(--border-default) p-12 text-center">
                    <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-(--terracotta)/8 flex items-center justify-center">
                        <Users size={28} className="text-(--terracotta)" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-(--text-primary)">
                        No circles yet
                    </h3>
                    <p className="mt-2 text-sm text-(--text-muted) max-w-sm mx-auto">
                        Start a savings circle with your community, or browse open circles looking for members.
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link href="/circles/create">
                            <Button size="md">Create a circle</Button>
                        </Link>
                        <Link href="/circles">
                            <Button variant="outline" size="md">Browse open circles</Button>
                        </Link>
                    </div>

                    {/* How it works mini */}
                    <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
                        {[
                            { n: '1', title: 'Create or join', body: 'Set up a circle with your group or join an open one.' },
                            { n: '2', title: 'Contribute each cycle', body: 'Everyone contributes. Funds are locked in the smart contract.' },
                            { n: '3', title: 'Receive the pot', body: 'Each cycle one member collects the full pool plus yield earned.' },
                        ].map(s => (
                            <div key={s.n} className="rounded-2xl bg-(--bg-warm) p-4">
                                <div className="h-7 w-7 rounded-full bg-(--terracotta) text-white text-sm font-bold flex items-center justify-center mb-2">
                                    {s.n}
                                </div>
                                <p className="font-semibold text-sm text-(--text-primary)">{s.title}</p>
                                <p className="text-xs text-(--text-muted) mt-1">{s.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Profile CTA ──────────────────────────────────────────────── */}
            {circles.length > 0 && (
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-5 flex items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-sm text-(--text-primary)">Your savings profile</p>
                        <p className="text-xs text-(--text-muted) mt-0.5">
                            {profile.badges.length} on-chain contribution badge{profile.badges.length !== 1 ? 's' : ''} · verifiable forever
                        </p>
                    </div>
                    <Link href={`/profile/${address}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                            View profile <ArrowRight size={13} />
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
