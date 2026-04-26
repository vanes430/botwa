import { generateWAMessageFromContent, proto } from "baileys";

@Command({
  name: "tsbtn",
  alias: ["testbtn", "button"],
  category: "tools",
  description: "Test interactive message with native flow buttons",
  usage: ".tsbtn",
})
export default class extends BaseCommand {
  public async execute(sock: WASocket, m: MessageData): Promise<void> {
    const { from } = m;

    const interactiveMessage = {
      header: {
        title: "Ini judul",
        subtitle: "Ini subjudul",
        hasMediaAttachment: false,
      },
      body: {
        text: "Ini body",
      },
      footer: {
        text: "Ini footer",
      },
      nativeFlowMessage: {
        buttons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Judul#1",
              sections: [
                {
                  title: "Title",
                  highlight_label: "Label",
                  rows: [
                    {
                      title: "Title #1",
                      description: "Description #1",
                      id: "id#1",
                    },
                    {
                      title: "Title #2",
                      description: "Description #2",
                      id: "id#2",
                    },
                    {
                      title: "Title #3",
                      description: "Description #3",
                      id: "id#3",
                    },
                  ],
                },
              ],
              has_multiple_buttons: true,
            }),
          },
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Judul#2",
              sections: [
                {
                  title: "Title",
                  highlight_label: "Label",
                  rows: [
                    {
                      title: "Title #1",
                      description: "Description #1",
                      id: "id#1",
                    },
                    {
                      title: "Title #2",
                      description: "Description #2",
                      id: "id#2",
                    },
                    {
                      title: "Title #3",
                      description: "Description #3",
                      id: "id#3",
                    },
                  ],
                },
              ],
              has_multiple_buttons: true,
            }),
          },
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Judul#2",
              sections: [
                {
                  title: "Title",
                  highlight_label: "Label",
                  rows: [
                    {
                      title: "Title #1",
                      description: "Description #1",
                      id: "id#1",
                    },
                    {
                      title: "Title #2",
                      description: "Description #2",
                      id: "id#2",
                    },
                    {
                      title: "Title #3",
                      description: "Description #3",
                      id: "id#3",
                    },
                  ],
                },
              ],
              has_multiple_buttons: true,
            }),
          },
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Judul#3",
              sections: [
                {
                  title: "Title",
                  highlight_label: "Label",
                  rows: [
                    {
                      title: "Title #1",
                      description: "Description #1",
                      id: "id#1",
                    },
                    {
                      title: "Title #2",
                      description: "Description #2",
                      id: "id#2",
                    },
                    {
                      title: "Title #3",
                      description: "Description #3",
                      id: "id#3",
                    },
                  ],
                },
              ],
              has_multiple_buttons: true,
            }),
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "gtw",
              id: "gtw",
            }),
          },
        ],
        messageParamsJson: JSON.stringify({
          bottom_sheet: {
            in_thread_buttons_limit: 1,
            divider_indices: [1, 2, 3, 4],
            list_title: "Judul List",
            button_title: "Judul Beton",
          },
        }),
      },
    };

    const msg = generateWAMessageFromContent(
      from,
      {
        viewOnceMessageV2: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
            interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage),
          },
        },
      },
      { userJid: sock.user?.id }
    );

    await sock.relayMessage(from, msg.message!, {
      messageId: msg.key.id!,
    });
  }
}
