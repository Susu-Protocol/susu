import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { formatUSDC, explorerUrl } from '@/lib/utils';
import type { MembershipTokenData } from '@/types/membership';

interface Props {
    token: MembershipTokenData;
}

export function MembershipTokenCard({ token }: Props) {
    const onTimeRate = token.cyclesCompleted > 0
        ? Math.round((token.cyclesOnTime / token.cyclesCompleted) * 100)
        : 100;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-(--border-default) bg-linear-to-br from-(--terracotta) to-(--terracotta-dim) p-5 text-white">
            {/* Kente geometric pattern overlay */}
            <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 11px),
                        repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 11px)
                    `,
                }}
            />

            <div className="relative">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Susu Protocol</p>
                        <h3 className="font-display text-xl font-bold mt-0.5">{token.circleName}</h3>
                    </div>
                    <div className="rounded-full bg-white/20 px-2 py-1 text-xs font-medium">
                        {token.locked ? 'Active' : 'Completed'}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-white/60">Total contributed</p>
                        <p className="font-mono text-lg font-bold">
                            {formatUSDC(token.totalContributed)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-white/60">On-time rate</p>
                        <p className="font-mono text-lg font-bold">{onTimeRate}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/60">Cycles completed</p>
                        <p className="font-mono text-lg font-bold">{token.cyclesCompleted}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/60">On-time streak</p>
                        <p className="font-mono text-lg font-bold">{token.cyclesOnTime}</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-(--gold) animate-pulse" />
                        <span className="text-xs text-white/70">Verified on Sui</span>
                    </div>
                    <a
                        href={explorerUrl('object', token.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
                    >
                        View on Explorer <ExternalLink size={10} />
                    </a>
                </div>
            </div>
        </div>
    );
}
