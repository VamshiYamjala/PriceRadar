import { fetchOffer } from '../src/providers/index.js';

describe('provider dispatcher (server/src/providers/index.js)', () => {
    test('routes sample offers to fixture provider', async () => {
        const offer = {
            provider: 'flipkart',
            externalProductId: 'FLP-SGM14-128-SLV',
            isSample: true
        };
        const result = await fetchOffer(offer);
        expect(result.success).toBe(true);
        expect(result.externalProductId).toBe('FLP-SGM14-128-SLV');
    });

    test('returns graceful error for live providers without config', async () => {
        const offer = {
            provider: 'flipkart',
            externalProductId: 'FLP-SGM14-128-SLV',
            isSample: false
        };
        const result = await fetchOffer(offer);
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('not configured');
    });

    test('handles null or undefined input gracefully', async () => {
        const result = await fetchOffer(null);
        expect(result.success).toBe(false);
        expect(result.errorMessage).toBeDefined();
    });
});
