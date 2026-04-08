import { NextResponse } from "next/server";
import { getMessages } from "@/lib/store";

// Disable caching so the client always gets fresh data
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getMessages());
}
