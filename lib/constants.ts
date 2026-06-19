export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet';

export const PACKAGE_ID =
    process.env.NEXT_PUBLIC_PACKAGE_ID ??
    '0x0000000000000000000000000000000000000000000000000000000000000000';

export const USDC_TYPE =
    process.env.NEXT_PUBLIC_USDC_TYPE ??
    '0x0000000000000000000000000000000000000000000000000000000000000002::coin::COIN';

export const SCALLOP_PACKAGE_ID =
    process.env.NEXT_PUBLIC_SCALLOP_PACKAGE_ID ?? '0x0';

export const SCALLOP_USDC_POOL_ID =
    process.env.NEXT_PUBLIC_SCALLOP_USDC_POOL_ID ?? '0x0';


export const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://susuprotocol.vercel.app';

export const SUI_FULLNODE_URL =
    SUI_NETWORK === 'mainnet'
        ? 'https://fullnode.mainnet.sui.io:443'
        : 'https://fullnode.testnet.sui.io:443';

// Circle status constants (mirror Move contract)
export const CIRCLE_STATUS = {
    FORMING: 0,
    ACTIVE: 1,
    COMPLETE: 2,
    PAUSED: 3,
} as const;

// Rotation types
export const ROTATION_TYPE = {
    FIXED: 0,
    RANDOM: 1,
} as const;

// Yield distribution modes
export const YIELD_MODE = {
    RECIPIENT_BONUS: 0,
    PRO_RATA: 1,
    RESERVE: 2,
} as const;

// Simulated APY for testnet demo (300 bps = 3%)
export const DEMO_APY_BPS = 300;

// Gas budget for transactions
export const GAS_BUDGET = 200_000_000;
