#[test_only]
module susu_protocol::circle_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use susu_protocol::circle::{Self, Circle};

    /// Stand-in coin type for tests — circles are generic over whatever
    /// CoinType is passed at create_circle time.
    public struct TestUSDC has drop {}

    const ORGANIZER: address = @0xA;
    const MEMBER_B: address  = @0xB;
    const MEMBER_C: address  = @0xC;

    #[test]
    fun test_create_circle() {
        let mut scenario = ts::begin(ORGANIZER);
        {
            circle::create_circle<TestUSDC>(
                b"Test Susu Circle",
                100_000_000, // 100 USDC (6 decimals)
                2_592_000_000, // 30 days in ms
                3, // max members
                0, // fixed rotation
                200, // 2% penalty
                false, // no yield
                0, // yield mode
                false, // no entry deposit
                0,
                ts::ctx(&mut scenario),
            );
        };
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            assert!(circle::member_count(&circle) == 1, 0);
            assert!(circle::circle_status(&circle) == circle::status_forming(), 1);
            assert!(circle::max_members(&circle) == 3, 2);
            ts::return_shared(circle);
        };
        ts::end(scenario);
    }

    #[test]
    fun test_join_circle() {
        let mut scenario = ts::begin(ORGANIZER);
        {
            circle::create_circle<TestUSDC>(
                b"Join Test Circle",
                100_000_000,
                2_592_000_000,
                3,
                0,
                200,
                false,
                0,
                false,
                0,
                ts::ctx(&mut scenario),
            );
        };
        ts::next_tx(&mut scenario, MEMBER_B);
        {
            let mut circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            circle::join_circle(&mut circle, ts::ctx(&mut scenario));
            assert!(circle::member_count(&circle) == 2, 0);
            ts::return_shared(circle);
        };
        ts::next_tx(&mut scenario, MEMBER_C);
        {
            let mut circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            circle::join_circle(&mut circle, ts::ctx(&mut scenario));
            assert!(circle::member_count(&circle) == 3, 0);
            ts::return_shared(circle);
        };
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = susu_protocol::circle::ECircleFull)]
    fun test_join_full_circle_fails() {
        let mut scenario = ts::begin(ORGANIZER);
        {
            circle::create_circle<TestUSDC>(
                b"Full Circle Test",
                100_000_000,
                2_592_000_000,
                2, // only 2 members
                0, 200, false, 0, false, 0,
                ts::ctx(&mut scenario),
            );
        };
        ts::next_tx(&mut scenario, MEMBER_B);
        {
            let mut circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            circle::join_circle(&mut circle, ts::ctx(&mut scenario));
            ts::return_shared(circle);
        };
        // MEMBER_C tries to join — should fail
        ts::next_tx(&mut scenario, MEMBER_C);
        {
            let mut circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            circle::join_circle(&mut circle, ts::ctx(&mut scenario));
            ts::return_shared(circle);
        };
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = susu_protocol::circle::EAlreadyMember)]
    fun test_duplicate_join_fails() {
        let mut scenario = ts::begin(ORGANIZER);
        {
            circle::create_circle<TestUSDC>(
                b"Dup Join Test",
                100_000_000,
                2_592_000_000,
                3, 0, 200, false, 0, false, 0,
                ts::ctx(&mut scenario),
            );
        };
        ts::next_tx(&mut scenario, MEMBER_B);
        {
            let mut circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            circle::join_circle(&mut circle, ts::ctx(&mut scenario));
            ts::return_shared(circle);
        };
        // MEMBER_B tries to join again
        ts::next_tx(&mut scenario, MEMBER_B);
        {
            let mut circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            circle::join_circle(&mut circle, ts::ctx(&mut scenario));
            ts::return_shared(circle);
        };
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = susu_protocol::circle::ENotOrganizer)]
    fun test_non_organizer_cannot_start() {
        let mut scenario = ts::begin(ORGANIZER);
        {
            circle::create_circle<TestUSDC>(
                b"Start Auth Test",
                100_000_000,
                2_592_000_000,
                2, 0, 200, false, 0, false, 0,
                ts::ctx(&mut scenario),
            );
        };
        ts::next_tx(&mut scenario, MEMBER_B);
        {
            let mut circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            circle::join_circle(&mut circle, ts::ctx(&mut scenario));
            ts::return_shared(circle);
        };
        ts::next_tx(&mut scenario, MEMBER_B);
        {
            let mut circle = ts::take_shared<Circle<TestUSDC>>(&scenario);
            // MEMBER_B is not the organizer — should fail
            circle::start_circle(&mut circle, ts::ctx(&mut scenario));
            ts::return_shared(circle);
        };
        ts::end(scenario);
    }
}
