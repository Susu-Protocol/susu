import { getReputationProfile } from '@/lib/sui/read';
import { MembershipTokenCard } from '@/components/membership/MembershipToken';
import { ReputationBadges } from '@/components/membership/ReputationBadges';
import { AddressChip } from '@/components/wallet/AddressChip';
import { AddressAvatar } from '@/components/wallet/AddressAvatar';
import { ShareProfileButton } from '@/components/wallet/ShareProfileButton';
import { formatUSDC, explorerUrl } from '@/lib/utils';
import { TrendingUp, Award, Clock, CheckCircle, ExternalLink, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ address: string }> }

export default async function ProfilePage({ params }: Props) {
    const { address } = await params;

    const profile = await getReputationProfile(address).catch(() => ({
        address,
        membershipTokens: [],
        badges: [],
        totalCirclesCompleted: 0,
        totalContributedUSDC: 0n,
        onTimeContributionRate: 0,
        longestStreak: 0,
    }));

    const onTimePercent = Math.round(profile.onTimeContributionRate * 100);
    const totalCircles = profile.membershipTokens.length;
    const reputationScore = Math.min(
        100,
        profile.totalCirclesCompleted * 20 +
        onTimePercent * 0.5 +
        Math.min(30, profile.longestStreak * 3)
    );

    const creditTier = reputationScore >= 80 ? 'Gold' : reputationScore >= 50 ? 'Silver' : reputationScore >= 20 ? 'Bronze' : 'New';
    const tierColor = creditTier === 'Gold' ? 'text-(--gold-dim) bg-(--gold)/10' : creditTier === 'Silver' ? 'text-slate-600 bg-slate-100' : creditTier === 'Bronze' ? 'text-orange-700 bg-orange-100' : 'text-(--text-muted) bg-(--bg-warm)';

    return (
        <div className="space-y-6">
            {/* ── Profile header ───────────────────────────────────────────── */}
            <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) overflow-hidden">
                {/* Banner */}
                <div className="h-24 bg-linear-to-r from-(--terracotta)/20 via-(--gold)/15 to-(--terracotta)/10" />

                <div className="px-6 pb-6">
                    {/* Avatar + actions */}
                    <div className="flex items-end justify-between -mt-8 mb-4">
                        <AddressAvatar
                            address={address}
                            size={64}
                            rounded="2xl"
                            className="border-4 border-(--bg-surface) shadow-md"
                        />
                        <div className="flex items-center gap-2">
                            <ShareProfileButton address={address} />
                            <a
                                href={explorerUrl('address', address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-xl border border-(--border-default) px-3 py-2 text-xs text-(--text-muted) hover:bg-(--bg-warm) hover:text-(--text-primary) transition-colors"
                            >
                                <ExternalLink size={12} /> Explorer
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <AddressChip address={address} />
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 ${tierColor}`}>
                            <Star size={11} /> {creditTier} member
                        </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { icon: CheckCircle, label: 'Circles completed', value: profile.totalCirclesCompleted.toString(), color: 'text-(--terracotta)', bg: 'bg-(--terracotta)/8' },
                            { icon: TrendingUp, label: 'Total contributed', value: formatUSDC(profile.totalContributedUSDC), color: 'text-(--gold-dim)', bg: 'bg-(--gold)/8' },
                            { icon: Clock, label: 'On-time rate', value: totalCircles === 0 ? '—' : `${onTimePercent}%`, color: 'text-green-600', bg: 'bg-green-50' },
                            { icon: Award, label: 'Longest streak', value: `${profile.longestStreak} cycles`, color: 'text-(--sui-blue)', bg: 'bg-blue-50' },
                        ].map(s => (
                            <div key={s.label} className="rounded-xl border border-(--border-subtle) p-3.5 space-y-2">
                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${s.bg}`}>
                                    <s.icon size={14} className={s.color} />
                                </div>
                                <p className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-(--text-muted)">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Reputation score */}
                    {totalCircles > 0 && (
                        <div className="mt-4 rounded-xl border border-(--border-subtle) bg-(--bg-warm) p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-(--text-primary)">Reputation score</p>
                                <span className="font-mono font-bold text-(--terracotta)">{Math.round(reputationScore)}/100</span>
                            </div>
                            <div className="h-2 rounded-full bg-(--border-subtle) overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-(--terracotta) to-(--gold) transition-all"
                                    style={{ width: `${reputationScore}%` }}
                                />
                            </div>
                            <p className="text-xs text-(--text-muted) mt-2">
                                Based on circles completed, on-time rate, and contribution streak — all verifiable on-chain.
                            </p>
                        </div>
                    )}

                    {/* Credit narrative */}
                    {profile.totalCirclesCompleted > 0 && (
                        <div className="mt-4 rounded-xl bg-(--terracotta)/5 border border-(--terracotta)/15 p-4">
                            <p className="text-sm text-(--text-secondary) leading-relaxed">
                                This address has completed{' '}
                                <strong className="text-(--text-primary)">{profile.totalCirclesCompleted} savings circle{profile.totalCirclesCompleted !== 1 ? 's' : ''}</strong>,
                                contributed{' '}
                                <strong className="text-(--text-primary)">{formatUSDC(profile.totalContributedUSDC)}</strong> on-chain, and maintained a{' '}
                                <strong className="text-(--text-primary)">{onTimePercent}% on-time rate</strong> —
                                a stronger credit signal than most formal credit scores, and verifiable by anyone.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Membership tokens ────────────────────────────────────────── */}
            {profile.membershipTokens.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xl font-semibold text-(--text-primary)">
                            Circle memberships
                        </h2>
                        <span className="text-xs text-(--text-muted)">
                            {profile.membershipTokens.length} token{profile.membershipTokens.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {profile.membershipTokens.map(token => (
                            <MembershipTokenCard key={token.id} token={token} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Contribution badges ──────────────────────────────────────── */}
            {profile.badges.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="font-display text-xl font-semibold text-(--text-primary)">
                                Contribution badges
                            </h2>
                            <p className="text-xs text-(--text-muted) mt-0.5">
                                Each badge is an on-chain NFT proving one completed contribution
                            </p>
                        </div>
                        <span className="font-mono text-lg font-bold text-(--terracotta)">
                            {profile.badges.length}
                        </span>
                    </div>
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-5">
                        <ReputationBadges badges={profile.badges} maxShow={32} />
                    </div>
                </section>
            )}

            {/* ── Empty state ──────────────────────────────────────────────── */}
            {profile.membershipTokens.length === 0 && profile.badges.length === 0 && (
                <div className="rounded-3xl border-2 border-dashed border-(--border-default) p-16 text-center">
                    <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-(--terracotta)/8 flex items-center justify-center">
                        <Star size={24} className="text-(--terracotta)" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-(--text-primary)">
                        No savings history yet
                    </h3>
                    <p className="text-sm text-(--text-muted) mt-2 max-w-sm mx-auto">
                        Join a circle to start building an on-chain financial reputation that lenders and protocols can trust.
                    </p>
                </div>
            )}
        </div>
    );
}
