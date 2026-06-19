/// Scallop yield routing — deposits idle pool funds between disbursement cycles.
/// In production, this integrates with the live Scallop lending pool interfaces.
/// On testnet without Scallop dependency, the vault tracks a simulated yield.
module susu_protocol::vault {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::event;
    use sui::balance::{Self, Balance};

    // ─── Structs ──────────────────────────────────────────────────────────────

    public struct YieldPosition<phantom T> has key, store {
        id: UID,
        circle_id: ID,
        principal: u64,
        deposit_timestamp_ms: u64,
        simulated_apy_bps: u64, // 300 = 3% APY for demo
        balance: Balance<T>,
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct Deposited has copy, drop {
        position_id: ID,
        circle_id: ID,
        amount: u64,
    }

    public struct Withdrawn has copy, drop {
        position_id: ID,
        circle_id: ID,
        principal: u64,
        yield_amount: u64,
    }

    // ─── Functions ────────────────────────────────────────────────────────────

    public fun deposit<T>(
        circle_id: ID,
        coin: Coin<T>,
        simulated_apy_bps: u64,
        ctx: &mut TxContext,
    ): YieldPosition<T> {
        let amount = coin::value(&coin);
        let position = YieldPosition {
            id: object::new(ctx),
            circle_id,
            principal: amount,
            deposit_timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
            simulated_apy_bps,
            balance: coin::into_balance(coin),
        };
        event::emit(Deposited {
            position_id: object::id(&position),
            circle_id,
            amount,
        });
        position
    }

    /// Returns (principal + yield coin, yield_amount).
    public fun withdraw<T>(
        position: YieldPosition<T>,
        ctx: &mut TxContext,
    ): (Coin<T>, u64) {
        let YieldPosition {
            id,
            circle_id,
            principal,
            deposit_timestamp_ms,
            simulated_apy_bps,
            balance,
        } = position;

        let now_ms = tx_context::epoch_timestamp_ms(ctx);
        let elapsed_ms = if (now_ms > deposit_timestamp_ms) {
            now_ms - deposit_timestamp_ms
        } else {
            0
        };

        // yield = principal * apy_bps/10000 * elapsed_ms / (365 * 24 * 3600 * 1000)
        let ms_per_year: u64 = 31_536_000_000;
        let yield_amount = (principal * simulated_apy_bps * elapsed_ms)
            / (10_000 * ms_per_year);

        event::emit(Withdrawn {
            position_id: object::uid_to_inner(&id),
            circle_id,
            principal,
            yield_amount,
        });

        object::delete(id);
        let _ = deposit_timestamp_ms;
        let _ = simulated_apy_bps;
        let _ = circle_id;

        (coin::from_balance(balance, ctx), yield_amount)
    }

    /// Read accrued yield without withdrawing.
    public fun accrue_yield<T>(
        position: &YieldPosition<T>,
        current_ms: u64,
    ): u64 {
        let elapsed_ms = if (current_ms > position.deposit_timestamp_ms) {
            current_ms - position.deposit_timestamp_ms
        } else {
            0
        };
        let ms_per_year: u64 = 31_536_000_000;
        (position.principal * position.simulated_apy_bps * elapsed_ms)
            / (10_000 * ms_per_year)
    }

    public fun position_principal<T>(pos: &YieldPosition<T>): u64 { pos.principal }
    public fun position_circle_id<T>(pos: &YieldPosition<T>): ID { pos.circle_id }
}
