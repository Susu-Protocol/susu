import { cn } from '@/lib/utils';

interface LogoMarkProps {
    size?: number;
    className?: string;
}

/** Standalone icon mark — the rotating savings ring with the payout coin. */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            className={cn('shrink-0', className)}
            aria-hidden="true"
        >
            <rect width="512" height="512" rx="112" fill="var(--terracotta)" />
            <g transform="rotate(-45 256 256)">
                <circle
                    cx="256"
                    cy="256"
                    r="138"
                    fill="none"
                    stroke="#FBF4EA"
                    strokeWidth="66"
                    strokeLinecap="round"
                    strokeDasharray="650.97 217.04"
                />
            </g>
            <circle cx="256" cy="118" r="46" fill="var(--gold)" />
            <circle cx="242" cy="104" r="13" fill="#FBE8A8" opacity="0.8" />
        </svg>
    );
}

interface LogoProps {
    size?: number;
    className?: string;
    wordmarkClassName?: string;
    showWordmark?: boolean;
}

/** Full lockup: icon mark + "Susu" wordmark, used in nav/footer. */
export function Logo({ size = 32, className, wordmarkClassName, showWordmark = true }: LogoProps) {
    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <LogoMark size={size} />
            {showWordmark && (
                <span className={cn('font-display font-bold text-(--terracotta)', wordmarkClassName)}>
                    Susu
                </span>
            )}
        </span>
    );
}
