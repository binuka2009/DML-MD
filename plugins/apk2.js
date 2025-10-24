const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "playstore",
    react: '♻',
    alias: ["ps", "app"],
    desc: "Search for an app on the Play Store",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, q, sender, reply, config }) => {
    try {
        if (!q) return reply("❌ Please provide an app name to search.");

        // React while processing ⏳
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const apiUrl = `https://apis.davidcyriltech.my.id/search/playstore?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);

        if (!response.data.success || !response.data.result) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ No results found for the given app name.");
        }

        const app = response.data.result;

        const infoMessage = `
 *PLAY STORE SEARCH RESULT*
╭────❖ 『APP DETAILS』❖────◆
│📱 *Name:* ${app.title}
│📝 *Summary:* ${app.summary}
│📦 *Size:* ${app.size || 'Not available'}
│⭐ *Rating:* ${app.score}
│📥 *Installs:* ${app.installs}
│💰 *Price:* ${app.price}
│🤖 *Android Version:* ${app.androidVersion}
│👨‍💻 *Developer:* ${app.developer}
│📅 *Released:* ${app.released}
│🔄 *Last Updated:* ${app.updated}
│🔗 *Play Store Link:* ${app.url}
╰───────────────────────◆
 *Powered gracefully by YOU *`.trim();

        const msgOptions = {
            quoted: mek,
            contextInfo: { 
                mentionedJid: [m.sender], 
                forwardingScore: 999, 
                isForwarded: true, 
                forwardedNewsletterMessageInfo: { 
                    newsletterJid: '120363387497418815@newsletter', 
                    newsletterName: config.BOT_NAME || "DML-BOT", 
                    serverMessageId: 143 
                }
            }
        };

        if (app.icon) {
            await conn.sendMessage(
                from,
                {
                    image: { url: app.icon },
                    caption: infoMessage
                },
                msgOptions
            );
        } else {
            await conn.sendMessage(from, { text: infoMessage }, msgOptions);
        }

        // React success ✅
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("Play Store Error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("❌ Error searching for the app. Please try again later.");
    }
});
