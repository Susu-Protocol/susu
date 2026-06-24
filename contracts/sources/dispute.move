/// Dispute and emergency mechanisms for circle governance.
module susu_protocol::dispute {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::clock::Clock;
    use std::vector;
    use std::option::{Self, Option};
    use openzeppelin_access::access_control::{Self, AccessControl, Auth};
    use openzeppelin_utils::rate_limiter::{Self, RateLimiter};

    /// One-time witness rooting this module's OpenZeppelin AccessControl registry.
    /// Minted once by the VM at publish and consumed in `init`.
    public struct DISPUTE has drop {}

    /// Role permitted to resolve a dispute outside the pure-majority vote path —
    /// e.g. a deadlocked vote or a circle too small for a meaningful quorum.
    /// Holders are granted explicitly via `grant_arbiter`; nothing is hardcoded.
    public struct ArbiterRole has drop {}

    /// Per-circle anti-spam guard for `raise_dispute`. Without this, any address —
    /// member or not, since `raise_dispute` takes a circle ID by value, not a
    /// membership-checked reference — could flood a circle with disputes for free.
    public struct DisputeGuard has key {
        id: UID,
        limiters: Table<ID, RateLimiter>,
    }

    /// Disputes a single circle can absorb before the cooldown gate engages.
    const MAX_DISPUTES_PER_CIRCLE: u64 = 3;
    /// Wait, once the cooldown gate engages, before a circle can accept another dispute.
    const DISPUTE_COOLDOWN_MS: u64 = 3_600_000; // 1 hour

    // ─── Structs ──────────────────────────────────────────────────────────────

    /// Raised by any member when they believe an irregularity occurred.
    public struct Dispute has key {
        id: UID,
        circle_id: ID,
        raised_by: address,
        reason: vector<u8>,
        votes_for: u64,      // votes to resolve in favour of raiser
        votes_against: u64,
        voters: vector<address>,
        resolved: bool,
        outcome: Option<bool>, // true = upheld, false = dismissed
        timestamp_ms: u64,
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct DisputeRaised has copy, drop {
        dispute_id: ID,
        circle_id: ID,
        raised_by: address,
    }

    public struct DisputeVoted has copy, drop {
        dispute_id: ID,
        voter: address,
        in_favour: bool,
    }

    public struct DisputeResolved has copy, drop {
        dispute_id: ID,
        upheld: bool,
    }

    public struct DisputeResolvedByArbiter has copy, drop {
        dispute_id: ID,
        arbiter: address,
        upheld: bool,
    }

    // ─── Init ─────────────────────────────────────────────────────────────────

    fun init(otw: DISPUTE, ctx: &mut TxContext) {
        let ac = access_control::new(otw, 0, ctx);
        transfer::public_share_object(ac);
        transfer::share_object(DisputeGuard { id: object::new(ctx), limiters: table::new(ctx) });
    }

    // ─── Entry functions ──────────────────────────────────────────────────────

    public entry fun raise_dispute(
        guard: &mut DisputeGuard,
        circle_id: ID,
        reason: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        if (!table::contains(&guard.limiters, circle_id)) {
            table::add(
                &mut guard.limiters,
                circle_id,
                rate_limiter::new_cooldown(
                    MAX_DISPUTES_PER_CIRCLE,
                    DISPUTE_COOLDOWN_MS,
                    0,
                    MAX_DISPUTES_PER_CIRCLE,
                    clock,
                ),
            );
        };
        let limiter = table::borrow_mut(&mut guard.limiters, circle_id);
        rate_limiter::consume_or_abort(limiter, 1, clock);

        let sender = tx_context::sender(ctx);
        let dispute = Dispute {
            id: object::new(ctx),
            circle_id,
            raised_by: sender,
            reason,
            votes_for: 0,
            votes_against: 0,
            voters: vector::empty(),
            resolved: false,
            outcome: option::none(),
            timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
        };
        event::emit(DisputeRaised {
            dispute_id: object::id(&dispute),
            circle_id,
            raised_by: sender,
        });
        transfer::share_object(dispute);
    }

