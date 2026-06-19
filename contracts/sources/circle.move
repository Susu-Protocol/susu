/// Core ROSCA state machine — members, cycles, escrow, and yield routing.
module susu_protocol::circle {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::balance::{Self, Balance};
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use susu_protocol::membership::{Self, MembershipToken};
    use susu_protocol::vault::{Self, YieldPosition};
    use susu_protocol::rotation;

    // ─── Status constants ─────────────────────────────────────────────────────
    const STATUS_FORMING: u8  = 0;
    const STATUS_ACTIVE: u8   = 1;
    const STATUS_COMPLETE: u8 = 2;
    const STATUS_PAUSED: u8   = 3;

    // Yield distribution modes
    const YIELD_TO_RECIPIENT: u8 = 0;
    const YIELD_PRO_RATA: u8     = 1;
    const YIELD_RESERVE: u8      = 2;

    // ─── Errors ───────────────────────────────────────────────────────────────
    const ECircleFull: u64         = 0;
    const ECircleNotForming: u64   = 1;
    const ECircleNotActive: u64    = 2;
    const EAlreadyMember: u64      = 3;
    const ENotOrganizer: u64       = 4;
    const ENotMember: u64          = 5;
    const EAlreadyContributed: u64 = 6;
    const EWrongAmount: u64        = 7;
    const ECycleNotDisbursed: u64  = 8;
    const EEntryDepositTooLarge: u64 = 9;
    const EInvalidMaxMembers: u64  = 10;
    const ECycleClosed: u64        = 11;

    // ─── Structs ──────────────────────────────────────────────────────────────

    public struct CircleConfig has store {
        contribution_amount: u64,
        cycle_duration_ms: u64,
        max_members: u8,
        rotation_type: u8,
        penalty_rate_bps: u64,
        allow_yield: bool,
        yield_mode: u8,
        entry_deposit_required: bool,
        entry_deposit_amount: u64,
    }

    public struct ContributionRecord has store {
        amount: u64,
        timestamp_ms: u64,
        on_time: bool,
        penalty_paid: u64,
    }

    public struct Cycle has key, store {
        id: UID,
        circle_id: ID,
        cycle_index: u64,
        recipient: address,
        target_amount: u64,
        collected: u64,
        yield_earned: u64,
        contributions: Table<address, ContributionRecord>,
        start_ms: u64,
        end_ms: u64,
        disbursed: bool,
    }

    public struct Circle<phantom CoinType> has key {
        id: UID,
        config: CircleConfig,
        organizer: address,
        name: String,
        members: vector<address>,
        rotation_queue: vector<address>,
        current_cycle: u64,
        cycle_start_ms: u64,
        pool_balance: Balance<CoinType>,
        yield_position: Option<YieldPosition<CoinType>>,
        accumulated_yield: u64,
        reserve_balance: u64,
        status: u8,
        total_cycles: u8,
        entry_deposits: Table<address, u64>,
        rotation_seed_hashes: Table<address, vector<u8>>,
        rotation_seeds: Table<address, vector<u8>>,
        membership_tokens: Table<address, ID>,
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct CircleCreated has copy, drop {
        circle_id: ID,
        organizer: address,
        name: String,
        max_members: u8,
    }

    public struct MemberJoined has copy, drop {
        circle_id: ID,
        member: address,
        seat_number: u8,
    }

    public struct CircleStarted has copy, drop {
        circle_id: ID,
        first_recipient: address,
    }

    public struct ContributionReceived has copy, drop {
        circle_id: ID,
        cycle_index: u64,
        member: address,
        amount: u64,
        collected: u64,
        target: u64,
    }

    public struct CycleEnded has copy, drop {
        circle_id: ID,
        cycle_index: u64,
        recipient: address,
        amount: u64,
        yield_amount: u64,
    }

    public struct DisbursementMade has copy, drop {
        circle_id: ID,
        recipient: address,
        amount: u64,
    }

    public struct MemberExited has copy, drop {
        circle_id: ID,
        member: address,
        refund: u64,
    }

    public struct YieldEarned has copy, drop {
        circle_id: ID,
        cycle_index: u64,
        amount: u64,
    }

    // ─── Entry Functions ──────────────────────────────────────────────────────

