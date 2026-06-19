import { testnetCoins, testnetPools, mainnetCoins, mainnetPools, testnetPackageIds, mainnetPackageIds } from '@mysten/deepbook-v3';

export type DBEnv = 'testnet' | 'mainnet';

const ENV = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet') as DBEnv;

// Pool and coin config per environment
export const DB_CONFIG = {
    testnet: {
        packageId:  testnetPackageIds.DEEPBOOK_PACKAGE_ID,
        poolKey:    'SUI_DBUSDC',           // base=SUI, quote=DBUSDC
        poolAddress: testnetPools.SUI_DBUSDC?.address ?? '',
        suiType:    testnetCoins.SUI.type,
        usdcType:   testnetCoins.DBUSDC.type,
        usdcScalar: testnetCoins.DBUSDC.scalar,  // 1e6
        suiScalar:  testnetCoins.SUI.scalar,      // 1e9
        deepType:   testnetCoins.DEEP.type,
        deepAddress: testnetCoins.DEEP.address,
    },
    mainnet: {
        packageId:  mainnetPackageIds.DEEPBOOK_PACKAGE_ID,
        poolKey:    'SUI_USDC',
        poolAddress: mainnetPools.SUI_USDC?.address ?? '',
        suiType:    mainnetCoins.SUI.type,
        usdcType:   mainnetCoins.USDC.type,
        usdcScalar: mainnetCoins.USDC.scalar,
        suiScalar:  mainnetCoins.SUI.scalar,
        deepType:   mainnetCoins.DEEP.type,
        deepAddress: mainnetCoins.DEEP.address,
    },
} as const;

export function getDBConfig() {
    return DB_CONFIG[ENV] ?? DB_CONFIG.testnet;
}
