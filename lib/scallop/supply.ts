import { Transaction, type TransactionObjectArgument } from '@mysten/sui/transactions';
import { PACKAGE_ID, DEMO_APY_BPS } from '@/lib/constants';

/// Build PTB calls to deposit into the vault (which wraps Scallop on mainnet).
export function addDepositToVaultCalls(
    tx: Transaction,
    circleIdArg: TransactionObjectArgument | string,
    coinArg: TransactionObjectArgument,
): TransactionObjectArgument {
    const result = tx.moveCall({
        target: `${PACKAGE_ID}::vault::deposit`,
        typeArguments: [`${PACKAGE_ID}::circle::USDC`],
        arguments: [
            typeof circleIdArg === 'string' ? tx.pure.id(circleIdArg) : circleIdArg,
            coinArg,
            tx.pure.u64(BigInt(DEMO_APY_BPS)),
        ],
    });
    // moveCall returns a TransactionResult which can be used as object argument
    return result as unknown as TransactionObjectArgument;
}

/// Build PTB calls to withdraw from vault.
export function addWithdrawFromVaultCalls(
    tx: Transaction,
    positionArg: TransactionObjectArgument | string,
): [TransactionObjectArgument, TransactionObjectArgument] {
    const result = tx.moveCall({
        target: `${PACKAGE_ID}::vault::withdraw`,
        typeArguments: [`${PACKAGE_ID}::circle::USDC`],
        arguments: [
            typeof positionArg === 'string' ? tx.object(positionArg) : positionArg,
        ],
    }) as unknown as [TransactionObjectArgument, TransactionObjectArgument];
    return result;
}

export async function estimateYield(
    principalUsdc: bigint,
    elapsedMs: number,
): Promise<bigint> {
    const msPerYear = 365 * 24 * 3600 * 1000;
    return (principalUsdc * BigInt(DEMO_APY_BPS) * BigInt(elapsedMs)) /
        (10_000n * BigInt(msPerYear));
}