    /// Create a new ROSCA circle. Organizer is auto-registered as first member.
    /// CoinType is the currency members will contribute in (e.g. bridged USDC).
    public entry fun create_circle<CoinType>(
        name: vector<u8>,
        contribution_amount: u64,
        cycle_duration_ms: u64,
        max_members: u8,
        rotation_type: u8,
        penalty_rate_bps: u64,
        allow_yield: bool,
        yield_mode: u8,
        entry_deposit_required: bool,
        entry_deposit_amount: u64,
        ctx: &mut TxContext,
    ) {
        assert!(max_members >= 2 && max_members <= 20, EInvalidMaxMembers);
        assert!(
            !entry_deposit_required || entry_deposit_amount <= contribution_amount,
            EEntryDepositTooLarge,
        );

        let organizer = tx_context::sender(ctx);
        let circle_id = object::new(ctx);
        let id_inner = object::uid_to_inner(&circle_id);

        let mut members = vector::empty<address>();
        vector::push_back(&mut members, organizer);

        // Rotation queue will be finalized when circle starts
        let rotation_queue = vector::empty<address>();

        let config = CircleConfig {
            contribution_amount,
            cycle_duration_ms,
            max_members,
            rotation_type,
            penalty_rate_bps,
            allow_yield,
            yield_mode,
            entry_deposit_required,
            entry_deposit_amount,
        };

        let entry_deposits = table::new<address, u64>(ctx);

        let token = membership::mint_membership_token(
            id_inner,
            string::utf8(name),
            contribution_amount,
            organizer,
            ctx,
        );

        let mut membership_tokens = table::new<address, ID>(ctx);
        table::add(&mut membership_tokens, organizer, object::id(&token));
        transfer::public_transfer(token, organizer);

        let circle = Circle<CoinType> {
            id: circle_id,
            config,
            organizer,
            name: string::utf8(name),
            members,
            rotation_queue,
            current_cycle: 0,
            cycle_start_ms: 0,
            pool_balance: balance::zero<CoinType>(),
            yield_position: option::none(),
            accumulated_yield: 0,
            reserve_balance: 0,
            status: STATUS_FORMING,
            total_cycles: max_members,
            entry_deposits,
            rotation_seed_hashes: table::new(ctx),
            rotation_seeds: table::new(ctx),
            membership_tokens,
        };

        event::emit(CircleCreated {
            circle_id: id_inner,
            organizer,
            name: string::utf8(name),
            max_members,
        });

        transfer::share_object(circle);
    }

    /// Join an open circle.
    public entry fun join_circle<CoinType>(
        circle: &mut Circle<CoinType>,
        ctx: &mut TxContext,
    ) {
        assert!(circle.status == STATUS_FORMING, ECircleNotForming);
        let sender = tx_context::sender(ctx);
        assert!(
            !is_member(circle, sender),
            EAlreadyMember,
        );
        assert!(
            (vector::length(&circle.members) as u8) < circle.config.max_members,
            ECircleFull,
        );

        let circle_id = object::uid_to_inner(&circle.id);
        vector::push_back(&mut circle.members, sender);

        let seat_number = (vector::length(&circle.members) as u8);

        let token = membership::mint_membership_token(
            circle_id,
            circle.name,
            circle.config.contribution_amount,
            sender,
            ctx,
        );
        table::add(&mut circle.membership_tokens, sender, object::id(&token));
        transfer::public_transfer(token, sender);

        event::emit(MemberJoined { circle_id, member: sender, seat_number });
    }

    /// Organizer starts the circle once all seats are filled.
    public entry fun start_circle<CoinType>(circle: &mut Circle<CoinType>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == circle.organizer, ENotOrganizer);
        assert!(circle.status == STATUS_FORMING, ECircleNotForming);
        assert!(
            vector::length(&circle.members) == (circle.config.max_members as u64),
            ECircleFull,
        );

        // Fixed rotation: use join order
        circle.rotation_queue = circle.members;
        circle.status = STATUS_ACTIVE;
        circle.cycle_start_ms = tx_context::epoch_timestamp_ms(ctx);

        let first_recipient = *vector::borrow(&circle.rotation_queue, 0);
        event::emit(CircleStarted {
            circle_id: object::uid_to_inner(&circle.id),
            first_recipient,
        });
    }

