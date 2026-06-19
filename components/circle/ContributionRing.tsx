'use client';

import { motion } from 'framer-motion';
import { shortenAddress } from '@/lib/utils';

interface Member {
    address: string;
    contributed: boolean;
    late: boolean;
    isRecipient: boolean;
}

interface Props {
    members: Member[];
    size?: number;
}

export function ContributionRing({ members, size = 280 }: Props) {
    const n = members.length;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;
    const strokeWidth = size * 0.1;
    const circumference = 2 * Math.PI * r;
    const arcLength = circumference / n;
    const gap = 3;

    function arcColor(m: Member): string {
        if (m.isRecipient) return 'var(--gold)';
        if (m.contributed) return 'var(--terracotta)';
        if (m.late) return '#F59E0B';
        return 'var(--border-default)';
    }

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="block">
                {members.map((m, i) => {
                    const startAngle = (i / n) * 2 * Math.PI - Math.PI / 2;
                    const segLen = arcLength - gap;
                    const offset = circumference - segLen;

                    return (
                        <motion.circle
                            key={m.address}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={arcColor(m)}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${segLen} ${circumference - segLen}`}
                            strokeDashoffset={-((i / n) * circumference) + circumference / 4}
                            strokeLinecap="round"
                            className={m.isRecipient ? 'drop-shadow-[0_0_8px_rgba(212,160,23,0.8)]' : ''}
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 1,
                                stroke: arcColor(m),
                            }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                        />
                    );
                })}
            </svg>

            {/* Center count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-bold text-(--text-primary)">
                    {members.filter(m => m.contributed).length}/{n}
                </span>
                <span className="text-xs text-(--text-muted)">contributed</span>
            </div>

            {/* Tooltip dots around ring */}
            {members.map((m, i) => {
                const angle = (i / n) * 2 * Math.PI - Math.PI / 2 + Math.PI / n;
                const dotR = r;
                const dx = cx + dotR * Math.cos(angle);
                const dy = cy + dotR * Math.sin(angle);

                return (
                    <div
                        key={`dot-${m.address}`}
                        className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ left: dx, top: dy }}
                    >
                        <div className="h-2 w-2 rounded-full bg-transparent" />
                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-(--border-subtle) bg-(--bg-surface) px-2 py-1 text-xs text-(--text-secondary) opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                            {shortenAddress(m.address)}
                            {m.isRecipient && ' (recipient)'}
                            {m.late && !m.contributed && ' (late)'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
