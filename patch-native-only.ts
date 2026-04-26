import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_PATH = join(process.cwd(), 'node_modules/baileys');

function patchMessagesSend() {
    const filePath = join(BASE_PATH, 'lib/Socket/messages-send.js');
    if (!existsSync(filePath)) return console.log('❌ File messages-send.js tidak ditemukan');

    let content = readFileSync(filePath, 'utf8');

    // Bersihkan patch lama
    content = content.replace(/\/\/ --- PATCH NATIVE FLOW ---[\s\S]*?\/\/ --- END PATCH ---/g, '');

    // Cari lokasi setelah additionalNodes push
    const targetPattern = /if \(additionalNodes && additionalNodes\.length > 0\) \{[\s\S]*?stanza\.content\.push\(\.\.\.additionalNodes\);[\s\S]*?\}/;
    const match = content.match(targetPattern);

    if (match) {
        const injection = `
            // --- PATCH NATIVE FLOW ---
            try {
                const contentMsg = normalizeMessageContent(message);
                const contentType = getContentType(contentMsg);
                
                if (contentType === 'interactiveMessage' || 
                    contentMsg?.viewOnceMessage?.message?.interactiveMessage || 
                    contentMsg?.viewOnceMessageV2?.message?.interactiveMessage ||
                    contentMsg?.viewOnceMessageV2Extension?.message?.interactiveMessage) {
                    
                    const bizNode = { 
                        tag: 'biz', 
                        attrs: {},
                        content: [{
                            tag: 'interactive',
                            attrs: {
                                type: 'native_flow',
                                v: '1'
                            },
                            content: [{
                                tag: 'native_flow',
                                attrs: { v: '9', name: 'mixed' }
                            }]
                        }]
                    };
                    stanza.content.push(bizNode);
                }
            } catch (e) {}
            // --- END PATCH ---
        `;
        
        content = content.replace(match[0], match[0] + injection);
        writeFileSync(filePath, content);
        console.log('🚀 Berhasil patch Native Flow (Mixed Mode) di messages-send.js');
    }
}

patchMessagesSend();