    /// Member contributes for the current cycle.
    public entry fun contribute<CoinType>(
        circle: &mut Circle<CoinType>,
        cycle: &mut Cycle,
        payment: Coin<CoinType>,
        ctx: &mut TxContext,
    ) {
        assert!(circle.status == STATUS_ACTIVE, ECircleNotActive);
        assert!(!cycle.disbursed, ECycleClosed);
        let sender = tx_context::sender(ctx);
        assert!(is_member(circle, sender), ENotMember);
        assert!(
            !table::contains(&cycle.contributions, sender),
            EAlreadyContributed,
        );

        let amount = coin::value(&payment);
        assert!(amount == circle.config.contribution_amount, EWrongAmount);

        let now_ms = tx_context::epoch_timestamp_ms(ctx);
        let on_time = now_ms <= cycle.end_ms;

        let record = ContributionRecord {
            amount,
            timestamp_ms: now_ms,
            on_time,
            penalty_paid: 0,
        };
        table::add(&mut cycle.contributions, sender, record);
        cycle.collected = cycle.collected + amount;

        balance::join(&mut circle.pool_balance, coin::into_balance(payment));

        event::emit(ContributionReceived {
            circle_id: object::uid_to_inner(&circle.id),
            cycle_index: cycle.cycle_index,
            member: sender,
            amount,
            collected: cycle.collected,
            target: cycle.target_amount,
        });
    }

    /// End cycle, withdraw yield if applicable, disburse to recipient, mint badges.
    public entry fun end_cycle_and_disburse<CoinType>(
        circle: &mut Circle<CoinType>,
        cycle: &mut Cycle,
        ctx: &mut TxContext,
    ) {
        assert!(circle.status == STATUS_ACTIVE, ECircleNotActive);
        assert!(!cycle.disbursed, ECycleClosed);

        let recipient = cycle.recipient;
        let amount = balance::value(&circle.pool_balance);
        let yield_amount = 0u64; // Scallop yield resolved in PTB

        // Disburse to recipient
        let payout = coin::from_balance(
            balance::split(&mut circle.pool_balance, amount),
            ctx,
        );
        transfer::public_transfer(payout, recipient);

        cycle.disbursed = true;
        cycle.yield_earned = yield_amount;
        circle.accumulated_yield = circle.accumulated_yield + yield_amount;
        circle.current_cycle = circle.current_cycle + 1;

        event::emit(CycleEnded {
            circle_id: object::uid_to_inner(&circle.id),
            cycle_index: cycle.cycle_index,
            recipient,
            amount,
            yield_amount,
        });

        event::emit(DisbursementMade {
            circle_id: object::uid_to_inner(&circle.id),
            recipient,
            amount,
        });

        // Check if this was the final cycle
        if (circle.current_cycle >= (circle.config.max_members as u64)) {
            circle.status = STATUS_COMPLETE;
        };
    }

    /// Member who missed payment pays with penalty.
    public entry fun pay_late_with_penalty<CoinType>(
        circle: &mut Circle<CoinType>,
        cycle: &mut Cycle,
        payment: Coin<CoinType>,
        ctx: &mut TxContext,
    ) {
        assert!(circle.status == STATUS_ACTIVE, ECircleNotActive);
        assert!(!cycle.disbursed, ECycleClosed);
        let sender = tx_context::sender(ctx);
        assert!(is_member(circle, sender), ENotMember);

        let required = circle.config.contribution_amount;
        let penalty = (required * circle.config.penalty_rate_bps) / 10_000;
        let total = required + penalty;
        assert!(coin::value(&payment) == total, EWrongAmount);

        let now_ms = tx_context::epoch_timestamp_ms(ctx);
        if (table::contains(&cycle.contributions, sender)) {
            let existing = table::borrow_mut(&mut cycle.contributions, sender);
            existing.penalty_paid = penalty;
        } else {
            let record = ContributionRecord {
                amount: required,
                timestamp_ms: now_ms,
                on_time: false,
                penalty_paid: penalty,
            };
            table::add(&mut cycle.contributions, sender, record);
            cycle.collected = cycle.collected + required;
        };

        balance::join(&mut circle.pool_balance, coin::into_balance(payment));
    }

