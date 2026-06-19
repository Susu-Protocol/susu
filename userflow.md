Susu Protocol — User Flow
Susu is a trustless ROSCA (rotating savings circle) on Sui. Here's how it works end-to-end:

1. Sign In
User signs in with Google via Enoki zkLogin — no seed phrase, no wallet install. A Sui address is derived from their Google JWT and stored in session.

2. Fund the Wallet
Before joining a circle, the user needs USDC. Three paths:

Onramp — buy USDC with local currency (NGN via bank transfer, KES via M-Pesa, INR via UPI, BRL via PIX, etc.) through the Transak widget
DeepBook Swap — swap SUI they already hold → USDC via the on-chain CLOB
Testnet faucet — for testing
3. Create or Join a Circle
Create — organizer sets the name, contribution amount (e.g. $50 USDC), cycle frequency (weekly/monthly), max members, and rotation order. The circle contract is deployed on Sui.
Join — anyone can browse open circles and join by paying an optional entry deposit. A membership NFT is minted to their wallet.
4. Circle Goes Active
Once the circle fills to max members, the organizer starts it. The contract locks in the rotation order and the first cycle begins with a countdown deadline.

5. Contribute Each Cycle
Every member sends their fixed USDC contribution before the deadline. The contribute page shows the amount in their local fiat currency (e.g. "₦81,250" under "$50 USDC"). If they're short, they can top up inline with fiat onramp or a SUI swap — without leaving the page.

6. Recipient Collects the Pot
When all contributions are in, the contract automatically disburses the full pool to that cycle's designated recipient. If yield mode is on, idle funds earn yield via Scallop while waiting.

7. Repeat Until Complete
The cycle repeats — next member in the rotation becomes recipient — until every member has received the pot once. The circle is then marked Complete on-chain.

8. Withdraw (Offramp)
Any member who has received their payout can withdraw USDC back to their local bank account or mobile money wallet (M-Pesa, GCash, SPEI, etc.) via Transak — fully KYC'd, no crypto knowledge needed.

Key Trust Guarantee
No one (not even the organizer) can touch the funds. Every contribution, disbursement, and membership is enforced by the Move smart contract on Sui — verifiable on-chain forever. Late contributions are penalized by the contract.