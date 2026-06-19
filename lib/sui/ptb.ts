import { Transaction } from '@mysten/sui/transactions';
import {
    PACKAGE_ID,
    GAS_BUDGET,
    DEMO_APY_BPS,
    YIELD_MODE,
    USDC_TYPE,
} from '@/lib/constants';
import type {
    CreateCircleParams,
    ContributeParams,
    EndCycleParams,
} from '@/types/circle';

export function buildCreateCirclePtb(params: CreateCircleParams): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);

    tx.moveCall({
        target: `${PACKAGE_ID}::circle::create_circle`,
        typeArguments: [USDC_TYPE],
        arguments: [
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(params.name))),
            tx.pure.u64(params.contributionAmount),
            tx.pure.u64(params.cycleDurationMs),
            tx.pure.u8(params.maxMembers),
            tx.pure.u8(params.rotationType),
            tx.pure.u64(params.penaltyRateBps),
            tx.pure.bool(params.allowYield),
            tx.pure.u8(params.yieldMode),
            tx.pure.bool(params.entryDepositRequired),
            tx.pure.u64(params.entryDepositAmount),
        ],
    });

    return tx;
}

export function buildJoinCirclePtb(params: {
    circleId: string;
    signerAddress: string;
}): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(params.signerAddress);

    tx.moveCall({
        target: `${PACKAGE_ID}::circle::join_circle`,
        typeArguments: [USDC_TYPE],
        arguments: [tx.object(params.circleId)],
    });

    return tx;
}

export function buildStartCirclePtb(params: {
    circleId: string;
    signerAddress: string;
}): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(params.signerAddress);

    tx.moveCall({
        target: `${PACKAGE_ID}::circle::start_circle`,
        typeArguments: [USDC_TYPE],
        arguments: [tx.object(params.circleId)],
    });

    return tx;
}

export function buildContributePtb(params: ContributeParams): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(params.signerAddress);

    // Split exact contribution amount from member's USDC coin
    const [payment] = tx.splitCoins(tx.object(params.usdcCoinId), [
        params.contributionAmount,
    ]);

    tx.moveCall({
        target: `${PACKAGE_ID}::circle::contribute`,
        typeArguments: [USDC_TYPE],
        arguments: [
            tx.object(params.circleId),
            tx.object(params.cycleId),
            payment,
        ],
    });

    return tx;
}

export function buildPayLatePtb(params: {
    circleId: string;
    cycleId: string;
    totalAmount: bigint;
    usdcCoinId: string;
    signerAddress: string;
}): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(params.signerAddress);

    const [payment] = tx.splitCoins(tx.object(params.usdcCoinId), [params.totalAmount]);

    tx.moveCall({
        target: `${PACKAGE_ID}::circle::pay_late_with_penalty`,
        typeArguments: [USDC_TYPE],
        arguments: [
            tx.object(params.circleId),
            tx.object(params.cycleId),
            payment,
        ],
    });

    return tx;
}

export function buildEndCyclePtb(params: EndCycleParams): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(params.signerAddress);

    // End cycle and disburse
    tx.moveCall({
        target: `${PACKAGE_ID}::circle::end_cycle_and_disburse`,
        typeArguments: [USDC_TYPE],
        arguments: [
            tx.object(params.circleId),
            tx.object(params.cycleId),
        ],
    });

    // Mint ContributionBadge for every on-time member
    for (const memberAddress of params.onTimeMembers) {
        tx.moveCall({
            target: `${PACKAGE_ID}::membership::mint_contribution_badge`,
            arguments: [
                tx.pure.id(params.circleId),
                tx.pure.u64(BigInt(params.isLastCycle ? params.membershipTokenIds.length : 0)),
                tx.pure.u64(0n),
                tx.pure.bool(true),
                tx.pure.address(memberAddress),
            ],
        });
    }

    return tx;
}

export function buildEmergencyExitPtb(params: {
    circleId: string;
    signerAddress: string;
}): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(params.signerAddress);

    tx.moveCall({
        target: `${PACKAGE_ID}::circle::emergency_exit`,
        typeArguments: [USDC_TYPE],
        arguments: [tx.object(params.circleId)],
    });

    return tx;
}

export function buildDepositToVaultPtb(params: {
    circleId: string;
    usdcCoinId: string;
    amount: bigint;
    signerAddress: string;
}): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(params.signerAddress);

    const [coin] = tx.splitCoins(tx.object(params.usdcCoinId), [params.amount]);

    tx.moveCall({
        target: `${PACKAGE_ID}::vault::deposit`,
        typeArguments: [USDC_TYPE],
        arguments: [
            tx.pure.id(params.circleId),
            coin,
            tx.pure.u64(BigInt(DEMO_APY_BPS)),
        ],
    });

    return tx;
}

export function buildRaiseDisputePtb(params: {
    circleId: string;
    reason: string;
    signerAddress: string;
}): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(params.signerAddress);

    tx.moveCall({
        target: `${PACKAGE_ID}::dispute::raise_dispute`,
        arguments: [
            tx.pure.id(params.circleId),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(params.reason))),
        ],
    });

    return tx;
}
