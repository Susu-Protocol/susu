/// Rotation order logic — fixed order and commit-reveal randomness.
module susu_protocol::rotation {
    use std::vector;
    use std::hash;

    // ─── Errors ───────────────────────────────────────────────────────────────

    const EInvalidSeedReveal: u64 = 0;
    const ENotEnoughSeeds: u64 = 1;

    // ─── Constants ────────────────────────────────────────────────────────────

    const ROTATION_FIXED: u8 = 0;
    const ROTATION_RANDOM: u8 = 1;

    // ─── Functions ────────────────────────────────────────────────────────────

    public fun rotation_fixed(): u8 { ROTATION_FIXED }
    public fun rotation_random(): u8 { ROTATION_RANDOM }

    /// XOR all revealed seeds into a single entropy value, then use it to
    /// shuffle `members` via a Fisher-Yates variant.
    public fun compute_random_rotation(
        seeds: vector<vector<u8>>,
        members: vector<address>,
    ): vector<address> {
        assert!(vector::length(&seeds) > 0, ENotEnoughSeeds);

        // XOR all seed bytes to produce entropy
        let entropy_hash = xor_seeds(seeds);

        // Fisher-Yates shuffle driven by entropy bytes
        let n = vector::length(&members);
        let mut result = members;
        let mut i = n;
        while (i > 1) {
            i = i - 1;
            let entropy_byte = (*vector::borrow(&entropy_hash, i % 32) as u64);
            let j = entropy_byte % (i + 1);
            vector::swap(&mut result, i, j);
        };
        result
    }

    /// Verify that the revealed seed matches the previously committed hash.
    public fun validate_seed_reveal(
        seed: vector<u8>,
        committed_hash: vector<u8>,
    ): bool {
        let computed = hash::sha2_256(seed);
        computed == committed_hash
    }

    fun xor_seeds(seeds: vector<vector<u8>>): vector<u8> {
        let mut result = vector::empty<u8>();
        let mut k = 0;
        while (k < 32) {
            vector::push_back(&mut result, 0u8);
            k = k + 1;
        };

        let num_seeds = vector::length(&seeds);
        let mut s = 0;
        while (s < num_seeds) {
            let seed = vector::borrow(&seeds, s);
            let seed_hash = hash::sha2_256(*seed);
            let mut b = 0;
            while (b < 32) {
                let cur = *vector::borrow(&result, b);
                let new_val = cur ^ *vector::borrow(&seed_hash, b);
                *vector::borrow_mut(&mut result, b) = new_val;
                b = b + 1;
            };
            s = s + 1;
        };
        result
    }
}
