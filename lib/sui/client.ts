import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { SUI_NETWORK, SUI_FULLNODE_URL } from '@/lib/constants';

type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

let _client: SuiJsonRpcClient | null = null;

export function getSuiClient(): SuiJsonRpcClient {
    if (_client) return _client;
    const validNetworks: Network[] = ['mainnet', 'testnet', 'devnet', 'localnet'];
    const isValid = validNetworks.includes(SUI_NETWORK as Network);

    const url = isValid
        ? getJsonRpcFullnodeUrl(SUI_NETWORK as Network)
        : SUI_FULLNODE_URL;

    const network: Network = isValid ? (SUI_NETWORK as Network) : 'testnet';

    _client = new SuiJsonRpcClient({ url, network });
    return _client;
}

export async function getCurrentEpoch(): Promise<number> {
    const client = getSuiClient();
    const state = await client.getLatestSuiSystemState();
    return Number(state.epoch);
}

export async function getUsdcCoins(address: string): Promise<Array<{ id: string; balance: bigint }>> {
    const client = getSuiClient();
    const coinType = process.env.NEXT_PUBLIC_USDC_TYPE ?? '';
    if (!coinType) return [];
    const data = await client.getCoins({ owner: address, coinType });
    return (data.data ?? []).map((c: { coinObjectId: string; balance: string }) => ({
        id: c.coinObjectId,
        balance: BigInt(c.balance),
    }));
}

export async function getSuiCoins(address: string): Promise<Array<{ id: string; balance: bigint }>> {
    const client = getSuiClient();
    const data = await client.getCoins({ owner: address, coinType: '0x2::sui::SUI' });
    return (data.data ?? []).map((c: { coinObjectId: string; balance: string }) => ({
        id: c.coinObjectId,
        balance: BigInt(c.balance),
    }));
}

export async function getSuiBalance(address: string): Promise<bigint> {
    const client = getSuiClient();
    const result = await client.getBalance({ owner: address });
    return BigInt(result.totalBalance);
}

export async function waitForTransaction(digest: string) {
    const client = getSuiClient();
    return client.waitForTransaction({ digest, options: { showEffects: true } });
}

export async function executeTransaction(txBytes: Uint8Array, signature: string) {
    const client = getSuiClient();
    return client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: [signature],
        options: { showEffects: true, showEvents: true },
    });
}
