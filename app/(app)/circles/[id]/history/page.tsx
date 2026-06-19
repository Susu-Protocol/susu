import { notFound } from 'next/navigation';
import { getCircle } from '@/lib/sui/read';
import { CycleTimeline } from '@/components/circle/CycleTimeline';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function CircleHistoryPage({ params }: Props) {
    const { id } = await params;
    const circle = await getCircle(id).catch(() => null);
    if (!circle) notFound();

    const futureRecipients = circle.rotationQueue.slice(circle.currentCycle + 1);

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <h1 className="font-display text-2xl font-bold text-(--text-primary)">
                {circle.name} — History
            </h1>
            <CycleTimeline
                pastCycles={[]}
                currentCycle={circle.currentCycle}
                totalCycles={circle.totalCycles}
                futureRecipients={futureRecipients}
                nextDeadlineMs={circle.currentCycleData?.endMs}
            />
        </div>
    );
}
