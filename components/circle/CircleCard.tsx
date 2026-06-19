import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatUSDC, msToCountdown, cycleFrequencyLabel, shortenAddress } from '@/lib/utils';
import { CIRCLE_STATUS } from '@/lib/constants';
import { CurrencyAmount } from '@/components/fiat/CurrencyAmount';
import type { CircleData } from '@/types/circle';

const statusLabel: Record<number, { label: string; variant: 'success' | 'gold' | 'muted' | 'warning' }> = {
    0: { label: 'Forming', variant: 'gold' },
    1: { label: 'Active', variant: 'success' },
    2: { label: 'Complete', variant: 'muted' },
    3: { label: 'Paused', variant: 'warning' },
};

interface Props {
    circle: CircleData;
    showJoin?: boolean;
}

export function CircleCard({ circle, showJoin }: Props) {
    const status = statusLabel[circle.status] ?? { label: 'Unknown', variant: 'muted' };
    const collected = circle.currentCycleData?.collected ?? 0n;
    const target = circle.currentCycleData?.targetAmount ?? 0n;
    const progress = target > 0n ? Number((collected * 100n) / target) : 0;
    const nextDeadline = circle.currentCycleData?.endMs;

    return (
        <Link href={`/circles/${circle.id}`} className="block group">
            <Card className="transition-all hover:shadow-md hover:border-(--border-default) group-hover:translate-y-[-2px]">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h3 className="font-display text-lg font-semibold text-(--text-primary) truncate">
                                {circle.name}
                            </h3>
                            <p className="text-sm text-(--text-muted) mt-0.5">
                                by {shortenAddress(circle.organizer)}
                            </p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="font-mono text-base font-semibold text-(--terracotta)">
                                {formatUSDC(circle.config.contributionAmount)}
                            </p>
                            <CurrencyAmount
                                usdcRaw={circle.config.contributionAmount}
                                compact
                                className="text-xs text-(--text-muted)"
                            />
                            <p className="text-xs text-(--text-muted)">per cycle</p>
                        </div>
                        <div>
                            <p className="font-mono text-base font-semibold text-(--text-primary)">
                                {circle.members.length}/{circle.config.maxMembers}
                            </p>
                            <p className="text-xs text-(--text-muted)">members</p>
                        </div>
                        <div>
                            <p className="text-base font-semibold text-(--text-primary)">
                                {cycleFrequencyLabel(circle.config.cycleDurationMs)}
                            </p>
                            <p className="text-xs text-(--text-muted)">frequency</p>
                        </div>
                    </div>

                    {circle.status === CIRCLE_STATUS.ACTIVE && (
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-xs text-(--text-muted)">
                                <span>Cycle {circle.currentCycle + 1} of {circle.totalCycles}</span>
                                {nextDeadline && (
                                    <span className="font-mono">{msToCountdown(nextDeadline)} left</span>
                                )}
                            </div>
                            <Progress value={progress} />
                            <div className="flex justify-between text-xs text-(--text-muted)">
                                <span>{formatUSDC(collected)} collected</span>
                                <span>{formatUSDC(target)} target</span>
                            </div>
                        </div>
                    )}

                    {circle.config.allowYield && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-(--gold-dim)">
                            <span>Yield-earning</span>
                            <span className="text-(--text-muted)">via Scallop</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
