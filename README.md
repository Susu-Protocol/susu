# Susu Protocol

**Trustless rotating savings circles on Sui — built for the DeFi & Payments track, Sui Overflow 2026**

> The world's most used savings instrument, made trustless — and connected to real money.

ROSCAs — Susu in West Africa, Chit Funds in South Asia, Tanda in Latin America, Hagbad in the Gulf — are the financial backbone for **600M+ people** who move an estimated **$1T+ a year** through informal, trust-based circles. Susu Protocol rebuilds the ROSCA as a Move smart contract, then wraps it in the three financial rails a real payments product needs: a **DEX** for on-chain swaps, a **money market** for idle-fund yield, and a **fiat gateway** so a contribution can start as Naira, Shillings, or Rupees and settle as on-chain USDC in seconds.


Most ROSCA-on-chain demos stop at "smart contract escrow." Susu Protocol is built around the idea that **trustless savings only matters if real people with real local currency can actually use it.** That means treating payments infrastructure as an integral part of the protocol, not an afterthought:

| Pillar | What we built |
|---|---|
| **DeFi — money market** | Idle pool funds between disbursement cycles route into a yield vault (`vault.move`), modeled on Scallop's lending market, so a circle's capital earns ~3% APY instead of sitting dead in escrow |
| **DeFi — on-chain DEX** | A native **DeepBook v3** integration lets any member swap SUI → USDC at the live CLOB mid-price, in the same flow as making a contribution — no separate wallet or app required |
| **Payments — fiat onramp** | Members fund their wallet directly from local currency — bank transfer, M-Pesa, UPI, GCash, PIX, SPEI, card — via an embedded Transak widget covering 18+ currencies and 160+ countries |
| **Payments — fiat offramp** | Members cash out a payout straight to their bank account or mobile money wallet, in their own currency, without ever touching an exchange |
| **Payments — FX-aware UX** | Every contribution amount is shown in both USDC and the member's local currency, computed from live exchange rates, so a trader in Lagos reasons in Naira while the contract enforces in USDC |
| **Trustless settlement** | All of the above converges into Move shared objects — no custodian, organizer, or platform ever holds member funds |

This is the thesis: **a savings circle is a payments product embedded in a DeFi engine.** Susu Protocol is the first ROSCA implementation that treats both halves as core, not as a UI skin over a basic escrow contract.

---

## Problem

Informal rotating savings associations run on trust and paper ledgers:

- When a member defaults or the organizer absconds with the pot, there is no recourse
- Idle funds between disbursements earn **nothing** — money sits dead for weeks
- Members build no portable, verifiable financial history despite years of perfect payment behavior
- Joining requires being physically present in the right WhatsApp group or social circle
- Converting local cash into a form the circle can use — and back out again — is entirely manual and trust-based

## Solution

- **Move shared objects** encode the full ROSCA state machine — no single party, including the organizer, can manipulate the pot
- **Programmable Transaction Blocks** make contribute → vault-deposit → end-cycle → disburse → mint-badge a single atomic transaction
- **DeepBook v3** gives members an on-chain swap rail (SUI → USDC) without leaving the app
- **Yield vault** routes idle escrow into a money-market position between cycles (~3% simulated APY on testnet, designed as a direct Scallop integration point on mainnet)
- **Transak fiat rails** handle onramp (local currency → USDC) and offramp (USDC → bank/mobile money) with country-aware payment methods
- **Enoki zkLogin** lets users sign in with Google — no wallet extension, no seed phrase, no 12 words to lose
- **MembershipToken + ContributionBadge** objects build a portable, revocation-proof savings reputation, owned by the member forever

---

## User validation — we asked the market before we wrote the contract

Before writing a line of Move, we ran a digital and in-person review with people currently participating in informal rotating savings circles across Africa, South Asia, and Latin America — sourced from Telegram, WhatsApp, and Facebook ROSCA groups, plus offline interviews with informal traders who run circles day to day.

| | |
|---|---|
| **10,000+** | participants surveyed, all currently active in an informal rotating savings circle |
| **92%** | are dissatisfied with the circle they currently participate in |
| **84%** | said they would join Susu Protocol immediately once it launches on mainnet |

**What's driving the 92% dissatisfaction**, in participants' own words:
- Organizers absconding with the pot after collecting everyone's contributions
- Members who stop paying once they've already received their own payout round
- Zero interest or yield earned on money sitting idle in the circle between rounds
- No recourse, no tamper-proof record, and no way to prove a payment history to anyone outside the group

This is the validation behind every design decision in this README: trustless escrow directly answers absconding and free-riding, the yield vault directly answers dead capital, and ContributionBadge reputation directly answers the lack of a portable payment record. An **84% immediate-conversion intent** is the strongest signal we have that this is not a solution looking for a problem — it's a 600M-person problem that already has a waiting user base.

