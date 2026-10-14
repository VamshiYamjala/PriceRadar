import { sendEmail } from '../src/services/notifications/email.js';

describe('Brevo Email Notification Service (server/src/services/notifications/email.js)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('returns graceful error when BREVO_API_KEY is missing', async () => {
        delete process.env.BREVO_API_KEY;
        process.env.EMAIL_FROM = 'test@priceradar.com';

        const result = await sendEmail({
            to: 'user@example.com',
            subject: 'Test Subject',
            textContent: 'Hello'
        });

        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('BREVO_API_KEY');
    });

    test('returns graceful error when EMAIL_FROM is missing', async () => {
        process.env.BREVO_API_KEY = 'mock-api-key';
        delete process.env.EMAIL_FROM;

        const result = await sendEmail({
            to: 'user@example.com',
            subject: 'Test Subject',
            textContent: 'Hello'
        });

        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('EMAIL_FROM');
    });

    test('returns graceful error when required parameters "to" or "subject" are missing', async () => {
        process.env.BREVO_API_KEY = 'mock-api-key';
        process.env.EMAIL_FROM = 'test@priceradar.com';

        const result = await sendEmail({
            to: '',
            subject: ''
        });

        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Missing required parameters');
    });
});
