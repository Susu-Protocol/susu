export type CircleStatus = 0 | 1 | 2 | 3; // FORMING | ACTIVE | COMPLETE | PAUSED
export type RotationType = 0 | 1; // FIXED | RANDOM
export type YieldMode = 0 | 1 | 2; // RECIPIENT_BONUS | PRO_RATA | RESERVE

export interface CircleConfig {
    contributionAmount: bigint;
    cycleDurationMs: bigint;
    maxMembers: number;
    rotationType: RotationType;
    penaltyRateBps: bigint;
    allowYield: boolean;
    yieldMode: YieldMode;
    entryDepositRequired: boolean;
    entryDepositAmount: bigint;
}

export interface ContributionRecord {
    amount: bigint;
    timestampMs: bigint;
    onTime: boolean;
    penaltyPaid: bigint;
}

export interface CycleData {
    id: string;
    circleId: string;
    cycleIndex: number;
    recipient: string;
    targetAmount: bigint;
    collected: bigint;
    yieldEarned: bigint;
    contributions: Record<string, ContributionRecord>;
    startMs: bigint;
    endMs: bigint;
    disbursed: boolean;
}

export interface CircleData {
    id: string;
    config: CircleConfig;
    organizer: string;
    name: string;
    members: string[];
    rotationQueue: string[];
    currentCycle: number;
    cycleStartMs: bigint;
    poolBalance: bigint;
    accumulatedYield: bigint;
    reserveBalance: bigint;
    status: CircleStatus;
    totalCycles: number;
    currentCycleData?: CycleData;
}

export interface CreateCircleParams {
    name: string;
    contributionAmount: bigint;
    cycleDurationMs: bigint;
    maxMembers: number;
    rotationType: RotationType;
    penaltyRateBps: bigint;
    allowYield: boolean;
    yieldMode: YieldMode;
    entryDepositRequired: boolean;
    entryDepositAmount: bigint;
    usdcCoinId?: string;
    signerAddress: string;
}

export interface ContributeParams {
    circleId: string;
    cycleId: string;
    contributionAmount: bigint;
    allowYield: boolean;
    isLastContribution: boolean;
    usdcCoinId: string;
    scallopPoolId?: string;
    signerAddress: string;
}

export interface EndCycleParams {
    circleId: string;
    cycleId: string;
    yieldPositionId?: string;
    scallopPoolId?: string;
    onTimeMembers: string[];
    membershipTokenIds: string[];
    isLastCycle: boolean;
    signerAddress: string;
}

export interface CircleEvent {
    type: string;
    timestamp: number;
    data: Record<string, unknown>;
}
