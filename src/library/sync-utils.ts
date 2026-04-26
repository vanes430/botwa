import { sleep } from "./time-utils.js";

/**
 * Robust markAsRead yang memicu sinkronisasi status 'dibaca' untuk seluruh percakapan.
 * Menggunakan pendekatan batch agar lebih efisien dan tidak menyebabkan delay.
 */
export async function markAsRead(
  sock: WASocket,
  jid: string,
  timestamp: number | undefined,
  isGroup: boolean,
  originalKey: proto.IMessageKey
): Promise<void> {
  try {
    // Pendekatan modern Baileys: readMessages akan menandai seluruh chat
    // sampai ke pesan (key) tersebut sebagai telah dibaca.
    // Ini juga secara otomatis mengirimkan receipt 'read' ke pengirim.
    await sock.readMessages([originalKey]);

    if (isGroup) {
      // Untuk grup, kita tambahkan chatModify agar status unread count di HP benar-bit nol
      await sleep(200);
      await sock.chatModify(
        {
          markRead: true,
          lastMessages: [{ key: originalKey, messageTimestamp: timestamp }],
        },
        jid
      );
    }
  } catch (_error) {
    // Silently catch read errors
  }
}
