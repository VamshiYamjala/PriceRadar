import axios from 'axios';

/**
 * Send a transactional email using Brevo's API.
 * 
 * @param {Object} options - Email parameters
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.htmlContent] - HTML body of the email
 * @param {string} [options.textContent] - Plain text body of the email
 * @returns {Promise<Object>} { success: true, providerMessageId: '...' } or { success: false, errorMessage: '...' }
 */
export async function sendEmail({ to, subject, htmlContent, textContent }) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_FROM;

    if (!apiKey) {
        return {
            success: false,
            errorMessage: 'BREVO_API_KEY environment variable is missing.'
        };
    }

    if (!senderEmail) {
        return {
            success: false,
            errorMessage: 'EMAIL_FROM environment variable is missing.'
        };
    }

    if (!to || !subject) {
        return {
            success: false,
            errorMessage: 'Missing required parameters: "to" and "subject" are required.'
        };
    }

    try {
        const payload = {
            sender: { email: senderEmail },
            to: [{ email: to }],
            subject: subject
        };

        if (htmlContent) {
            payload.htmlContent = htmlContent;
        }
        if (textContent) {
            payload.textContent = textContent;
        }

        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            payload,
            {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10s timeout protection
            }
        );

        const providerMessageId = response.data?.messageId || 'unknown-id';

        return {
            success: true,
            providerMessageId
        };
    } catch (error) {
        let errorMessage = 'Unknown error occurred while sending email';

        if (error.response) {
            // Brevo responded with 4xx / 5xx error
            const status = error.response.status;
            const message = error.response.data?.message || JSON.stringify(error.response.data);
            errorMessage = `Brevo API error (${status}): ${message}`;
        } else if (error.request) {
            // Network error / timeout
            errorMessage = `Network error connecting to Brevo API: ${error.message}`;
        } else {
            errorMessage = error.message;
        }

        return {
            success: false,
            errorMessage
        };
    }
}
