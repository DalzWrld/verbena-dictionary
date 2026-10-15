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

  if (!response.ok) {
    if (response.status === 404) {
      throw new DictionaryError(`"${query}" wasn't found. Try another word.`, {
        type: 'not-found',
        status: 404,
      });
    }
    throw new DictionaryError(`The dictionary service returned an error (${response.status}).`, {
      type: 'server',
      status: response.status,
    });
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new DictionaryError('The dictionary service returned an unreadable response.', {
      type: 'malformed',
    });
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new DictionaryError(`No definitions found for "${query}".`, { type: 'not-found' });
  }

  return data.map(normalizeEntry);
}

/**
 * Normalize a raw API entry into a stable shape our UI can rely on.
 * This is the contract: everything upstream sees this shape, never the raw payload.
 */
function normalizeEntry(rawEntry) {
  const phonetics = Array.isArray(rawEntry.phonetics) ? rawEntry.phonetics : [];

  // Prefer the top-level `phonetic` string; fall back to the first phonetic with text.
  const phoneticText =
    rawEntry.phonetic ||
    phonetics.find((p) => p.text && p.text.trim())?.text ||
    '';

  // First phonetic with a non-empty audio URL, normalized to https://
  const rawAudio = phonetics.find((p) => p.audio && p.audio.trim())?.audio || '';
  const audioUrl = normalizeAudioUrl(rawAudio);

  const meanings = Array.isArray(rawEntry.meanings) ? rawEntry.meanings : [];

  return {
    word: rawEntry.word || '',
    phonetic: phoneticText,
    audioUrl,
    meanings: meanings.map(normalizeMeaning),
    sourceUrls: Array.isArray(rawEntry.sourceUrls) ? rawEntry.sourceUrls : [],
  };
}

function normalizeMeaning(rawMeaning) {
  const definitions = Array.isArray(rawMeaning.definitions) ? rawMeaning.definitions : [];
  return {
    partOfSpeech: rawMeaning.partOfSpeech || 'unknown',
    definitions: definitions
      .filter((d) => d.definition && d.definition.trim())
      .slice(0, 5) // cap at 5 per meaning for readable UI
      .map((d) => ({
        definition: d.definition.trim(),
        example: d.example?.trim() || '',
      })),
    synonyms: dedupe((rawMeaning.synonyms || []).map((s) => s.trim()).filter(Boolean)).slice(0, 8),
    antonyms: dedupe((rawMeaning.antonyms || []).map((a) => a.trim()).filter(Boolean)).slice(0, 8),
  };
}

/**
 * The API sometimes returns protocol-relative URLs like "//ssl.gstatic.com/...".
 * Normalize them to https:// so <audio> doesn't complain.
 */
function normalizeAudioUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

/**
 * Case-insensitive dedupe, preserving first-seen casing.
 */
function dedupe(arr) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}