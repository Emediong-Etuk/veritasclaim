import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { keccak256, toHex } from "viem";
import { claims } from "@/lib/store";

const submitClaimSchema = z.object({
  question: z.string().min(15).max(800),
  submitter: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = submitClaimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { question, submitter } = parsed.data;
    const claimId = keccak256(toHex(question + (submitter || "anon") + Date.now()));

    const claim = {
      claimId,
      question,
      submitter: submitter || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      report: null,
    };

    claims.set(claimId, claim);

    return NextResponse.json(
      {
        success: true,
        claimId,
        message: "Claim submitted. CRE multi-LLM consensus workflow will be triggered.",
        status: "pending",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(Array.from(claims.values()));
}
