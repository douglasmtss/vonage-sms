"use client";

import { useEffect, useRef, useState } from "react";

interface SmsMessage {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  text: string;
  timestamp: number;
}

const MY_NUMBER = process.env.NEXT_PUBLIC_FROM_NUMBER;

export default function HomePage() {
  const [toNumber, setToNumber] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data: SmsMessage[] = await res.json();
          setMessages(data);
        }
      } catch {
        // ignore network errors silently
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmedText = text.trim();
    const trimmedTo = toNumber.trim();

    if (!trimmedTo) {
      setError("Informe o número de destino.");
      return;
    }
    if (!trimmedText) {
      setError("Digite uma mensagem.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET ?? ""}`,
        },
        body: JSON.stringify({ to: trimmedTo, text: trimmedText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar mensagem.");
      } else {
        setText("");
        // Immediately fetch updated messages
        const updated = await fetch("/api/messages");
        if (updated.ok) setMessages(await updated.json());
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="flex flex-col items-center min-h-screen py-10 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Vonage SMS</h1>
          <p className="text-sm text-gray-500 mt-1">
            Seu número:{" "}
            <span className="font-mono font-semibold text-gray-700">
              +{MY_NUMBER}
            </span>
          </p>
        </div>

        {/* Destination number input */}
        <div className="bg-white rounded-2xl shadow p-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Número de destino
          </label>
          <input
            type="tel"
            placeholder="Ex: 5511999999999"
            value={toNumber}
            onChange={(e) => setToNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Formato DDI + DDD + número (sem espaços ou +). Ex: 5511999999999
          </p>
        </div>

        {/* Message box */}
        <div className="bg-white rounded-2xl shadow flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600">
              Caixa de mensagens
            </h2>
          </div>

          {/* Messages list */}
          <div className="flex flex-col gap-3 p-4 h-96 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                Nenhuma mensagem ainda. As mensagens recebidas aparecerão aqui.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-xs ${
                    msg.direction === "outbound" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      msg.direction === "outbound"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 px-1">
                    {msg.direction === "inbound"
                      ? `De: +${msg.from} · `
                      : `Para: +${msg.to} · `}
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-t border-red-100">
              {error}
            </div>
          )}

          {/* Compose area */}
          <div className="flex items-end gap-2 p-3 border-t border-gray-100">
            <textarea
              rows={2}
              placeholder="Digite sua mensagem (Enter para enviar)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors h-[60px]"
            >
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>

        {/* Webhook info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-1">Configuração do Webhook</p>
          <p>
            Configure no{" "}
            <a
              href="https://dashboard.nexmo.com"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              painel Vonage
            </a>{" "}
            o URL de webhook de entrada para:
          </p>
          <code className="block mt-1 font-mono bg-yellow-100 px-2 py-1 rounded text-xs break-all">
            https://&lt;seu-dominio&gt;/api/webhook
          </code>
          <p className="mt-1 text-xs text-yellow-700">
            Método: POST · Em desenvolvimento, use{" "}
            <span className="font-mono">ngrok http 3000</span> para expor o
            servidor local.
          </p>
        </div>
      </div>
    </main>
  );
}
