/**
 * Group Events Handler for WhatsApp Bot
 * @description Handles group join/leave and admin promotion/demotion events
 * @author DML-MD
 * @credits Please give credit if using this code in your project
 */

const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

// Configuration constants
const DEFAULT_PROFILE_PICTURES = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png'
];

const EVENT_TYPES = {
    ADD: 'add',
    REMOVE: 'remove',
    PROMOTE: 'promote',
    DEMOTE: 'demote'
};

/**
 * Generate context info for messages
 * @param {string} senderJid 
 * @returns {object} Context info object
 */
const generateContextInfo = (senderJid) => ({
    mentionedJid: [senderJid],
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363403958418756@newsletter',
        newsletterName: 'DML',
        serverMessageId: 143,
    },
});

/**
 * Get a random default profile picture
 * @returns {string} URL of a random profile picture
 */
const getRandomProfilePicture = () => 
    DEFAULT_PROFILE_PICTURES[Math.floor(Math.random() * DEFAULT_PROFILE_PICTURES.length)];

/**
 * Format timestamp for messages
 * @returns {string} Formatted timestamp
 */
const getFormattedTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
};

/**
 * Handle group events
 * @param {object} conn - WhatsApp connection object
 * @param {object} update - Group update event
 */
const handleGroupEvents = async (conn, update) => {
    try {
        // Validate if this is a group event
        if (!isJidGroup(update.id)) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;
        const groupName = metadata.subject;
        const groupDescription = metadata.desc || "No description available";
        const memberCount = metadata.participants.length;

        // Try to get group profile picture or use default
        let groupPicture;
        try {
            groupPicture = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            groupPicture = getRandomProfilePicture();
        }

        const timestamp = getFormattedTimestamp();

        // Process each participant in the event
        for (const participantJid of participants) {
            const participantNumber = participantJid.split("@")[0];
            const actorNumber = update.author?.split("@")[0] || "System";

            switch (update.action) {
                case EVENT_TYPES.ADD:
                    if (config.WELCOME === "true") {
                        await sendWelcomeMessage();
                    }
                    break;

                case EVENT_TYPES.REMOVE:
                    if (config.WELCOME === "true") {
                        await sendGoodbyeMessage();
                    }
                    break;

                case EVENT_TYPES.PROMOTE:
                    if (config.ADMIN_EVENTS === "true") {
                        await sendPromotionMessage();
                    }
                    break;

                case EVENT_TYPES.DEMOTE:
                    if (config.ADMIN_EVENTS === "true") {
                        await sendDemotionMessage();
                    }
                    break;
            }

            async function sendWelcomeMessage() {
                const welcomeText = 
                    ðŸ‘‹ Welcome @${participantNumber} to ${groupName}!\n\n +
                    ðŸ“Œ You're member #${memberCount}\n +
                    â° Joined: ${timestamp}\n\n +
                    ðŸ“ Group Description:\n${groupDescription}\n\n +
                    ðŸ¤– Powered by ${config.BOT_NAME};

                await conn.sendMessage(update.id, {
                    image: { url: groupPicture },
                    caption: welcomeText,
                    mentions: [participantJid],
                    contextInfo: generateContextInfo(participantJid)
                });
            }

            async function sendGoodbyeMessage() {
                const goodbyeText = 
                    ðŸ˜¢ Goodbye @${participantNumber}\n\n +
                    â° Left: ${timestamp}\n +
                    ðŸ‘¥ Members remaining: ${memberCount}\n\n +
                    ðŸ¤– Powered by ${config.BOT_NAME};

                await conn.sendMessage(update.id, {
                    image: { url: groupPicture },
                    caption: goodbyeText,
                    mentions: [participantJid],
                    contextInfo: generateContextInfo(participantJid)
                });
            }

            async function sendPromotionMessage() {
                const promotionText = 
                    ðŸŽ‰ Admin Promotion ðŸŽ‰\n\n +
                    ðŸ‘¤ @${actorNumber} promoted @${participantNumber}\n +
                    â° Time: ${timestamp}\n +
                    ðŸ’¬ Group: ${groupName}\n\n +
                    ðŸ¤– Powered by ${config.BOT_NAME};

                await conn.sendMessage(update.id, {
                    text: promotionText,
                    mentions: [update.author, participantJid],
                    contextInfo: generateContextInfo(update.author)
                });
            }

            async function sendDemotionMessage() {
                const demotionText = 
                    âš ï¸ Admin Demotion âš ï¸\n\n +
                    ðŸ‘¤ @${actorNumber} demoted @${participantNumber}\n +
                    â° Time: ${timestamp}\n +
                    ðŸ’¬ Group: ${groupName}\n\n +
                    ðŸ¤– Powered by ${config.BOT_NAME};

                await conn.sendMessage(update.id, {
                    text: demotionText,
                    mentions: [update.author, participantJid],
                    contextInfo: generateContextInfo(update.author)
                });
            }
        }
    } catch (error) {
        console.error('âŒ Group event handler error:', error);
        // Optionally log errors to a file or monitoring service
    }
};

module.exports = handleGroupEvents;
