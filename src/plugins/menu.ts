import { generateWAMessageFromContent, proto } from "baileys";
import { config } from "../config/config.js";
import { getCategories, getCategoryMeta, getGroupedCommands } from "../modules/plugin-loader.js";

export const command = {
  name: "menu",
  alias: ["help", "commands"],
  category: "general",
  description: "Infinity Advanced List Menu",
  usage: ".menu",
  execute: async (sock, m) => {
    const { from, pushName } = m;
    const prefix = config.prefix[0];
    const grouped = getGroupedCommands();

    // 1. OTOMATIS DETEKSI SEMUA KATEGORI (Infinity Logic)
    const categories = getCategories().sort((a, b) => a.localeCompare(b));

    // 2. GENERATE INFINITY ADVANCED LIST BUTTONS
    // Every category gets its own 'single_select' button with 'has_multiple_buttons: true'
    const dynamicButtons = categories.map((cat) => {
      const meta = getCategoryMeta(cat);
      const cmds = (grouped.get(cat) ?? []).sort((a, b) =>
        a.command.name.localeCompare(b.command.name)
      );

      return {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: `${meta.emoji} ${meta.displayName.toUpperCase()} MENU`, // Layer 3: Independent Hub
          sections: [
            {
              title: `LIST COMMAND ${meta.displayName.toUpperCase()}`, // Layer 4: Mandiri Category
              rows: cmds.map((c) => ({
                title: `${prefix}${c.command.name}`, // Layer 5: Rows
                description: c.command.description || `Fitur ${c.command.name}`,
                id: `${prefix}${c.command.name}`,
              })),
            },
          ],
          has_multiple_buttons: true, // This is applied to EVERY button dynamically
        }),
      };
    });

    // 3. CONSTRUCT THE INTERACTIVE MESSAGE
    const interactiveMessage = {
      header: {
        title: `🌟 ${config.botName.toUpperCase()} CORE`, // Layer 1
        subtitle: `Uptime: ${Math.floor(process.uptime() / 60)}m`,
        hasMediaAttachment: false,
      },
      body: {
        text: `Halo *${pushName}*!\n\nSistem telah mendeteksi *${categories.length} Kategori Mandiri*.\nSilakan jelajahi fitur kami melalui Pusat Kendali di bawah.`,
      },
      footer: { text: `© ${config.botName} • Infinity Advanced List` },
      nativeFlowMessage: {
        buttons: [
          ...dynamicButtons, // Infinity Advanced Lists
          {
            name: "quick_reply", // Final Interaction Element
            buttonParamsJson: JSON.stringify({
              display_text: "🛡️ PING SYSTEM",
              id: `${prefix}ping`,
            }),
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "📊 STATS INFO",
              id: `${prefix}stats`,
            }),
          },
        ],
        messageParamsJson: JSON.stringify({
          bottom_sheet: {
            // Layer 2
            in_thread_buttons_limit: 0,
            divider_indices: [dynamicButtons.length],
            list_title: "COMMAND CONTROL CENTER",
            button_title: "📂 BUKA PUSAT KENDALI",
          },
        }),
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
      { userJid: sock.user.id }
    );

    await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
  },
};