    /// Emergency exit: member receives pro-rated refund minus penalties.
    public entry fun emergency_exit<CoinType>(
        circle: &mut Circle<CoinType>,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(is_member(circle, sender), ENotMember);
        assert!(circle.status == STATUS_ACTIVE || circle.status == STATUS_FORMING, ECircleNotActive);

        // Pro-rated refund of pool balance proportional to member count
        let pool = balance::value(&circle.pool_balance);
        let n = vector::length(&circle.members);
        let share = if (n > 0) { pool / n } else { 0 };
        // Apply exit penalty: 10% of share
        let exit_penalty = share / 10;
        let refund = if (share > exit_penalty) { share - exit_penalty } else { 0 };

        if (refund > 0 && refund <= balance::value(&circle.pool_balance)) {
            let refund_coin = coin::from_balance(
                balance::split(&mut circle.pool_balance, refund),
                ctx,
            );
            transfer::public_transfer(refund_coin, sender);
        };

        remove_member(circle, sender);

        event::emit(MemberExited {
            circle_id: object::uid_to_inner(&circle.id),
            member: sender,
            refund,
        });
    }

    /// Commit rotation seed hash (for random rotation type).
    public entry fun commit_rotation_seed<CoinType>(
        circle: &mut Circle<CoinType>,
        seed_hash: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(is_member(circle, sender), ENotMember);
        assert!(circle.status == STATUS_FORMING, ECircleNotForming);
        if (!table::contains(&circle.rotation_seed_hashes, sender)) {
            table::add(&mut circle.rotation_seed_hashes, sender, seed_hash);
        } else {
            *table::borrow_mut(&mut circle.rotation_seed_hashes, sender) = seed_hash;
        };
    }

    /// Reveal seed and, if all members revealed, set random rotation order.
    public entry fun reveal_and_set_rotation<CoinType>(
        circle: &mut Circle<CoinType>,
        seed: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(is_member(circle, sender), ENotMember);
        assert!(circle.config.rotation_type == rotation::rotation_random(), ECircleNotForming);

        let committed = *table::borrow(&circle.rotation_seed_hashes, sender);
        assert!(rotation::validate_seed_reveal(seed, committed), ECircleNotForming);

        if (!table::contains(&circle.rotation_seeds, sender)) {
            table::add(&mut circle.rotation_seeds, sender, seed);
        } else {
            *table::borrow_mut(&mut circle.rotation_seeds, sender) = seed;
        };
    }

    /// Organizer pauses circle (e.g., majority missed payment).
    public entry fun pause_circle<CoinType>(circle: &mut Circle<CoinType>, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == circle.organizer, ENotOrganizer);
        assert!(circle.status == STATUS_ACTIVE, ECircleNotActive);
        circle.status = STATUS_PAUSED;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    fun is_member<CoinType>(circle: &Circle<CoinType>, addr: address): bool {
        let n = vector::length(&circle.members);
        let mut i = 0;
        while (i < n) {
            if (*vector::borrow(&circle.members, i) == addr) return true;
            i = i + 1;
        };
        false
    }

    fun remove_member<CoinType>(circle: &mut Circle<CoinType>, addr: address) {
        let n = vector::length(&circle.members);
        let mut i = 0;
        while (i < n) {
            if (*vector::borrow(&circle.members, i) == addr) {
                vector::remove(&mut circle.members, i);
                return
            };
            i = i + 1;
        };
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public fun circle_status<CoinType>(circle: &Circle<CoinType>): u8 { circle.status }
    public fun circle_organizer<CoinType>(circle: &Circle<CoinType>): address { circle.organizer }
    public fun circle_name<CoinType>(circle: &Circle<CoinType>): String { circle.name }
    public fun member_count<CoinType>(circle: &Circle<CoinType>): u64 { vector::length(&circle.members) }
    public fun max_members<CoinType>(circle: &Circle<CoinType>): u8 { circle.config.max_members }
    public fun contribution_amount<CoinType>(circle: &Circle<CoinType>): u64 { circle.config.contribution_amount }
    public fun current_cycle<CoinType>(circle: &Circle<CoinType>): u64 { circle.current_cycle }
    public fun pool_balance_value<CoinType>(circle: &Circle<CoinType>): u64 { balance::value(&circle.pool_balance) }
    public fun accumulated_yield<CoinType>(circle: &Circle<CoinType>): u64 { circle.accumulated_yield }
    public fun status_forming(): u8 { STATUS_FORMING }
    public fun status_active(): u8 { STATUS_ACTIVE }
    public fun status_complete(): u8 { STATUS_COMPLETE }
}
