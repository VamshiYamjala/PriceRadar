// server/tests/providers.fixture.test.js
import { fetchOffer } from '../src/providers/fixture.js';

describe('fixture provider (server/src/providers/fixture.js)', () => {
  test('returns a correctly shaped successful result for an existing fixture offer', async () => {
    const start = Date.now();
    const result = await fetchOffer({
      provider: 'amazon',
      externalProductId: 'AMZ-SGM14-128-SLV',
      isSample: true,
    });
    const elapsed = Date.now() - start;

    // Latency simulation check (between 150ms and 400ms, with slight timer tolerance)
    expect(elapsed).toBeGreaterThanOrEqual(140);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('amazon');
    expect(result.externalProductId).toBe('AMZ-SGM14-128-SLV');
    expect(result.title).toBe('Samsung Galaxy M14 5G (Icy Silver, 128GB)');
    expect(typeof result.priceInPaise).toBe('number');
    expect(result.priceInPaise).toBe(1369900);
    expect(result.currency).toBe('INR');
    expect(result.availability).toBe('in_stock');
    expect(result.productUrl).toBe('https://www.amazon.in/dp/sample-SGM14SLV');
    expect(typeof result.fetchedAt).toBe('string');
    expect(result.isSample).toBe(true);
  });

  test('respects forceFail: true on fixture entry (FLP-NOISE-PULSE2-BLK)', async () => {
    const result = await fetchOffer({
      provider: 'flipkart',
      externalProductId: 'FLP-NOISE-PULSE2-BLK',
      isSample: true,
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Forced fixture failure for testing');
  });

  test('respects forceFail: true passed directly on offer object', async () => {
    const result = await fetchOffer({
      provider: 'flipkart',
      externalProductId: 'FLP-SGM14-128-SLV',
      forceFail: true,
      isSample: true,
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Forced fixture failure for testing');
  });

  test('returns error object when offer or product is not found', async () => {
    const result = await fetchOffer({
      provider: 'flipkart',
      externalProductId: 'NON-EXISTENT-ID',
      isSample: true,
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Offer not found in fixtures');
  });

  test('never throws on null or undefined input', async () => {
    const resultNull = await fetchOffer(null);
    expect(resultNull.success).toBe(false);
    expect(resultNull.errorMessage).toBe('Offer not found in fixtures');

    const resultUndefined = await fetchOffer(undefined);
    expect(resultUndefined.success).toBe(false);
    expect(resultUndefined.errorMessage).toBe('Offer not found in fixtures');
  });
});
