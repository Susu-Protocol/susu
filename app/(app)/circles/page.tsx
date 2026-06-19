import Link from 'next/link';
import { getAllOpenCircles } from '@/lib/sui/read';
import { CircleCard } from '@/components/circle/CircleCard';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CirclesPage() {
    const circles = await getAllOpenCircles().catch(() => []);

    const weekly = circles.filter(c => c.config.cycleDurationMs <= BigInt(7 * 24 * 3600 * 1000));
    const monthly = circles.filter(c => c.config.cycleDurationMs > BigInt(14 * 24 * 3600 * 1000));

    return (
        <div className="space-y-8">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-(--text-primary)">
                        Open circles
                    </h1>
                    <p className="mt-1.5 text-sm text-(--text-muted)">
                        {circles.length === 0
                            ? 'No circles forming right now — be the first.'
                            : `${circles.length} circle${circles.length !== 1 ? 's' : ''} forming and looking for members`}
                    </p>
                </div>
                <Link href="/circles/create">
                    <Button size="md" className="gap-1.5 shadow-sm shrink-0">
                        <PlusCircle size={15} /> Create circle
                    </Button>
                </Link>
            </div>

            {/* ── Info banner ──────────────────────────────────────────────── */}
            {circles.length > 0 && (
                <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-warm) px-5 py-4 flex items-start gap-3">
                    <Search size={16} className="text-(--text-muted) mt-0.5 shrink-0" />
                    <p className="text-sm text-(--text-secondary)">
                        These circles are open for new members. Joining locks you in for the full duration and a membership token is minted to your wallet.
                    </p>
                </div>
            )}

            {/* ── Content ──────────────────────────────────────────────────── */}
            {circles.length > 0 ? (
                <div className="space-y-8">
                    {weekly.length > 0 && (
                        <section>
                            <h2 className="font-display text-lg font-semibold text-(--text-primary) mb-4">
                                Weekly circles
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {weekly.map(c => (
                                    <CircleCard key={c.id} circle={c} showJoin />
                                ))}
                            </div>
                        </section>
                    )}
                    {monthly.length > 0 && (
                        <section>
                            <h2 className="font-display text-lg font-semibold text-(--text-primary) mb-4">
                                Monthly circles
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {monthly.map(c => (
                                    <CircleCard key={c.id} circle={c} showJoin />
                                ))}
                            </div>
                        </section>
                    )}
                    {/* Circles not in weekly or monthly */}
                    {circles.filter(c =>
                        c.config.cycleDurationMs > BigInt(7 * 24 * 3600 * 1000) &&
                        c.config.cycleDurationMs <= BigInt(14 * 24 * 3600 * 1000)
                    ).length > 0 && (
                        <section>
                            <h2 className="font-display text-lg font-semibold text-(--text-primary) mb-4">
                                Bi-weekly circles
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {circles
                                    .filter(c =>
                                        c.config.cycleDurationMs > BigInt(7 * 24 * 3600 * 1000) &&
                                        c.config.cycleDurationMs <= BigInt(14 * 24 * 3600 * 1000)
                                    )
                                    .map(c => <CircleCard key={c.id} circle={c} showJoin />)}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <div className="rounded-3xl border-2 border-dashed border-(--border-default) p-16 text-center">
                    <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-(--terracotta)/8 flex items-center justify-center">
                        <Users size={28} className="text-(--terracotta)" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-(--text-primary)">
                        No open circles right now
                    </h3>
                    <p className="mt-2 text-sm text-(--text-muted) max-w-sm mx-auto">
                        Be the first to start one. Your community is waiting.
                    </p>
                    <div className="mt-8">
                        <Link href="/circles/create">
                            <Button size="lg">Start a circle</Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
