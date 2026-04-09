import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { addMessage } from "@/lib/store";

/**
 * Vonage Inbound SMS Webhook
 *
 * Vonage sends a POST (or GET) request to this URL whenever an SMS
 * is received on your virtual number.
 *
 * Configure this URL in the Vonage Dashboard:
 *   https://dashboard.nexmo.com → Your applications / API settings
 *   Inbound SMS URL: https://<your-domain>/api/webhook?secret=WEBHOOK_SECRET
 */

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function isAuthorized(request: NextRequest): boolean {
  // If no secret is configured, block all requests to prevent accidental open access
  if (!WEBHOOK_SECRET) return false;
  const secret = new URL(request.url).searchParams.get("secret");
  return secret === WEBHOOK_SECRET;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse(null, { status: 403 });
  }

  let body: Record<string, string>;

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      // Vonage may send as application/x-www-form-urlencoded
      const formData = await request.formData();
      body = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));
    }
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const from = String(body.msisdn ?? body.from ?? "unknown").slice(0, 20);
  const to = String(body.to ?? body.To ?? "").slice(0, 20);
  const text = String(body.text ?? body.Text ?? body.body ?? "").slice(0, 1600);

  if (text) {
    addMessage({
      direction: "inbound",
      source: "sms",
      from,
      to,
      text,
    });
  }

  // Vonage expects a 200 OK response
  return new NextResponse(null, { status: 200 });
}

// Vonage also supports GET for the inbound webhook
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const from = (searchParams.get("msisdn") ?? searchParams.get("from") ?? "unknown").slice(0, 20);
  const to = (searchParams.get("to") ?? searchParams.get("To") ?? "").slice(0, 20);
  const text = (searchParams.get("text") ?? searchParams.get("Text") ?? "").slice(0, 1600);

  if (text) {
    addMessage({ direction: "inbound", source: "sms", from, to, text });
  }

  return new NextResponse(null, { status: 200 });
}