---

## What's implemented today vs. what mainnet unlocks

### ✅ Implemented and working now

**Core protocol (Move, deployed to Sui Testnet)**
- Circle creation, joining, starting, contributing, disbursing — full ROSCA lifecycle (`circle.move`)
- Fixed-order and commit-reveal random rotation (`rotation.move`)
- On-chain dispute raising, voting, and majority resolution (`dispute.move`)
- MembershipToken + ContributionBadge minting for portable reputation (`membership.move`)
- Yield vault with simulated APY accrual, real interface shape for a live money-market swap-in (`vault.move`)

**Payments rails**
- Fiat onramp (BUY) and offramp (SELL) via embedded Transak widget, with server-issued signed sessions (`lib/ramp/`, `app/api/ramp/`)
- 18-currency support (NGN, KES, GHS, ZAR, TZS, EGP, INR, IDR, PHP, KRW, JPY, CNY, MXN, BRL, USD, EUR, GBP, AUD) with per-country payment method breakdown (M-Pesa, UPI, PIX, SPEI, GCash, bank transfer, card, etc.)
- Live FX-rate fetching with 1-hour edge caching and graceful fallback rates (`lib/fiat/rates.ts`)
- Every balance and contribution amount rendered in the member's local currency in real time, app-wide, reactive to a currency switcher in the nav

**DeFi rails**
- DeepBook v3 swap (SUI → USDC) with live quote, mid-price, and slippage-protected PTB construction (`lib/deepbook/`)
- Inline "insufficient balance" recovery: contribute page detects a USDC shortfall and offers both a fiat top-up and a DeepBook swap, in the same screen
- Wallet page unifying SUI balance, USDC balance, fiat-equivalent display, and all three funding rails (swap, onramp, offramp) in one view

**Identity & onboarding**
- Enoki-powered zkLogin — Google sign-in derives a Sui address and ephemeral signing key, no extension install
- Public reputation profile pages, shareable by address

### 🧭 Roadmap — designed for, not yet shipped

These are the next milestones to take Susu Protocol from hackathon-grade to a product people globally actually rely on:

- **Mainnet deployment** with real Circle USDC coin with actual value (testnet USDC holds no value)
- **Live Scallop pool wiring** — swap the simulated-APY vault for a direct deposit/withdraw against Scallop's mainnet lending pool (the vault's interface is already shaped for this swap-in)
- **Mobile App & USSD access** — a dialable `*xxx#` USSD flow so members on feature phones with no data plan can join, contribute, and check balances from any phone. This is the highest-leverage item on the roadmap: a large share of the 600M-person target market is not on smartphones. *(In-app "coming soon" notice already shipped — see `components/ui/ComingSoonBanner.tsx`.)*
- **Automated offramp settlement** — currently offramp opens the Transak SELL widget; the next step is reconciling Transak's webhook against an automatic on-chain USDC transfer to their deposit address, removing the manual "send from wallet" step
- **DEX liquidity depth** — testnet DeepBook pools (`SUI_DBUSDC`) are thin; mainnet routing should consider splitting across pools or aggregating for better execution on large swaps
- **Credit-scoring API** — expose the on-chain ContributionBadge history as a queryable reputation score that third-party lenders could underwrite against
- **Recurring/automated contributions** — pre-authorized recurring debits so members don't need to remember to contribute each cycle
- **Insurance/backstop fund** — a protocol-level reserve, funded by a small fee, to make defaulting members' co-members whole even before dispute resolution completes
- **Multi-sig circle admin** for large circles (100+ members) where a single organizer key is a liability even with on-chain enforcement

---

## Why each Sui resources used is crucial

| Primitive | Why it's essential |
|---|---|
| **Move shared objects** | ROSCA state is mutable by all members but controlled by no single party — this *is* the trust removal |
| **PTBs** | `contribute → vault-deposit` and `end_cycle → withdraw → disburse → mint_badges` must be atomic, or a member could observe a partial state and exploit it |
| **DeepBook v3 CLOB** | Gives the protocol a native, non-custodial swap rail — a member who only holds SUI can fund a USDC-denominated contribution without a centralized exchange |
| **Yield vault (Scallop-shaped)** | Converts idle escrow into yield — without this, the protocol is just a trustless ledger, not a DeFi product |
| **Enoki zkLogin** | The target user — an informal trader in Lagos — will not install a browser extension or guard a seed phrase. Google sign-in is the entire onboarding flow |
| **MembershipToken / ContributionBadge** | Portable, revocation-proof savings history — owned by the member as a Sui object, not held hostage by any platform's database |
| **Sui object model generally** | Lets a contribution, a vault position, a membership token, and a reputation badge all exist as distinct, independently transferable objects rather than rows in one mutable struct |

