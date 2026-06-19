import { getSuiClient } from './client';
import { PACKAGE_ID } from '@/lib/constants';
import type { CircleData } from '@/types/circle';
import type { MembershipTokenData, ContributionBadgeData, ReputationProfile } from '@/types/membership';

function parseCircleFields(fields: Record<string, unknown>, id: string): CircleData {
    // Nested Move structs come back wrapped as { type, fields }, not as a flat object.
    const configWrapper = (fields.config ?? {}) as { fields?: Record<string, unknown> };
    const config = configWrapper.fields ?? {};
    return {
        id,
        config: {
            contributionAmount: BigInt((config.contribution_amount as string) ?? '0'),
            cycleDurationMs: BigInt((config.cycle_duration_ms as string) ?? '0'),
            maxMembers: Number(config.max_members ?? 0),
            rotationType: Number(config.rotation_type ?? 0) as 0 | 1,
            penaltyRateBps: BigInt((config.penalty_rate_bps as string) ?? '0'),
            allowYield: Boolean(config.allow_yield),
            yieldMode: Number(config.yield_mode ?? 0) as 0 | 1 | 2,
            entryDepositRequired: Boolean(config.entry_deposit_required),
            entryDepositAmount: BigInt((config.entry_deposit_amount as string) ?? '0'),
        },
        organizer: (fields.organizer as string) ?? '',
        name: (fields.name as string) ?? '',
        members: (fields.members as string[]) ?? [],
        rotationQueue: (fields.rotation_queue as string[]) ?? [],
        currentCycle: Number(fields.current_cycle ?? 0),
        cycleStartMs: BigInt((fields.cycle_start_ms as string) ?? '0'),
        poolBalance: BigInt((fields.pool_balance as string) ?? '0'),
        accumulatedYield: BigInt((fields.accumulated_yield as string) ?? '0'),
        reserveBalance: BigInt((fields.reserve_balance as string) ?? '0'),
        status: Number(fields.status ?? 0) as 0 | 1 | 2 | 3,
        totalCycles: Number(fields.total_cycles ?? 0),
    };
}

export async function getCircle(id: string): Promise<CircleData | null> {
    const client = getSuiClient();
    try {
        const obj = await client.getObject({ id, options: { showContent: true } });
        const content = obj.data?.content;
        if (!content || content.dataType !== 'moveObject') return null;
        const fields = content.fields as Record<string, unknown>;
        return parseCircleFields(fields, id);
    } catch {
        return null;
    }
}

export async function getCirclesByMember(address: string): Promise<CircleData[]> {
    const client = getSuiClient();
    try {
        const joinEvents = await client.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::circle::MemberJoined` },
            limit: 100,
        });
        const createEvents = await client.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::circle::CircleCreated` },
            limit: 50,
        });

        const circleIds = new Set<string>();
        for (const ev of joinEvents.data) {
            const parsed = ev.parsedJson as Record<string, unknown>;
            if (parsed?.member === address) circleIds.add(parsed.circle_id as string);
        }
        for (const ev of createEvents.data) {
            const parsed = ev.parsedJson as Record<string, unknown>;
            if (parsed?.organizer === address) circleIds.add(parsed.circle_id as string);
        }

        const circles: CircleData[] = [];
        for (const id of circleIds) {
            const circle = await getCircle(id);
            if (circle) circles.push(circle);
        }
        return circles;
    } catch {
        return [];
    }
}

export async function getAllOpenCircles(): Promise<CircleData[]> {
    const client = getSuiClient();
    try {
        const events = await client.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::circle::CircleCreated` },
            limit: 50,
        });
        const circles: CircleData[] = [];
        for (const ev of events.data) {
            const parsed = ev.parsedJson as Record<string, unknown>;
            const circle = await getCircle(parsed.circle_id as string);
            if (circle && circle.status === 0) circles.push(circle);
        }
        return circles;
    } catch {
        return [];
    }
}

export async function getMembershipTokens(address: string): Promise<MembershipTokenData[]> {
    const client = getSuiClient();
    try {
        const objects = await client.getOwnedObjects({
            owner: address,
            filter: { StructType: `${PACKAGE_ID}::membership::MembershipToken` },
            options: { showContent: true },
        });

        return objects.data
            .filter(o => o.data?.content?.dataType === 'moveObject')
            .map(o => {
                const content = o.data!.content as { fields: Record<string, unknown> };
                const f = content.fields;
                return {
                    id: o.data!.objectId,
                    owner: f.owner as string,
                    circleId: f.circle_id as string,
                    circleName: f.circle_name as string,
                    joinTimestamp: BigInt((f.join_timestamp as string) ?? '0'),
                    contributionAmount: BigInt((f.contribution_amount as string) ?? '0'),
                    cyclesCompleted: Number(f.cycles_completed ?? 0),
                    cyclesOnTime: Number(f.cycles_on_time ?? 0),
                    totalContributed: BigInt((f.total_contributed as string) ?? '0'),
                    receivedDisbursement: Boolean(f.received_disbursement),
                    disbursementCycle: f.disbursement_cycle != null ? Number(f.disbursement_cycle) : null,
                    locked: Boolean(f.locked),
                };
            });
    } catch {
        return [];
    }
}

export async function getContributionBadges(address: string): Promise<ContributionBadgeData[]> {
    const client = getSuiClient();
    try {
        const objects = await client.getOwnedObjects({
            owner: address,
            filter: { StructType: `${PACKAGE_ID}::membership::ContributionBadge` },
            options: { showContent: true },
        });

        return objects.data
            .filter(o => o.data?.content?.dataType === 'moveObject')
            .map(o => {
                const content = o.data!.content as { fields: Record<string, unknown> };
                const f = content.fields;
                return {
                    id: o.data!.objectId,
                    owner: f.owner as string,
                    circleId: f.circle_id as string,
                    cycleIndex: Number(f.cycle_index ?? 0),
                    amount: BigInt((f.amount as string) ?? '0'),
                    onTime: Boolean(f.on_time),
                    timestamp: BigInt((f.timestamp as string) ?? '0'),
                };
            });
    } catch {
        return [];
    }
}

export async function getReputationProfile(address: string): Promise<ReputationProfile> {
    const [tokens, badges] = await Promise.all([
        getMembershipTokens(address),
        getContributionBadges(address),
    ]);

    const completedTokens = tokens.filter(t => !t.locked);
    const totalContributed = tokens.reduce((sum, t) => sum + t.totalContributed, 0n);
    const totalContributions = tokens.reduce((sum, t) => sum + t.cyclesCompleted, 0);
    const onTimeContributions = tokens.reduce((sum, t) => sum + t.cyclesOnTime, 0);
    const onTimeRate = totalContributions > 0 ? onTimeContributions / totalContributions : 0;

    let longestStreak = 0;
    let currentStreak = 0;
    const sortedBadges = [...badges].sort((a, b) => Number(a.timestamp - b.timestamp));
    for (const badge of sortedBadges) {
        if (badge.onTime) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    return {
        address,
        membershipTokens: tokens,
        badges,
        totalCirclesCompleted: completedTokens.length,
        totalContributedUSDC: totalContributed,
        onTimeContributionRate: onTimeRate,
        longestStreak,
    };
}
