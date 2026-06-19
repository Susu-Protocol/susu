#[test_only]
module susu_protocol::vault_tests {
    use sui::test_scenario::{Self as ts};
    use sui::coin;
    use sui::object;
    use susu_protocol::vault::{Self, YieldPosition};

    /// Stand-in coin type — vault.move is generic over whatever CoinType
    /// the yield position holds.
    public struct USDC has drop {}

    const OWNER: address = @0xA;

    #[test]
    fun test_deposit_and_withdraw_returns_at_least_principal() {
        let mut scenario = ts::begin(OWNER);
        let circle_id = object::id_from_address(@0xCAFE);
        {
            let coin = coin::mint_for_testing<USDC>(1_000_000_000, ts::ctx(&mut scenario));
            let principal = coin::value(&coin);
            let position = vault::deposit<USDC>(
                circle_id,
                coin,
                300, // 3% APY
                ts::ctx(&mut scenario),
            );
            assert!(vault::position_principal(&position) == principal, 0);
            let (returned_coin, _yield) = vault::withdraw<USDC>(position, ts::ctx(&mut scenario));
            // At least principal returned
            assert!(coin::value(&returned_coin) >= principal, 1);
            sui::transfer::public_transfer(returned_coin, OWNER);
        };
        ts::end(scenario);
    }

    #[test]
    fun test_accrue_yield_is_zero_at_deposit_time() {
        let mut scenario = ts::begin(OWNER);
        let circle_id = object::id_from_address(@0xCAFE);
        {
            let coin = coin::mint_for_testing<USDC>(1_000_000_000, ts::ctx(&mut scenario));
            let position = vault::deposit<USDC>(
                circle_id,
                coin,
                300,
                ts::ctx(&mut scenario),
            );
            let now = sui::tx_context::epoch_timestamp_ms(ts::ctx(&mut scenario));
            // No time elapsed → yield = 0
            let yield_val = vault::accrue_yield(&position, now);
            assert!(yield_val == 0, 0);
            let (c, _) = vault::withdraw<USDC>(position, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(c, OWNER);
        };
        ts::end(scenario);
    }
}
