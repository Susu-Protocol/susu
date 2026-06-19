/// Dispute and emergency mechanisms for circle governance.
module susu_protocol::dispute {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::vector;
    use std::option::{Self, Option};

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

    // ─── Entry functions ──────────────────────────────────────────────────────

    public entry fun raise_dispute(
        circle_id: ID,
        reason: vector<u8>,
        ctx: &mut TxContext,
    ) {
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

    fun already_voted(dispute: &Dispute, addr: address): bool {
        let n = vector::length(&dispute.voters);
        let mut i = 0;
        while (i < n) {
            if (*vector::borrow(&dispute.voters, i) == addr) return true;
            i = i + 1;
        };
        false
    }
}
