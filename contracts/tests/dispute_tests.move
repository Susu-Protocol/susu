#[test_only]
module susu_protocol::dispute_tests {
    use sui::test_scenario::{Self as ts};
    use sui::test_utils;
    use sui::clock;
    use sui::object;
    use susu_protocol::dispute::{Self, Dispute};

    const RAISER: address = @0xA;
    const ARBITER: address = @0xB;
    const OUTSIDER: address = @0xC;

    #[test]
    fun test_disputes_up_to_cap_succeed() {
        let mut scenario = ts::begin(RAISER);
        let circle_id = object::id_from_address(@0x1234);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        let mut guard = dispute::create_dispute_guard_for_testing(ts::ctx(&mut scenario));

        // MAX_DISPUTES_PER_CIRCLE = 3 — all three should succeed.
        let mut i = 0;
        while (i < 3) {
            dispute::raise_dispute(&mut guard, circle_id, b"irregularity", &clock, ts::ctx(&mut scenario));
            i = i + 1;
        };

        clock::destroy_for_testing(clock);
        test_utils::destroy(guard);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_fourth_dispute_is_rate_limited() {
        let mut scenario = ts::begin(RAISER);
        let circle_id = object::id_from_address(@0x1234);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        let mut guard = dispute::create_dispute_guard_for_testing(ts::ctx(&mut scenario));

        // A 4th dispute against the same circle within the cooldown window must abort —
        // this is the OpenZeppelin rate limiter rejecting the call, not our own assert.
        let mut i = 0;
        while (i < 4) {
            dispute::raise_dispute(&mut guard, circle_id, b"irregularity", &clock, ts::ctx(&mut scenario));
            i = i + 1;
        };

        clock::destroy_for_testing(clock);
        test_utils::destroy(guard);
        ts::end(scenario);
    }

    #[test]
    fun test_disputes_against_different_circles_have_independent_limits() {
        let mut scenario = ts::begin(RAISER);
        let circle_a = object::id_from_address(@0xAAA);
        let circle_b = object::id_from_address(@0xBBB);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        let mut guard = dispute::create_dispute_guard_for_testing(ts::ctx(&mut scenario));

        // Exhaust circle_a's cap...
        let mut i = 0;
        while (i < 3) {
            dispute::raise_dispute(&mut guard, circle_a, b"irregularity", &clock, ts::ctx(&mut scenario));
            i = i + 1;
        };
        // ...circle_b is unaffected, since each circle gets its own limiter.
        dispute::raise_dispute(&mut guard, circle_b, b"irregularity", &clock, ts::ctx(&mut scenario));

        clock::destroy_for_testing(clock);
        test_utils::destroy(guard);
        ts::end(scenario);
    }

    #[test]
    fun test_arbiter_can_resolve_dispute() {
        let mut scenario = ts::begin(RAISER);
        let circle_id = object::id_from_address(@0x1234);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        let mut guard = dispute::create_dispute_guard_for_testing(ts::ctx(&mut scenario));
        // RAISER is ctx.sender() at creation, so RAISER becomes the registry's default admin.
        let mut ac = dispute::create_access_control_for_testing(ts::ctx(&mut scenario));

        dispute::raise_dispute(&mut guard, circle_id, b"irregularity", &clock, ts::ctx(&mut scenario));

        ts::next_tx(&mut scenario, RAISER);
        dispute::grant_arbiter(&mut ac, ARBITER, ts::ctx(&mut scenario));

        ts::next_tx(&mut scenario, ARBITER);
        {
            let mut d = ts::take_shared<Dispute>(&scenario);
            let auth = dispute::mint_arbiter_auth(&ac, ts::ctx(&mut scenario));
            dispute::resolve_dispute_by_arbiter(&mut d, auth, true);
            ts::return_shared(d);
        };

        clock::destroy_for_testing(clock);
        test_utils::destroy(guard);
        test_utils::destroy(ac);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_non_arbiter_cannot_mint_auth() {
        let mut scenario = ts::begin(RAISER);
        let circle_id = object::id_from_address(@0x1234);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        let mut guard = dispute::create_dispute_guard_for_testing(ts::ctx(&mut scenario));
        let ac = dispute::create_access_control_for_testing(ts::ctx(&mut scenario));

        dispute::raise_dispute(&mut guard, circle_id, b"irregularity", &clock, ts::ctx(&mut scenario));

        // OUTSIDER was never granted ArbiterRole — minting the proof must abort.
        ts::next_tx(&mut scenario, OUTSIDER);
        let auth = dispute::mint_arbiter_auth(&ac, ts::ctx(&mut scenario));
        test_utils::destroy(auth);

        clock::destroy_for_testing(clock);
        test_utils::destroy(guard);
        test_utils::destroy(ac);
        ts::end(scenario);
    }
}
