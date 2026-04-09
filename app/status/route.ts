import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Vonage Messages API — Status Webhook
 *
 * Vonage chama este endpoint (POST) para notificar mudanças de status de
 * mensagens enviadas (submitted, delivered, rejected, etc.).
 *
 * Configure no painel Vonage:
 *   https://dashboard.nexmo.com → Applications → <app> → Edit
 *   Messages → Status URL: https://<domínio>/status
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

  try {
    // Consome o body para evitar que a conexão fique pendente
    await request.json();
  } catch {
    // Payload inválido não deve impedir o 200 OK; Vonage não reenviará
  }

  // Vonage espera 200 OK para confirmar o recebimento do status
  return new NextResponse(null, { status: 200 });
}
