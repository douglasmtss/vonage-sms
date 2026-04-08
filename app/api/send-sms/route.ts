import { NextRequest, NextResponse } from "next/server";
import { Vonage } from "@vonage/server-sdk";
import { addMessage } from "@/lib/store";

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY ?? "",
  apiSecret: process.env.VONAGE_API_SECRET ?? "",
});

const FROM_NUMBER = process.env.VONAGE_FROM_NUMBER ?? "5521960131442";
const API_SECRET = process.env.API_SECRET;

// Max SMS length: 10 concatenated parts (10 × 160 chars)
const MAX_TEXT_LENGTH = 1600;

export async function POST(request: NextRequest) {
  // Bearer token authentication
  if (!API_SECRET) {
    return NextResponse.json(
      { error: "Servidor não configurado." },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${API_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: { to?: unknown; text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { to, text } = body;

  if (typeof to !== "string" || typeof text !== "string" || !to || !text) {
    return NextResponse.json(
      { error: "Os campos 'to' e 'text' são obrigatórios." },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Mensagem muito longa (máximo ${MAX_TEXT_LENGTH} caracteres).` },
      { status: 400 }
    );
  }

  // Sanitize: digits only, strip leading +
  const sanitizedTo = to.replace(/\D/g, "");
  if (sanitizedTo.length < 10 || sanitizedTo.length > 15) {
    return NextResponse.json(
      { error: "Número de destino inválido." },
      { status: 400 }
    );
  }

  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
    return NextResponse.json(
      { error: "Credenciais Vonage não configuradas no servidor." },
      { status: 500 }
    );
  }

  try {
    const response = await vonage.sms.send({
      to: sanitizedTo,
      from: FROM_NUMBER,
      text,
    });

    const messageStatus = response.messages?.[0];

    if (messageStatus?.status !== "0") {
      return NextResponse.json(
        { error: `Vonage retornou erro: ${messageStatus?.errorText ?? "desconhecido"}` },
        { status: 502 }
      );
    }

    addMessage({
      direction: "outbound",
      from: FROM_NUMBER,
      to: sanitizedTo,
      text,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Do not expose internal SDK error details to the client
    return NextResponse.json(
      { error: "Falha ao enviar mensagem. Tente novamente." },
      { status: 500 }
    );
  }
}
