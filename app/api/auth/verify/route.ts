import { NextRequest, NextResponse } from "next/server";
import { isOwnerKeyConfigured, verifyOwnerKey } from "@/lib/auth/owner";

export async function POST(request: NextRequest) {
  if (!isOwnerKeyConfigured()) {
    return NextResponse.json({ error: "Owner-key access is not configured." }, { status: 409 });
  }

  const payload = await request.json().catch(() => ({}));
  const key = typeof payload?.key === "string" ? payload.key : "";

  if (!verifyOwnerKey(key)) {
    return NextResponse.json({ error: "That owner key is not valid." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
