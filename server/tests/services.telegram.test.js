import { generateCode, recordChatIdForCode, consumeCode } from '../src/services/notifications/telegramLinkCodes.js';
import { sendMessage } from '../src/services/notifications/telegram.js';

describe('Telegram Linking Codes Service', () => {
    test('generates a valid code and successfully records/consumes chat ID', () => {
        const userId = 'user-123';
        const code = generateCode(userId);

        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);

        // Record chat ID for the code
        const recordResult = recordChatIdForCode(code, 'chat-987');
        expect(recordResult.success).toBe(true);
        expect(recordResult.userId).toBe(userId);

        // Consume the code
        const consumeResult = consumeCode(code);
        expect(consumeResult.success).toBe(true);
        expect(consumeResult.userId).toBe(userId);
        expect(consumeResult.chatId).toBe('chat-987');

        // Subsequent consumption should fail (one-time use)
        const secondConsume = consumeCode(code);
        expect(secondConsume.success).toBe(false);
    });

    test('fails on invalid or expired code', () => {
        const recordResult = recordChatIdForCode('999999', 'chat-987');
        expect(recordResult.success).toBe(false);

        const consumeResult = consumeCode('999999');
        expect(consumeResult.success).toBe(false);
    });
});

describe('Telegram Notification Service', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('returns graceful error when TELEGRAM_BOT_TOKEN is missing', async () => {
        delete process.env.TELEGRAM_BOT_TOKEN;

        const result = await sendMessage({
            chatId: '12345',
            text: 'Hello Telegram'
        });

        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('TELEGRAM_BOT_TOKEN');
    });

    test('returns graceful error when chatId or text is missing', async () => {
        process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token';

        const result = await sendMessage({
            chatId: '',
            text: ''
        });

        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Missing required parameters');
    });
});
