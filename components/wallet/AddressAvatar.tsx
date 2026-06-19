import { cn } from '@/lib/utils';

function hashToHue(address: string): number {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
        hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
    }
    return hash % 360;
}

interface Props {
    address: string;
    size?: number;
    rounded?: 'full' | '2xl';
    className?: string;
}

/** Deterministic gradient avatar — every address gets its own distinct, stable color. */
export function AddressAvatar({ address, size = 28, rounded = 'full', className }: Props) {
    const hue = hashToHue(address);
    return (
        <div
            className={cn('shrink-0', rounded === 'full' ? 'rounded-full' : 'rounded-2xl', className)}
            style={{
                width: size,
                height: size,
                background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), hsl(${(hue + 50) % 360}, 70%, 45%))`,
            }}
        />
    );
}
