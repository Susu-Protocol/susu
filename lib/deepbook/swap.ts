import { DeepBookClient } from '@mysten/deepbook-v3';
import { Transaction } from '@mysten/sui/transactions';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { getDBConfig } from './config';

type DBEnv = 'testnet' | 'mainnet';
const ENV = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet') as DBEnv;

function makeSuiClient() {
    return new SuiJsonRpcClient({
        url:     getJsonRpcFullnodeUrl(ENV),
        network: ENV,
    });
}

function makeDBClient(signerAddress: string) {
    const cfg = getDBConfig();
    return new DeepBookClient({
        address: signerAddress,
        client:  makeSuiClient() as any,
        network: ENV,
    });
}

/**
 * Returns a price quote: how many USDC units you get for `suiMist` of SUI.
 * Uses DeepBook's on-chain simulator — no order placement.
 */
export async function getSwapQuote(suiMist: bigint): Promise<{
    suiIn:      bigint;  // SUI in mist
    usdcOut:    bigint;  // USDC in base units (6 dec)
    priceUsdc:  number;  // price per SUI in USDC
}> {
    const cfg    = getDBConfig();
    const db     = makeDBClient('0x0000000000000000000000000000000000000000000000000000000000000000');
    const suiNum = Number(suiMist) / cfg.suiScalar;

    const result = await db.getQuoteQuantityOut(cfg.poolKey, suiNum);
    const usdcOut = BigInt(Math.floor((result.quoteOut ?? 0) * cfg.usdcScalar));
    const priceUsdc = suiNum > 0 ? Number(usdcOut) / cfg.usdcScalar / suiNum : 0;

    return { suiIn: suiMist, usdcOut, priceUsdc };
}

/**
 * Returns the mid-price (USDC per SUI) from the DeepBook orderbook.
 */
export async function getSuiMidPrice(): Promise<number> {
    const cfg = getDBConfig();
    const db  = makeDBClient('0x0000000000000000000000000000000000000000000000000000000000000000');
    try {
        return await db.midPrice(cfg.poolKey);
    } catch {
        return 3.5; // fallback for when pool has no liquidity
    }
}

/**
 * How many SUI mist are needed to receive at least `usdcAmount` base units.
 * Adds 1% buffer over the quoted amount.
 */
export async function suiNeededForUsdc(usdcAmount: bigint): Promise<bigint> {
    const cfg        = getDBConfig();
    const db         = makeDBClient('0x0000000000000000000000000000000000000000000000000000000000000000');
    const usdcNum    = Number(usdcAmount) / cfg.usdcScalar;

    const result = await db.getBaseQuantityIn(cfg.poolKey, usdcNum, false);
    const base   = result.baseIn ?? 0;
    const withBuffer = base * 1.01;  // 1% slippage buffer
    return BigInt(Math.ceil(withBuffer * cfg.suiScalar));
}

/**
 * Builds a PTB that swaps SUI → USDC via DeepBook v3.
 * Returns raw txBytes (Uint8Array) to be signed by the user.
 *
 * The returned quoteCoin (USDC) is transferred back to the signer.
 * In a real atomic flow it would be piped directly into circle::contribute.
 */
export async function buildSwapPtb(params: {
    signerAddress: string;
    suiCoinId:     string;   // object ID of the SUI coin to swap
    suiAmount:     bigint;   // exact mist to swap
    minUsdcOut:    bigint;   // slippage floor
}): Promise<Uint8Array> {
    const { signerAddress, suiCoinId, suiAmount, minUsdcOut } = params;
    const cfg = getDBConfig();
    const db  = makeDBClient(signerAddress);

    const tx = new Transaction();
    tx.setSender(signerAddress);
    tx.setGasBudget(100_000_000n);

    // Split exactly the SUI amount needed from the coin
    const [suiSplit] = tx.splitCoins(tx.object(suiCoinId), [suiAmount]);

    // swapExactBaseForQuote returns [remainderBase, quoteOut, remainderDeep]
    const [_remainderSui, quoteCoin] = db.deepBook.swapExactBaseForQuote({
        poolKey:   cfg.poolKey,
        amount:    suiAmount,
        deepAmount: 0n,
        minOut:    minUsdcOut,
        baseCoin:  suiSplit,
    })(tx) as [any, any, any];

    // Transfer the USDC back to the signer's wallet
    tx.transferObjects([quoteCoin], signerAddress);

    const client = makeSuiClient();
    return tx.build({ client: client as any, onlyTransactionKind: false });
}
