import { AddressChip } from '@/components/wallet/AddressChip';
import { Badge } from '@/components/ui/badge';

interface Props {
    queue: string[];
    currentCycle: number;
    maxShow?: number;
}

export function RotationQueue({ queue, currentCycle, maxShow = 4 }: Props) {
    const upcoming = queue.slice(currentCycle, currentCycle + maxShow);

    return (
        <div className="space-y-2">
            {upcoming.map((address, i) => {
                const cycleNum = currentCycle + i + 1;
                const isCurrent = i === 0;

                return (
                    <div
                        key={address}
                        className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                            isCurrent
                                ? 'bg-(--gold)/10 border border-(--gold)/30'
                                : 'bg-(--bg-warm)'
                        }`}
                    >
                        <span className="font-mono text-xs text-(--text-muted) w-12">
                            Cycle {cycleNum}
                        </span>
                        <AddressChip address={address} />
                        {isCurrent && (
                            <Badge variant="gold" className="ml-auto">
                                Next payout
                            </Badge>
                        )}
                    </div>
                );
            })}
            {queue.length > currentCycle + maxShow && (
                <p className="text-xs text-(--text-muted) text-center pt-1">
                    +{queue.length - currentCycle - maxShow} more cycles
                </p>
            )}
        </div>
    );
}
