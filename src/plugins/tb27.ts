import type { WASocket } from "baileys";
import { Command } from "../library/decorators.js";
import { BaseCommand, type MessageData } from "../types/index.js";

@Command({
  name: "tb27",
  category: "general",
  description: "Test 27: sendMessage with NativeFlow (Interactive)",
  usage: ".tb27",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    await sock.sendMessage(
      m.from,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "🤖 *NativeFlow High-Level*", hasMediaAttachment: false },
              body: { text: "Mencoba integrasi paling bersih melalui sendMessage." },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({ display_text: "Ping", id: ".ping" }),
                  },
                ],
              },
            },
          },
        },
        // biome-ignore lint/suspicious/noExplicitAny: Baileys sendMessage type is complex
      } as any,
      { quoted: m }
    );
  }
}
