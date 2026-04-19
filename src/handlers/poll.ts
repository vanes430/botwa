import { type BaileysEventMap, decryptPollVote, type WASocket } from "baileys";
import { functions } from "../library/index.js";
import { handleMessage } from "../modules/index.js";
import type { MessageData } from "../types/index.js";

// Store sederhana untuk menyimpan encryption key polling (Memory based)
// Kunci utama: messageId
export const pollStore = new Map<
  string,
  {
    encKey: Uint8Array;
    name: string;
    options: string[];
    creatorJid: string;
  }
>();

/**
 * Menangani event messages.update khusus untuk interaksi Polling
 */
export async function setupPollHandler(sock: WASocket): Promise<void> {
  sock.ev.on(
    "messages.update",
    async (updates: BaileysEventMap["messages.update"]): Promise<void> => {
      for (const update of updates) {
        if (!update.pollUpdates || !update.key?.id) continue;

        const storedPoll = pollStore.get(update.key.id);
        if (!storedPoll) continue;

        for (const pollUpdate of update.pollUpdates) {
          try {
            if (!pollUpdate.vote) continue;

            // Dekripsi vote menggunakan key yang disimpan
            const vote = decryptPollVote(
              {
                encPayload: pollUpdate.vote.encPayload!,
                encIv: pollUpdate.vote.encIv!,
              },
              {
                pollCreatorJid: storedPoll.creatorJid,
                pollMsgId: update.key.id,
                pollEncKey: storedPoll.encKey,
                voterJid: update.key.participant || update.key.remoteJid!,
              }
            );

            if (!vote?.selectedOptions) continue;

            // Ambil indeks opsi yang dipilih
            // polling kita diset selectableCount: 1, jadi ambil yang pertama
            const selectedOptionIndex = vote.selectedOptions[0];
            if (selectedOptionIndex === undefined) continue;

            const selectedOptionName = storedPoll.options[selectedOptionIndex];
            if (!selectedOptionName) continue;

            const from = update.key.remoteJid ?? "";
            const isGroup = functions.isGroup(from);
            const sender = update.key.participant || from;

            logger.info(`[Poll Vote] ${sender} selected: ${selectedOptionName}`);

            const messageData: MessageData = {
              key: update.key,
              originalKey: update.key,
              message: { conversation: selectedOptionName },
              body: selectedOptionName,
              from,
              sender,
              isGroup,
              timestamp: Date.now() / 1000,
              pushName: "User",
            };

            await handleMessage(sock, messageData);
          } catch (error) {
            logger.error("[Poll Handler] Failed to decrypt vote", { error: String(error) });
          }
        }
      }
    }
  );
}