    public entry fun vote_on_dispute(
        dispute: &mut Dispute,
        in_favour: bool,
        ctx: &mut TxContext,
    ) {
        assert!(!dispute.resolved, 0);
        let voter = tx_context::sender(ctx);
        assert!(!already_voted(dispute, voter), 1);

        vector::push_back(&mut dispute.voters, voter);
        if (in_favour) {
            dispute.votes_for = dispute.votes_for + 1;
        } else {
            dispute.votes_against = dispute.votes_against + 1;
        };

        event::emit(DisputeVoted {
            dispute_id: object::id(dispute),
            voter,
            in_favour,
        });
    }

    /// Any member can resolve once a clear majority exists.
    public entry fun resolve_dispute(dispute: &mut Dispute, _ctx: &mut TxContext) {
        assert!(!dispute.resolved, 0);
        let total = dispute.votes_for + dispute.votes_against;
        assert!(total > 0, 2);

        dispute.resolved = true;
        let upheld = dispute.votes_for * 2 > total;
        dispute.outcome = option::some(upheld);

        event::emit(DisputeResolved {
            dispute_id: object::id(dispute),
            upheld,
        });
    }

    /// Grant `ArbiterRole` to `account`. Caller must hold the registry's admin
    /// role — initially the address that published this package, transferable
    /// only through `AccessControl`'s timelocked default-admin transfer flow.
    public entry fun grant_arbiter(
        ac: &mut AccessControl<DISPUTE>,
        account: address,
        ctx: &mut TxContext,
    ) {
        access_control::grant_role<DISPUTE, ArbiterRole>(ac, account, ctx);
    }

    /// Revoke `ArbiterRole` from `account`. Caller must hold the registry's admin role.
    public entry fun revoke_arbiter(
        ac: &mut AccessControl<DISPUTE>,
        account: address,
        ctx: &mut TxContext,
    ) {
        access_control::revoke_role<DISPUTE, ArbiterRole>(ac, account, ctx);
    }

    /// Mint an `Auth<ArbiterRole>` proof for the sender. Called as the first
    /// step of a PTB whose second step is `resolve_dispute_by_arbiter` — the
    /// proof is consumed in the same transaction it's minted in.
    public fun mint_arbiter_auth(ac: &AccessControl<DISPUTE>, ctx: &mut TxContext): Auth<ArbiterRole> {
        access_control::new_auth<DISPUTE, ArbiterRole>(ac, ctx)
    }

    /// Arbiter override: resolves a dispute immediately, bypassing the
    /// majority-vote path in `resolve_dispute`. Reserved for votes that
    /// deadlock or a circle too small to reach a meaningful quorum. Gated
    /// entirely by the `Auth<ArbiterRole>` parameter — the compiler enforces
    /// the role, so there's no body-level permission check to get wrong.
    public entry fun resolve_dispute_by_arbiter(
        dispute: &mut Dispute,
        auth: Auth<ArbiterRole>,
        upheld: bool,
    ) {
        assert!(!dispute.resolved, 0);
        let arbiter = access_control::auth_addr(&auth);
        dispute.resolved = true;
        dispute.outcome = option::some(upheld);

        event::emit(DisputeResolvedByArbiter {
            dispute_id: object::id(dispute),
            arbiter,
            upheld,
        });
    }

    fun already_voted(dispute: &Dispute, addr: address): bool {
        let n = vector::length(&dispute.voters);
        let mut i = 0;
        while (i < n) {
            if (*vector::borrow(&dispute.voters, i) == addr) return true;
            i = i + 1;
        };
        false
    }

    // ─── Test-only fixtures ───────────────────────────────────────────────────
    // `init` only runs once, at real publish time — test_scenario never calls it.
    // These mirror `init`'s object construction so tests can exercise the
    // AccessControl-gated and rate-limited paths without a real publish.

    #[test_only]
    public fun create_dispute_guard_for_testing(ctx: &mut TxContext): DisputeGuard {
        DisputeGuard { id: object::new(ctx), limiters: table::new(ctx) }
    }

    #[test_only]
    public fun create_access_control_for_testing(ctx: &mut TxContext): AccessControl<DISPUTE> {
        access_control::new(DISPUTE {}, 0, ctx)
    }
}
