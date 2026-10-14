import { sendEmail } from './email.js';
import { sendMessage } from './telegram.js';
import { NotificationEvent } from '../../models/NotificationEvent.js';

const RETRY_DELAY_MS = 3000;

/**
 * Sends a notification via email or telegram with retry logic and database deduplication.
 * 
 * @param {Object} options - Notification options
 * @param {string} options.alertId - Alert ID
 * @param {string} options.offerId - Offer ID
 * @param {number} options.priceInPaise - Price in paise
 * @param {string} options.triggeredAtHour - Triggered hour string (e.g. YYYY-MM-DD-HH)
 * @param {string} options.channel - 'email' or 'telegram'
 * @param {string} options.recipient - Email address or Telegram chat ID
 * @param {string} [options.subject] - Subject for email
 * @param {string} options.textContent - Plain text content
 * @param {string} [options.htmlContent] - HTML content for email
 * @returns {Promise<Object>} Result object
 */
export async function sendAndRecordNotification({
    alertId,
    offerId,
    priceInPaise,
    triggeredAtHour,
    channel,
    recipient,
    subject,
    textContent,
    htmlContent
}) {
    if (!alertId || !offerId || priceInPaise === undefined || !triggeredAtHour || !channel || !recipient) {
        return {
            success: false,
            errorMessage: 'Missing required parameters for sendAndRecordNotification.'
        };
    }

    const deduplicationKey = `${alertId}:${offerId}:${priceInPaise}:${triggeredAtHour}`;

    async function executeSend() {
        if (channel === 'email') {
            return await sendEmail({
                to: recipient,
                subject: subject || 'PriceRadar Alert',
                textContent,
                htmlContent
            });
        } else if (channel === 'telegram') {
            return await sendMessage({
                chatId: recipient,
                text: textContent
            });
        } else {
            return { success: false, errorMessage: `Unknown notification channel: ${channel}` };
        }
    }

    // Attempt 1
    let sendResult = await executeSend();
    let attempts = 1;

    // If failed, wait 3 seconds and retry once
    if (!sendResult.success) {
        attempts = 2;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        sendResult = await executeSend();
    }

    const status = sendResult.success ? 'sent' : 'failed';

    try {
        const eventRecord = new NotificationEvent({
            deduplicationKey,
            alertId,
            offerId,
            priceInPaise,
            triggeredAtHour,
            channel,
            recipient,
            status,
            providerMessageId: sendResult.providerMessageId || null,
            errorMessage: sendResult.errorMessage || null,
            attempts
        });

        await eventRecord.save();

        return {
            success: sendResult.success,
            skipped: false,
            providerMessageId: sendResult.providerMessageId,
            errorMessage: sendResult.errorMessage,
            attempts
        };
    } catch (dbError) {
        // Handle MongoDB duplicate key error (code 11000) gracefully
        if (dbError.code === 11000) {
            const existingEvent = await NotificationEvent.findOne({ deduplicationKey });
            return {
                success: true,
                skipped: true,
                reason: 'Duplicate notification deduplicated',
                existingEvent
            };
        }

        return {
            success: false,
            errorMessage: `Database error recording notification event: ${dbError.message}`
        };
    }
}
