import { NextRequest, NextResponse } from "next/server";
import { claims } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { claimId, verdict, confidence, quorumReached } = body;

  const claim = claims.get(claimId);
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  if (!quorumReached || confidence < 7000) {
    claim.status = "rejected_uncertain";
    claim.report = { verdict, confidence, quorumReached, reason: "Quorum or confidence threshold not met" };
  } else if (verdict === 1) {
    claim.status = "verified_true";
    claim.report = { verdict, confidence, quorumReached };
  } else if (verdict === 2) {
    claim.status = "verified_false";
    claim.report = { verdict, confidence, quorumReached };
  } else {
    claim.status = "rejected_uncertain";
  }

  claims.set(claimId, claim);
  return NextResponse.json({ success: true, status: claim.status });
}
