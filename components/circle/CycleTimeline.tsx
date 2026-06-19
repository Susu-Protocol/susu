import { formatUSDC } from '@/lib/utils';
import { AddressChip } from '@/components/wallet/AddressChip';
import { Badge } from '@/components/ui/badge';

interface PastCycle {
    index: number;
    recipient: string;
    amountDisbursed: bigint;
    yieldEarned: bigint;
    completedAt: number;
}

interface Props {
    pastCycles: PastCycle[];
    currentCycle: number;
    totalCycles: number;
    futureRecipients: string[];
    nextDeadlineMs?: bigint;
}

export function CycleTimeline({
    pastCycles,
    currentCycle,
    totalCycles,
    futureRecipients,
    nextDeadlineMs,
}: Props) {
    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-(--border-subtle)" />

            <div className="space-y-4 pl-10">
                {/* Past cycles */}
                {pastCycles.map(c => (
                    <div key={c.index} className="relative">
                        <div className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-(--terracotta) border-2 border-white" />
                        <div className="rounded-xl border border-(--border-subtle) bg-(--bg-warm) p-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-(--text-muted)">Cycle {c.index + 1}</span>
                                <Badge variant="success">Completed</Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <AddressChip address={c.recipient} />
                                <span className="text-sm font-mono text-(--text-primary)">
                                    received {formatUSDC(c.amountDisbursed)}
                                </span>
                            </div>
                            {c.yieldEarned > 0n && (
                                <p className="mt-1 text-xs text-(--gold-dim)">
                                    +{formatUSDC(c.yieldEarned)} yield
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {/* Current cycle */}
                <div className="relative">
                    <div className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-(--gold) border-2 border-white animate-pulse" />
                    <div className="rounded-xl border border-(--gold)/40 bg-(--gold)/5 p-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-(--text-muted)">
                                Cycle {currentCycle + 1} — Current
                            </span>
                            <Badge variant="gold">Active</Badge>
                        </div>
                        {nextDeadlineMs && (
                            <p className="mt-1 text-xs text-(--text-secondary)">
                                Deadline: {new Date(Number(nextDeadlineMs)).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Future cycles */}
                {futureRecipients.slice(0, 3).map((addr, i) => {
                    const cycleNum = currentCycle + i + 2;
                    if (cycleNum > totalCycles) return null;
                    return (
                        <div key={addr + i} className="relative opacity-50">
                            <div className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-(--border-default) border-2 border-white" />
                            <div className="rounded-xl border border-(--border-subtle) bg-(--bg-surface) p-3">
                                <span className="text-xs font-medium text-(--text-muted)">
                                    Cycle {cycleNum}
                                </span>
                                <div className="mt-1">
                                    <AddressChip address={addr} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
