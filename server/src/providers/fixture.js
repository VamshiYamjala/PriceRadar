import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fixtureData = require('./fixtureData.json');

/**
 * Local Fixture Provider for simulating retailer responses.
 */
export async function fetchOffer(offer) {
    // Simulate realistic network latency (150ms - 400ms)
    const delay = Math.floor(Math.random() * (400 - 150 + 1)) + 150;
    await new Promise(resolve => setTimeout(resolve, delay));

    if (!offer || !offer.externalProductId) {
        return {
            success: false,
            errorMessage: 'Offer not found in fixtures'
        };
    }

    // Locate the offer in fixture data
    const items = Array.isArray(fixtureData) ? fixtureData : (fixtureData.offers || fixtureData.products || []);
    const targetOffer = items.find(item => item.externalProductId === offer.externalProductId);

    if (!targetOffer) {
        return {
            success: false,
            errorMessage: 'Offer not found in fixtures'
        };
    }

    // Respect forced failure flags
    if (targetOffer.forceFail || offer.forceFail) {
        return {
            success: false,
            errorMessage: 'Forced fixture failure for testing'
        };
    }

    return {
        success: true,
        provider: targetOffer.provider || offer.provider || 'fixture',
        externalProductId: targetOffer.externalProductId,
        title: targetOffer.title,
        priceInPaise: targetOffer.priceInPaise,
        currency: targetOffer.currency || 'INR',
        availability: targetOffer.availability || 'in_stock',
        productUrl: targetOffer.productUrl,
        fetchedAt: new Date().toISOString(),
        isSample: true
    };
}
