/**
 * In-memory message store.
 *
 * NOTE: This works perfectly in development.
 * On Vercel (serverless), messages persist only within the same
 * function instance. For production persistence, replace this with
 * Vercel KV (https://vercel.com/storage/kv) or any database.
 */

export type MessageDirection = "inbound" | "outbound";

export interface SmsMessage {
  id: string;
  direction: MessageDirection;
  from: string;
  to: string;
  text: string;
  timestamp: number;
}

// Module-level singleton — survives across requests in the same server instance
const messages: SmsMessage[] = [];

export function addMessage(msg: Omit<SmsMessage, "id" | "timestamp">): SmsMessage {
  const entry: SmsMessage = {
    ...msg,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  messages.push(entry);
  // Keep at most 200 messages in memory
  if (messages.length > 200) messages.splice(0, messages.length - 200);
  return entry;
}

export function getMessages(): SmsMessage[] {
  return [...messages].sort((a, b) => a.timestamp - b.timestamp);
}
