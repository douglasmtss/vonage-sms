import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getMessages } from "@/lib/store";

// Disable caching so the client always gets fresh data
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const apiSecret = process.env.API_SECRET;
  if (!apiSecret) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${apiSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return NextResponse.json(getMessages());
}
