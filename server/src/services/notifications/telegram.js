import axios from 'axios';
import { recordChatIdForCode } from './telegramLinkCodes.js';

let pollingIntervalId = null;
let lastUpdateId = 0;

/**
 * Sends a message via Telegram Bot API.
 * 
 * @param {Object} options - Message options
 * @param {string|number} options.chatId - Telegram chat ID
 * @param {string} options.text - Message text
 * @returns {Promise<Object>} { success: true, providerMessageId: '...' } or { success: false, errorMessage: '...' }
 */
export async function sendMessage({ chatId, text }) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        return {
            success: false,
            errorMessage: 'TELEGRAM_BOT_TOKEN environment variable is missing.'
        };
    }

    if (!chatId || !text) {
        return {
            success: false,
            errorMessage: 'Missing required parameters: "chatId" and "text" are required.'
        };
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        }, {
            timeout: 10000
        });

        const providerMessageId = response.data?.result?.message_id?.toString() || 'unknown-id';

        return {
            success: true,
            providerMessageId
        };
    } catch (error) {
        let errorMessage = 'Unknown error occurred while sending Telegram message';

        if (error.response) {
            const status = error.response.status;
            const description = error.response.data?.description || JSON.stringify(error.response.data);
            errorMessage = `Telegram API error (${status}): ${description}`;
        } else if (error.request) {
            errorMessage = `Network error connecting to Telegram API: ${error.message}`;
        } else {
            errorMessage = error.message;
        }

        return {
            success: false,
            errorMessage
        };
    }
}

/**
 * Starts a lightweight long-polling loop to check Telegram updates every 2 seconds.
 * Listens for `/start <code>` commands to link accounts.
 */
export function startLinkListener() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        console.warn('?? TELEGRAM_BOT_TOKEN not configured. Telegram link listener disabled.');
        return;
    }

    if (pollingIntervalId) {
        // Already running
        return;
    }

    console.log('?? Starting Telegram link listener polling loop (every 2s)...');

    pollingIntervalId = setInterval(async () => {
        try {
            const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=1`;
            const response = await axios.get(url, { timeout: 4000 });

            if (response.data && response.data.ok && Array.isArray(response.data.result)) {
                for (const update of response.data.result) {
                    lastUpdateId = Math.max(lastUpdateId, update.update_id);

                    const message = update.message;
                    if (message && message.text && message.chat && message.chat.id) {
                        const text = message.text.trim();
                        const chatId = message.chat.id;

                        // Check if message starts with /start followed by a code
                        if (text.startsWith('/start')) {
                            const parts = text.split(/\s+/);
                            if (parts.length > 1) {
                                const code = parts[1];
                                const linkResult = recordChatIdForCode(code, chatId);

                                if (linkResult.success) {
                                    await sendMessage({
                                        chatId,
                                        text: '? <b>Success!</b> Your Telegram account has been successfully linked to PriceRadar.'
                                    });
                                } else {
                                    await sendMessage({
                                        chatId,
                                        text: `? <b>Linking Failed:</b> ${linkResult.errorMessage}`
                                    });
                                }
                            } else {
                                await sendMessage({
                                    chatId,
                                    text: '?? Welcome to PriceRadar! Please use your account linking code from the web dashboard (e.g., <code>/start YOUR_CODE</code>).'
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            // Suppress minor network hiccups in polling loop, log cleanly if needed
            if (error.response) {
                console.error(`Telegram polling API error (${error.response.status}):`, error.response.data?.description || error.message);
            } else {
                // Network timeouts on long-poll are expected and safe to ignore
            }
        }
    }, 2000);
}

/**
 * Stops the Telegram polling loop.
 */
export function stopLinkListener() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
        console.log('?? Telegram link listener stopped.');
    }
}
