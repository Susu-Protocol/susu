#[test_only]
module susu_protocol::membership_tests {
    use sui::test_scenario::{Self as ts};
    use sui::object;
    use std::string;
    use susu_protocol::membership::{Self, MembershipToken};

    const MEMBER: address = @0xA;

    #[test]
    fun test_mint_membership_token() {
        let mut scenario = ts::begin(MEMBER);
        let circle_id = object::id_from_address(@0xCAFE);
        {
            let token = membership::mint_membership_token(
                circle_id,
                string::utf8(b"Test Circle"),
                100_000_000,
                MEMBER,
                ts::ctx(&mut scenario),
            );
            assert!(membership::token_owner(&token) == MEMBER, 0);
            assert!(membership::cycles_completed(&token) == 0, 1);
            assert!(membership::is_locked(&token), 2);
            sui::transfer::public_transfer(token, MEMBER);
        };
        ts::end(scenario);
    }

    #[test]
    fun test_update_token_stats() {
        let mut scenario = ts::begin(MEMBER);
        let circle_id = object::id_from_address(@0xCAFE);
        {
            let mut token = membership::mint_membership_token(
                circle_id,
                string::utf8(b"Stats Test"),
                100_000_000,
                MEMBER,
                ts::ctx(&mut scenario),
            );
            membership::update_token_stats(&mut token, 100_000_000, true, 0, std::option::none());
            assert!(membership::cycles_completed(&token) == 1, 0);
            assert!(membership::cycles_on_time(&token) == 1, 1);
            assert!(membership::total_contributed(&token) == 100_000_000, 2);
            sui::transfer::public_transfer(token, MEMBER);
        };
        ts::end(scenario);
    }

    #[test]
    fun test_unlock_token() {
        let mut scenario = ts::begin(MEMBER);
        let circle_id = object::id_from_address(@0xCAFE);
        {
            let mut token = membership::mint_membership_token(
                circle_id,
                string::utf8(b"Unlock Test"),
                100_000_000,
                MEMBER,
                ts::ctx(&mut scenario),
            );
            assert!(membership::is_locked(&token), 0);
            membership::unlock_membership_token(&mut token);
            assert!(!membership::is_locked(&token), 1);
            sui::transfer::public_transfer(token, MEMBER);
        };
        ts::end(scenario);
    }

    #[test]
    fun test_mint_contribution_badge() {
        let mut scenario = ts::begin(MEMBER);
        let circle_id = object::id_from_address(@0xCAFE);
        {
            membership::mint_contribution_badge(
                circle_id,
                0,
                100_000_000,
                true,
                MEMBER,
                ts::ctx(&mut scenario),
            );
        };
        ts::end(scenario);
    }
}
