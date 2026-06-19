import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn('shimmer rounded-xl', className)} />
    );
}

export function CircleCardSkeleton() {
    return (
        <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-3.5 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-2" />
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-5 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-20" />
        </div>
    );
}
