import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { addMessage } from "@/lib/store";

/**
 * Vonage Messages API — Inbound Webhook
 *
 * Vonage chama este endpoint (POST) quando uma mensagem é recebida no número
 * configurado na aplicação Messages API.
 *
 * Configure no painel Vonage:
 *   https://dashboard.nexmo.com → Applications → <app> → Edit
 *   Messages → Inbound URL: https://<domínio>/inbound
 */

const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID;

/**
 * Decodifica o JWT do header Authorization (sem verificar a assinatura) e
 * valida o claim `application_id` contra a variável de ambiente.
 * Se VONAGE_APPLICATION_ID não estiver definido, todas as requisições passam.
 */
function isAuthorized(request: NextRequest): boolean {
  if (!VONAGE_APPLICATION_ID) return true;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  try {
    const token = authHeader.slice(7);
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return false;
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    return payload["application_id"] === VONAGE_APPLICATION_ID;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse(null, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const messageType = String(body["message_type"] ?? "text");
  const from = String(body["from"] ?? "unknown").slice(0, 20);
  const to = String(body["to"] ?? "").slice(0, 20);

  // A Messages API envia o texto em `text`; outros tipos enviam `image`, `audio`, etc.
  const text =
    messageType === "text"
      ? String(body["text"] ?? "").slice(0, 1600)
      : `[${messageType}]`;

  if (text) {
    addMessage({ direction: "inbound", source: "application", from, to, text });
  }

  // Vonage espera 200 OK para confirmar o recebimento
  return new NextResponse(null, { status: 200 });
}
