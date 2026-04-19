type WAMessageKey = {
  remoteJid: string | undefined;
  fromMe: boolean;
  id: string;
  participant: string | undefined;
  remoteJidAlt?: string;
  participantAlt?: string;
  addressingMode?: string;
};

type WAMessage = {
  key: WAMessageKey;
  message: unknown;
  messageTimestamp?: number;
  pushName?: string;
  type?: string;
};

type MessageUpsertData = BaileysEventMap["messages.upsert"];

function resolveMessagePN(message: WAMessage): WAMessage {
  const key = { ...message.key } as WAMessageKey;
  const from = key.remoteJid ?? "";
  const isGroup = from.endsWith("@g.us");
  const pnAlt = isGroup ? key.participantAlt : key.remoteJidAlt;

  if (pnAlt !== undefined && pnAlt !== "") {
    if (isGroup) {
      key.participant = pnAlt;
    } else {
      key.remoteJid = pnAlt;
    }
  }

  return {
    ...message,
    key,
  };
}

function transformMessagesUpsert(data: MessageUpsertData): MessageUpsertData {
  return {
    ...data,
    messages: data.messages.map((msg: WAMessage): WAMessage => resolveMessagePN(msg as WAMessage)),
  };
}

export type { WAMessage, WAMessageKey };
export { resolveMessagePN, transformMessagesUpsert };
