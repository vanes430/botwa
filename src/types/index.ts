import type { proto, WASocket } from "baileys";

export interface MessageData {
  key: proto.IMessageKey;
  message: proto.IMessage | null | undefined;
  body: string;
  from: string;
  sender: string;
  isGroup: boolean;
  timestamp: number;
  pushName: string;
  quoted?: {
    key: proto.IMessageKey;
    message: proto.IMessage | null | undefined;
    sender: string;
    body: string;
  };
  media?: {
    type: "image" | "video" | "audio" | "sticker" | "document";
    mimetype: string;
    caption?: string;
  };
}

export interface PluginCommand {
  name: string;
  alias?: string[];
  category: string;
  description: string;
  usage?: string;
  isOwner?: boolean;
  isGroup?: boolean;
  isAdmin?: boolean;
  isBotAdmin?: boolean;
  execute: (sock: WASocket, m: MessageData, args: string[]) => Promise<void> | void;
}

export interface CooldownMap {
  get(key: string): number | undefined;
  set(key: string, value: number): void;
  delete(key: string): boolean;
  has(key: string): boolean;
}
