/// Member tokens and contribution badges — portable, verifiable savings reputation.
module susu_protocol::membership {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // ─── Errors ───────────────────────────────────────────────────────────────

    const ENotOwner: u64 = 0;
    const ECircleStillActive: u64 = 1;
    const EAlreadyUnlocked: u64 = 2;

    // ─── Structs ──────────────────────────────────────────────────────────────

    /// Soulbound while circle is active; becomes transferable after final cycle.
    public struct MembershipToken has key, store {
        id: UID,
        owner: address,
        circle_id: ID,
        circle_name: String,
        join_timestamp: u64,
        contribution_amount: u64,
        cycles_completed: u8,
        cycles_on_time: u8,
        total_contributed: u64,
        received_disbursement: bool,
        disbursement_cycle: Option<u8>,
        locked: bool, // true while circle is active
    }

    /// Minted after each on-time contribution.
    public struct ContributionBadge has key {
        id: UID,
        owner: address,
        circle_id: ID,
        cycle_index: u64,
        amount: u64,
        on_time: bool,
        timestamp: u64,
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct MembershipMinted has copy, drop {
        token_id: ID,
        owner: address,
        circle_id: ID,
    }

    public struct BadgeMinted has copy, drop {
        badge_id: ID,
        owner: address,
        circle_id: ID,
        cycle_index: u64,
        on_time: bool,
    }

    public struct TokenUnlocked has copy, drop {
        token_id: ID,
        owner: address,
    }

    // ─── Functions ────────────────────────────────────────────────────────────

    public fun mint_membership_token(
        circle_id: ID,
        circle_name: String,
        contribution_amount: u64,
        member: address,
        ctx: &mut TxContext,
    ): MembershipToken {
        let token = MembershipToken {
            id: object::new(ctx),
            owner: member,
            circle_id,
            circle_name,
            join_timestamp: tx_context::epoch_timestamp_ms(ctx),
            contribution_amount,
            cycles_completed: 0,
            cycles_on_time: 0,
            total_contributed: 0,
            received_disbursement: false,
            disbursement_cycle: option::none(),
            locked: true,
        };
        event::emit(MembershipMinted {
            token_id: object::id(&token),
            owner: member,
            circle_id,
        });
        token
    }

    public fun mint_contribution_badge(
        circle_id: ID,
        cycle_index: u64,
        amount: u64,
        on_time: bool,
        member: address,
        ctx: &mut TxContext,
    ) {
        let badge = ContributionBadge {
            id: object::new(ctx),
            owner: member,
            circle_id,
            cycle_index,
            amount,
            on_time,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        };
        event::emit(BadgeMinted {
            badge_id: object::id(&badge),
            owner: member,
            circle_id,
            cycle_index,
            on_time,
        });
        transfer::transfer(badge, member);
    }

    public fun update_token_stats(
        token: &mut MembershipToken,
        amount: u64,
        on_time: bool,
        cycle_index: u8,
        disbursement_cycle: Option<u8>,
    ) {
        token.cycles_completed = token.cycles_completed + 1;
        if (on_time) {
            token.cycles_on_time = token.cycles_on_time + 1;
        };
        token.total_contributed = token.total_contributed + amount;
        if (option::is_some(&disbursement_cycle)) {
            token.received_disbursement = true;
            token.disbursement_cycle = disbursement_cycle;
        };
        let _ = cycle_index;
    }

    /// Called after the final cycle; makes the token transferable.
    public fun unlock_membership_token(token: &mut MembershipToken) {
        assert!(!(!token.locked), EAlreadyUnlocked);
        token.locked = false;
        event::emit(TokenUnlocked {
            token_id: object::id(token),
            owner: token.owner,
        });
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public fun token_owner(token: &MembershipToken): address { token.owner }
    public fun token_circle_id(token: &MembershipToken): ID { token.circle_id }
    public fun cycles_completed(token: &MembershipToken): u8 { token.cycles_completed }
    public fun cycles_on_time(token: &MembershipToken): u8 { token.cycles_on_time }
    public fun total_contributed(token: &MembershipToken): u64 { token.total_contributed }
    public fun is_locked(token: &MembershipToken): bool { token.locked }
}
