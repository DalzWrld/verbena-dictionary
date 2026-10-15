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