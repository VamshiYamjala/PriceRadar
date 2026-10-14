/**
 * In-memory store for short-lived Telegram account linking codes (10-minute TTL).
 */

const linkingCodesMap = new Map(); // code -> { userId, expiresAt }

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generates a unique 6-digit or alphanumeric linking code for a user.
 * 
 * @param {string|number} userId - The internal user ID
 * @returns {string} The generated linking code
 */
export function generateCode(userId) {
    if (!userId) {
        throw new Error('userId is required to generate a linking code');
    }

    // Clean up expired codes proactively
    cleanupExpiredCodes();

    // Generate a random 6-digit code or alphanumeric string
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + CODE_TTL_MS;

    linkingCodesMap.set(code, { userId, expiresAt });
    return code;
}

/**
 * Records a Telegram chat ID for a given linking code.
 * 
 * @param {string} code - The linking code entered by the user in Telegram
 * @param {string|number} chatId - The Telegram chat ID
 * @returns {Object} { success: boolean, userId?: string|number, errorMessage?: string }
 */
export function recordChatIdForCode(code, chatId) {
    cleanupExpiredCodes();

    if (!code || !chatId) {
        return { success: false, errorMessage: 'Code and chatId are required.' };
    }

    const entry = linkingCodesMap.get(code.trim());
    if (!entry) {
        return { success: false, errorMessage: 'Invalid or expired linking code.' };
    }

    if (Date.now() > entry.expiresAt) {
        linkingCodesMap.delete(code.trim());
        return { success: false, errorMessage: 'Linking code has expired.' };
    }

    // Store chatId associated with userId (or attach to the record)
    entry.chatId = chatId;
    return { success: true, userId: entry.userId };
}

/**
 * Consumes a linking code, returning the associated userId and chatId if valid.
 * 
 * @param {string} code - The linking code
 * @returns {Object} { success: boolean, userId?: string|number, chatId?: string|number, errorMessage?: string }
 */
export function consumeCode(code) {
    cleanupExpiredCodes();

    if (!code) {
        return { success: false, errorMessage: 'Code is required.' };
    }

    const cleanCode = code.trim();
    const entry = linkingCodesMap.get(cleanCode);

    if (!entry || !entry.chatId) {
        return { success: false, errorMessage: 'No chat ID recorded for this linking code.' };
    }

    if (Date.now() > entry.expiresAt) {
        linkingCodesMap.delete(cleanCode);
        return { success: false, errorMessage: 'Linking code has expired.' };
    }

    linkingCodesMap.delete(cleanCode); // Consume/remove after successful use
    return { success: true, userId: entry.userId, chatId: entry.chatId };
}

/**
 * Helper to remove expired codes from memory.
 */
function cleanupExpiredCodes() {
    const now = Date.now();
    for (const [code, data] of linkingCodesMap.entries()) {
        if (now > data.expiresAt) {
            linkingCodesMap.delete(code);
        }
    }
}
