import { generateWAMessageFromContent, proto } from "baileys";
import { sessionManager } from "../library/index.js";

export const command = {
  name: "confirm",
  category: "general",
  description: "Mandatory Native Flow Confirmation",
  usage: ".confirm",
  execute: async (sock, m, _args) => {
    const sender = m.sender;
    const from = m.from;
    const session = sessionManager.get(sender);

    // --- 1. HANDLING CLICK (SAAT SESI AKTIF) ---
    if (session !== undefined && session.pluginName === "confirm") {
      const input = m.body.toLowerCase().trim();
      const { timerId, validOptions } = session.data as {
        timerId: NodeJS.Timeout;
        validOptions: string[];
      };

      const cleanup = () => {
        if (timerId) clearTimeout(timerId);
        sessionManager.delete(sender);
      };

      // Cek apakah input berasal dari klik tombol/list yang diizinkan
      if (validOptions.includes(input)) {
        cleanup();
        let statusText = "";
        if (input === "yes") statusText = "✅ *Tindakan Disetujui.*";
        else if (input === "no") statusText = "❌ *Tindakan Ditolak.*";
        else statusText = `✅ *Opsi ${input} Dipilih.*`;

        return await sock.sendMessage(from, {
          text: `${statusText}\nSistem sedang memproses permintaan Anda.`,
        });
      } else {
        // Jika user mengetik manual di luar opsi, kita tutup sesinya agar tidak membingungkan
        cleanup();
        return await sock.sendMessage(from, {
          text: "⚠️ *Sesi Ditutup.* Silakan gunakan tombol yang tersedia atau ulangi perintah untuk memulai kembali.",
        });
      }
    }

    // --- 2. INITIALIZATION (KIRIM NATIVE FLOW) ---
    const timeoutMs = 30000;
    const options = ["yes", "no", "1", "2", "3", "4", "5"];

    const interactiveMessage = {
      body: {
        text: "Silakan pilih salah satu opsi di bawah ini untuk melanjutkan konfirmasi Anda.",
      },
      footer: { text: `Batas waktu respon: ${timeoutMs / 1000} detik` },
      header: {
        title: "🛡️ *SISTEM KONFIRMASI*",
        hasMediaAttachment: false,
      },
      nativeFlowMessage: {
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: "✅ SETUJU", id: "yes" }),
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: "❌ BATALKAN", id: "no" }),
          },
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "🔢 PILIHAN LAINNYA",
              sections: [
                {
                  title: "OPSI TAMBAHAN",
                  rows: [
                    { title: "Opsi 1", id: "1" },
                    { title: "Opsi 2", id: "2" },
                    { title: "Opsi 3", id: "3" },
                    { title: "Opsi 4", id: "4" },
                    { title: "Opsi 5", id: "5" },
                  ],
                },
              ],
            }),
          },
        ],
        messageParamsJson: JSON.stringify({ messageVersion: 1 }),
      },
    };

    const msg = generateWAMessageFromContent(
      from,
      {
        viewOnceMessageV2: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage),
          },
        },
      },
      { userJid: sock.user.id, quoted: m }
    );

    await sock.relayMessage(from, msg.message, { messageId: msg.key.id });

    // Timer Timeout Aktif
    const timerId = setTimeout(async () => {
      if (sessionManager.has(sender)) {
        sessionManager.delete(sender);
        await sock.sendMessage(from, {
          text: "⌛ *Waktu Habis.* Anda tidak memilih opsi apa pun.",
          quoted: msg,
        });
      }
    }, timeoutMs);

    sessionManager.create(
      sender,
      "confirm",
      "awaiting",
      { timerId, validOptions: options },
      timeoutMs
    );
  },
};
