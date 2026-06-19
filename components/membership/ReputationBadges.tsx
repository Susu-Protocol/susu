import { formatUSDC } from '@/lib/utils';
import type { ContributionBadgeData } from '@/types/membership';

interface Props {
    badges: ContributionBadgeData[];
    maxShow?: number;
}

export function ReputationBadges({ badges, maxShow = 12 }: Props) {
    const sorted = [...badges]
        .sort((a, b) => Number(b.timestamp - a.timestamp))
        .slice(0, maxShow);

    if (sorted.length === 0) {
        return (
            <p className="text-sm text-(--text-muted)">No contribution badges yet.</p>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {sorted.map(badge => (
                <div
                    key={badge.id}
                    title={`Cycle ${badge.cycleIndex + 1} — ${formatUSDC(badge.amount)} — ${badge.onTime ? 'On time' : 'Late'}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-transform hover:scale-110 ${
                        badge.onTime
                            ? 'border-(--terracotta) bg-(--terracotta)/10 text-(--terracotta)'
                            : 'border-amber-400 bg-amber-50 text-amber-700'
                    }`}
                >
                    {badge.cycleIndex + 1}
                </div>
            ))}
            {badges.length > maxShow && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-(--border-default) bg-(--bg-warm) text-xs text-(--text-muted)">
                    +{badges.length - maxShow}
                </div>
            )}
        </div>
    );
}
