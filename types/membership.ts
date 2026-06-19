export interface MembershipTokenData {
    id: string;
    owner: string;
    circleId: string;
    circleName: string;
    joinTimestamp: bigint;
    contributionAmount: bigint;
    cyclesCompleted: number;
    cyclesOnTime: number;
    totalContributed: bigint;
    receivedDisbursement: boolean;
    disbursementCycle: number | null;
    locked: boolean;
}

export interface ContributionBadgeData {
    id: string;
    owner: string;
    circleId: string;
    cycleIndex: number;
    amount: bigint;
    onTime: boolean;
    timestamp: bigint;
}

export interface ReputationProfile {
    address: string;
    membershipTokens: MembershipTokenData[];
    badges: ContributionBadgeData[];
    totalCirclesCompleted: number;
    totalContributedUSDC: bigint;
    onTimeContributionRate: number;
    longestStreak: number;
}
