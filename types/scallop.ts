export interface ScallopPosition {
    id: string;
    circleId: string;
    principal: bigint;
    depositTimestampMs: bigint;
    currentApyBps: number;
    accruedYield: bigint;
}

export interface ScallopPoolInfo {
    poolId: string;
    coinType: string;
    apyBps: number;
    totalDeposited: bigint;
    utilization: number;
}

export interface YieldSummary {
    principal: bigint;
    yield: bigint;
    apy: number;
    elapsedMs: bigint;
}
