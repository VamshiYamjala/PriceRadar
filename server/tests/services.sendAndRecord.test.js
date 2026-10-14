import { sendAndRecordNotification } from '../src/services/notifications/sendAndRecordNotification.js';

describe('Notification Wrapper (sendAndRecordNotification)', () => {
    test('returns failure when required parameters are missing', async () => {
        const result = await sendAndRecordNotification({
            alertId: 'alert-1'
        });

        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Missing required parameters');
    });
});
