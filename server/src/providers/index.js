import { fetchOffer as fetchFixtureOffer } from './fixture.js';

/**
 * Main provider dispatcher function.
 * Routes offers to the appropriate provider (e.g., fixture provider for samples).
 * 
 * @param {Object} offer - The offer object to fetch/poll.
 * @returns {Promise<Object>} NormalizedResult object.
 */
export async function fetchOffer(offer) {
    if (!offer) {
        return {
            success: false,
            errorMessage: 'Invalid or null offer provided to dispatcher'
        };
    }

    // Route sample offers or explicit fixture provider requests to the local fixture provider
    if (offer.isSample || offer.provider === 'fixture') {
        return await fetchFixtureOffer(offer);
    }

    // Default fallback / block for live domains without approved active API keys
    return {
        success: false,
        provider: offer.provider || 'unknown',
        externalProductId: offer.externalProductId || 'unknown',
        errorMessage: `Live provider '${offer.provider}' is not configured or requires live API credentials.`
    };
}
