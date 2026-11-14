import { NextRequest, NextResponse } from "next/server";
import { claims } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const { claimId } = await params;
  const claim = claims.get(claimId);
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }
  return NextResponse.json(claim);
}
