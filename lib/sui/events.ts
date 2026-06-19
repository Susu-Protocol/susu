import { getSuiClient } from './client';
import { PACKAGE_ID } from '@/lib/constants';

export const EVENT_TYPES = {
    MEMBER_JOINED: `${PACKAGE_ID}::circle::MemberJoined`,
    CONTRIBUTION_RECEIVED: `${PACKAGE_ID}::circle::ContributionReceived`,
    CYCLE_ENDED: `${PACKAGE_ID}::circle::CycleEnded`,
    DISBURSEMENT_MADE: `${PACKAGE_ID}::circle::DisbursementMade`,
    MEMBER_EXITED: `${PACKAGE_ID}::circle::MemberExited`,
    YIELD_EARNED: `${PACKAGE_ID}::circle::YieldEarned`,
    CIRCLE_CREATED: `${PACKAGE_ID}::circle::CircleCreated`,
    CIRCLE_STARTED: `${PACKAGE_ID}::circle::CircleStarted`,
} as const;

export interface CircleEventHandlers {
    onMemberJoined?: (data: { circleId: string; member: string; seatNumber: number }) => void;
    onContributionReceived?: (data: {
        circleId: string;
        cycleIndex: number;
        member: string;
        amount: bigint;
        collected: bigint;
        target: bigint;
    }) => void;
    onCycleEnded?: (data: {
        circleId: string;
        cycleIndex: number;
        recipient: string;
        amount: bigint;
        yieldAmount: bigint;
    }) => void;
    onDisbursementMade?: (data: { circleId: string; recipient: string; amount: bigint }) => void;
    onMemberExited?: (data: { circleId: string; member: string; refund: bigint }) => void;
}

export function subscribeToCircleEvents(
    circleId: string,
    handlers: CircleEventHandlers,
): () => void {
    const client = getSuiClient();
    let active = true;
    let cursorDigest: string | null = null;

    const poll = async () => {
        if (!active) return;
        try {
            const result = await client.queryEvents({
                query: { MoveModule: { package: PACKAGE_ID, module: 'circle' } },
                cursor: cursorDigest ? { txDigest: cursorDigest, eventSeq: '0' } : undefined,
                limit: 20,
            });

            for (const ev of result.data) {
                const parsed = ev.parsedJson as Record<string, unknown>;
                if (parsed.circle_id !== circleId) continue;

                if (ev.type === EVENT_TYPES.MEMBER_JOINED && handlers.onMemberJoined) {
                    handlers.onMemberJoined({
                        circleId,
                        member: parsed.member as string,
                        seatNumber: Number(parsed.seat_number),
                    });
                }
                if (ev.type === EVENT_TYPES.CONTRIBUTION_RECEIVED && handlers.onContributionReceived) {
                    handlers.onContributionReceived({
                        circleId,
                        cycleIndex: Number(parsed.cycle_index),
                        member: parsed.member as string,
                        amount: BigInt((parsed.amount as string) ?? '0'),
                        collected: BigInt((parsed.collected as string) ?? '0'),
                        target: BigInt((parsed.target as string) ?? '0'),
                    });
                }
                if (ev.type === EVENT_TYPES.CYCLE_ENDED && handlers.onCycleEnded) {
                    handlers.onCycleEnded({
                        circleId,
                        cycleIndex: Number(parsed.cycle_index),
                        recipient: parsed.recipient as string,
                        amount: BigInt((parsed.amount as string) ?? '0'),
                        yieldAmount: BigInt((parsed.yield_amount as string) ?? '0'),
                    });
                }
                if (ev.type === EVENT_TYPES.DISBURSEMENT_MADE && handlers.onDisbursementMade) {
                    handlers.onDisbursementMade({
                        circleId,
                        recipient: parsed.recipient as string,
                        amount: BigInt((parsed.amount as string) ?? '0'),
                    });
                }
                if (ev.type === EVENT_TYPES.MEMBER_EXITED && handlers.onMemberExited) {
                    handlers.onMemberExited({
                        circleId,
                        member: parsed.member as string,
                        refund: BigInt((parsed.refund as string) ?? '0'),
                    });
                }
            }

            if (result.data.length > 0) {
                cursorDigest = result.data[result.data.length - 1].id.txDigest;
            }
        } catch {
            // silently continue polling
        }
        if (active) setTimeout(poll, 3000);
    };

    poll();
    return () => { active = false; };
}
