// Scallop SDK wrapper — wraps the scallop-io SDK for supply/withdraw interactions.
// On testnet, we use a simulated yield position from our vault.move contract.
// The interface here matches what a production Scallop integration would expose.

export interface ScallopClientConfig {
    network: 'testnet' | 'mainnet';
    addressId?: string;
}

let _initialized = false;

export function getScallopConfig(): ScallopClientConfig {
    return {
        network: (process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet') as 'testnet' | 'mainnet',
        addressId: process.env.SCALLOP_SDK_ADDRESS_ID ?? 'testnet',
    };
}

export async function isScallopAvailable(): Promise<boolean> {
    try {
        const poolId = process.env.NEXT_PUBLIC_SCALLOP_USDC_POOL_ID;
        return Boolean(poolId && poolId !== '0x0');
    } catch {
        return false;
    }
}

// Demo APY for testnet display (3% APY on USDC)
export const DEMO_SCALLOP_APY = 0.03;
export const DEMO_SCALLOP_APY_BPS = 300;
