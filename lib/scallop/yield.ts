import { getSuiClient } from '@/lib/sui/client';
import { DEMO_APY_BPS } from '@/lib/constants';
import type { YieldSummary } from '@/types/scallop';

export async function readAccruedYield(positionId: string): Promise<YieldSummary> {
    const client = getSuiClient();
    try {
        const obj = await client.getObject({ id: positionId, options: { showContent: true } });
        const content = obj.data?.content;
        if (!content || content.dataType !== 'moveObject') {
            return { principal: 0n, yield: 0n, apy: DEMO_APY_BPS / 100, elapsedMs: 0n };
        }

        const f = content.fields as Record<string, unknown>;
        const principal = BigInt((f.principal as string) ?? '0');
        const depositedAt = BigInt((f.deposit_timestamp_ms as string) ?? '0');
        const now = BigInt(Date.now());
        const elapsed = now > depositedAt ? now - depositedAt : 0n;

        const msPerYear = 31_536_000_000n;
        const yieldAmount = (principal * BigInt(DEMO_APY_BPS) * elapsed) / (10_000n * msPerYear);

        return {
            principal,
            yield: yieldAmount,
            apy: DEMO_APY_BPS / 100,
            elapsedMs: elapsed,
        };
    } catch {
        return { principal: 0n, yield: 0n, apy: DEMO_APY_BPS / 100, elapsedMs: 0n };
    }
}

export function usdcToDisplay(amount: bigint, decimals = 6): string {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const frac = (amount % divisor).toString().padStart(decimals, '0').slice(0, 2);
    return `${whole}.${frac}`;
}
