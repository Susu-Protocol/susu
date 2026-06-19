#[test_only]
module susu_protocol::rotation_tests {
    use std::vector;
    use susu_protocol::rotation;

    #[test]
    fun test_random_rotation_produces_all_members() {
        let members = vector[@0xA, @0xB, @0xC, @0xD];
        let seeds = vector[
            b"seed_a_random_entropy_value",
            b"seed_b_another_entropy",
            b"seed_c_more_entropy",
            b"seed_d_final_entropy",
        ];
        let rotated = rotation::compute_random_rotation(seeds, members);
        // Every member should appear exactly once
        assert!(vector::length(&rotated) == 4, 0);
        let mut found_a = false;
        let mut found_b = false;
        let mut found_c = false;
        let mut found_d = false;
        let mut i = 0;
        while (i < 4) {
            let m = *vector::borrow(&rotated, i);
            if (m == @0xA) found_a = true;
            if (m == @0xB) found_b = true;
            if (m == @0xC) found_c = true;
            if (m == @0xD) found_d = true;
            i = i + 1;
        };
        assert!(found_a && found_b && found_c && found_d, 1);
    }

    #[test]
    fun test_validate_seed_reveal_correct() {
        let seed = b"my_secret_seed_value";
        let hash = std::hash::sha2_256(seed);
        assert!(rotation::validate_seed_reveal(seed, hash), 0);
    }

    #[test]
    fun test_validate_seed_reveal_wrong_seed() {
        let seed = b"correct_seed";
        let wrong_seed = b"wrong_seed";
        let hash = std::hash::sha2_256(seed);
        assert!(!rotation::validate_seed_reveal(wrong_seed, hash), 0);
    }
}
