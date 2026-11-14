# TESTING.md — VeritasClaim

## Contract Tests (Foundry)

**Status: All passing**

```bash
cd contracts
forge test --match-path test/VeritasClaimConsumer.t.sol --fuzz-runs 1000 -vv
```

### Results (last run)

```
Ran 10 tests for test/VeritasClaimConsumer.t.sol:VeritasClaimConsumerTest
[PASS] testFuzz_ConfidenceThreshold(uint16) (runs: 1000)
[PASS] test_ExecuteAction_OnlyOnVerifiedTrue()
[PASS] test_ExecuteAction_RejectedOnFalse()
[PASS] test_FulfillClaim_HappyPath()
[PASS] test_FulfillClaim_LowConfidence_Reverts()
[PASS] test_FulfillClaim_NoQuorum_Reverts()
[PASS] test_FulfillClaim_StaleReport_Reverts()
[PASS] test_FulfillClaim_Unauthorized_Reverts()
[PASS] test_ReplayProtection()
[PASS] test_SubmitClaim()
Suite result: ok. 10 passed; 0 failed; 0 skipped
```

### Coverage of safety invariants

| Invariant | Test |
|-----------|------|
| Happy path (verified true) | `test_FulfillClaim_HappyPath` |
| Low confidence rejects | `test_FulfillClaim_LowConfidence_Reverts` + fuzz |
| No quorum rejects | `test_FulfillClaim_NoQuorum_Reverts` |
| Stale report rejects | `test_FulfillClaim_StaleReport_Reverts` |
| Unauthorized forwarder rejects | `test_FulfillClaim_Unauthorized_Reverts` |
| Replay protection | `test_ReplayProtection` |
| Action only on VerifiedTrue | `test_ExecuteAction_OnlyOnVerifiedTrue` / `RejectedOnFalse` |
| Confidence threshold fuzzed | `testFuzz_ConfidenceThreshold` (1,000 runs) |
| Question length validation | Covered by submit tests |

### Fixes applied during testing

1. Removed stray `vm.prank` in `setUp()` that was causing prank conflicts.
2. Increased question string lengths to satisfy `> 10 && < 1000` check.
3. Added `vm.warp` in stale-report test to avoid underflow on `block.timestamp`.

## CRE Workflow

Simulated via `cre/workflows/claim-verifier/simulate.ts`.
Run: `cd cre && npm run simulate`

## Backend / Frontend

- API routes validated with Zod schemas.
- Live deployment: https://veritasclaim.vercel.app
- Manual claim submission + status flow tested on Vercel.

## How to re-run everything

```bash
# Contracts
cd contracts && forge test --fuzz-runs 1000 -vv

# CRE simulation
cd ../cre && npm run simulate

# Frontend (local)
cd ../frontend && npm run dev
```
