const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/**
 * Custom error class so callers can distinguish API failures from other errors.
 */
export class DictionaryError extends Error {
  constructor(message, { type = 'unknown', status = null } = {}) {
    super(message);
    this.name = 'DictionaryError';
    this.type = type; // 'not-found' | 'network' | 'server' | 'malformed'
    this.status = status;
  }
}

/**
 * Fetch a word's entry from the Free Dictionary API.
 * Returns an array of normalized entry objects.
 * Throws DictionaryError on failure.
 */
export async function fetchWord(word) {
  const query = word?.trim();
  if (!query) {
    throw new DictionaryError('Please enter a word to search.', { type: 'malformed' });
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/${encodeURIComponent(query)}`);
  } catch (err) {
    throw new DictionaryError(
      'Could not reach the dictionary service. Check your connection.',
      { type: 'network' }
    );
  }
}