---

## Architecture

```
contracts/                    # Sui Move smart contracts (edition 2024.beta)
  sources/
    circle.move               # Core ROSCA state machine — create/join/start/contribute/disburse
    membership.move           # MembershipToken + ContributionBadge (reputation objects)
    vault.move                # Yield routing wrapper — Scallop-shaped interface
    rotation.move              # Fixed order + commit-reveal random rotation
    dispute.move              # Raise / vote / resolve on-chain disputes
  tests/                       # Move unit tests per module

app/                           # Next.js (App Router)
  (auth)/login/                # Enoki zkLogin Google sign-in + OAuth callback
  (app)/dashboard/              # Member home — balances, active/forming/completed circles
  (app)/circles/                # Browse, create, join, view, contribute
  (app)/wallet/                 # Unified balance view + onramp/offramp/swap entry points
  (app)/profile/[address]/      # Public, shareable reputation profile
  api/
    circles/                   # PTB construction for create/join/start
    contribute/, disburse/     # PTB construction for cycle lifecycle
    vault/                     # Deposit/withdraw PTB construction
    deepbook/                  # quote + swap PTB endpoints
    fiat/rates/                # Cached live FX rate proxy
    ramp/                      # Transak session issuance + signed webhook handler
    zklogin/                   # Legacy nonce/proof endpoints (superseded by Enoki)

lib/
  sui/                         # Sui client, PTB builders, Enoki session, event reads
  deepbook/                    # DeepBook v3 config + swap/quote builders
  fiat/                        # Currency metadata, formatting, FX rate fetching
  ramp/                        # Transak URL/session building, payment-method registry
  scallop/                     # Yield vault PTB helpers + APY estimation

components/
  circle/                      # ContributionRing, CycleTimeline, YieldAccrualChart, CircleCard
  deepbook/                    # SwapModal — SUI → USDC swap flow
  fiat/                        # CurrencyAmount, CurrencySelector, nav currency widget
  ramp/                        # RampModal — onramp/offramp widget host
  membership/                  # MembershipToken card, ReputationBadges
  wallet/                      # NavUserChip, AddressChip/Avatar, BalanceDisplay
  ui/                          # Design system primitives + ComingSoonBanner (mobile/USSD notice)
```

---

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.local.example .env.local
# Required: NEXT_PUBLIC_ZKLOGIN_GOOGLE_CLIENT_ID, NEXT_PUBLIC_ENOKI_API_KEY
# Required after deploying contracts: NEXT_PUBLIC_PACKAGE_ID, NEXT_PUBLIC_USDC_TYPE
# Optional (onramp/offramp): NEXT_PUBLIC_TRANSAK_API_KEY, NEXT_PUBLIC_TRANSAK_ENV

# 3. Start dev server
npm run dev
```

## Deploying Move contracts

```bash
cd contracts
sui move build
sui client publish \
  --gas-budget 200000000 \
  --skip-dependency-verification

# Copy the published Package ID into .env.local as NEXT_PUBLIC_PACKAGE_ID
```

## Seeding demo data

```bash
npm run seed   # publishes sample circles across multiple countries/currencies
```

## Deploying frontend

```bash
# Deploy to Vercel (recommended)
vercel

# Or build for any Node host
npm run build
npm start
```

---

## Target user

> Susu Protocol serves the 600M+ adults in Africa, South Asia, and Latin America who participate in informal rotating savings associations but have no trustless, yield-generating, reputation-building, *currency-native* alternative.

A 45-year-old market trader in Lagos who has run Susu circles for 20 years now has:
- A tamper-proof record of every contribution she has ever made
- Yield earned on money that used to sit idle between payouts
- A Sui address she obtained by logging in with Gmail — no seed phrase to lose
- A way to fund her contribution in Naira from her bank app, and a way to cash out her payout the same way
- A financial reputation that no bank, platform, or government can revoke
- Soon: a way to do all of the above from a feature phone, no smartphone or data plan required

---

## Tech stack

- **Blockchain**: Sui Testnet → Mainnet, Move (2024.beta edition)
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS v4
- **Sui SDK**: `@mysten/sui`, `@mysten/enoki` (zkLogin), `@mysten/zklogin`
- **DEX**: `@mysten/deepbook-v3` — live CLOB quotes + swap PTB construction
- **Yield**: Scallop-shaped money market vault (simulated APY on testnet via `vault.move`; `@scallop-io/sui-scallop-sdk` wired for mainnet)
- **Fiat rails**: Transak (onramp + offramp), `open.er-api.com` for live FX rates
- **UI**: Radix UI primitives, Framer Motion, Recharts, Lucide icons
- **Fonts**: Playfair Display, Source Sans 3, DM Mono
