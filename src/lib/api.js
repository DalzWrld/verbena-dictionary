// ============================================================
// Provider configuration
// ------------------------------------------------------------
// Toggle the active provider without touching any other file.
// Add new providers by extending PROVIDERS below.
// ============================================================

const ACTIVE_PROVIDER = 'cdn'; // 'dictionaryapi' | 'cdn' | 'wordnik'

const PROVIDERS = {
  // Free Dictionary API — keyless, but historically unreliable
  dictionaryapi: {
    url: (word) =>
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    parse: (raw, word) => {
      // Returns an array of raw entries
      if (!Array.isArray(raw) || raw.length === 0) {
        throw new DictionaryError(`No definitions found for "${word}".`, { type: 'not-found' });
      }
      return raw;
    },
  },

  // OpenDictionaryAPI (CDN) — same data source as Free Dictionary API,
  // served as static JSON from jsDelivr. Much more reliable.
  cdn: {
    url: (word) =>
      `https://cdn.jsdelivr.net/gh/SH20RAJ/OpenDictionaryAPI/data/english/${encodeURIComponent(word)}.json`,
    parse: (raw, word) => {
      // The CDN returns a single object (not an array)
      if (!raw || typeof raw !== 'object') {
        throw new DictionaryError(`No definitions found for "${word}".`, { type: 'not-found' });
      }
      return [raw];
    },
  },

  // Wordnik — placeholder. Fill this in when your API key arrives.
  wordnik: {
    url: (word) =>
      `https://api.wordnik.com/v4/word.json/${encodeURIComponent(word)}/definitions?limit=10&includeRelated=false&useCanonical=true&includeTags=false&api_key=YOUR_KEY_HERE`,
    parse: (raw, word) => {
      // Wordnik returns a flat array of definition objects, not a grouped structure.
      // We'll build a proper adapter once the key is in hand.
      throw new DictionaryError('Wordnik provider not yet implemented.', { type: 'malformed' });
    },
  },
};

// ============================================================
// Public error class
// ============================================================

export class DictionaryError extends Error {
  constructor(message, { type = 'unknown', status = null } = {}) {
    super(message);
    this.name = 'DictionaryError';
    this.type = type; // 'not-found' | 'network' | 'server' | 'malformed'
    this.status = status;
  }
}

// ============================================================
// Main entry
// ============================================================

export async function fetchWord(word, { timeoutMs = 10000 } = {}) {
  const query = word?.trim();
  if (!query) {
    throw new DictionaryError('Please enter a word to search.', { type: 'malformed' });
  }

  const provider = PROVIDERS[ACTIVE_PROVIDER];
  if (!provider) {
    throw new DictionaryError(`Unknown provider: ${ACTIVE_PROVIDER}`, { type: 'malformed' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(provider.url(query), { signal: controller.signal });
  } catch (err) {
    console.error('[Verbena] fetch failed:', err);

    if (err.name === 'AbortError') {
      throw new DictionaryError('The request timed out. Try again.', { type: 'network' });
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new DictionaryError('You appear to be offline.', { type: 'network' });
    }
    throw new DictionaryError(
      `Could not reach the dictionary service. (${err.message || 'unknown network error'})`,
      { type: 'network' }
    );
  } finally {
    clearTimeout(timer);
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

  let raw;
  try {
    raw = await response.json();
  } catch {
    throw new DictionaryError('The dictionary service returned an unreadable response.', {
      type: 'malformed',
    });
  }

  const entries = provider.parse(raw, query);
  return entries.map(normalizeEntry);
}

// ============================================================
// Normalization
// ============================================================

function normalizeEntry(rawEntry) {
  const phonetics = Array.isArray(rawEntry.phonetics) ? rawEntry.phonetics : [];

  const phoneticText =
    rawEntry.phonetic ||
    phonetics.find((p) => p.text && p.text.trim())?.text ||
    '';

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
      .slice(0, 5)
      .map((d) => ({
        definition: d.definition.trim(),
        example: d.example?.trim() || '',
      })),
    synonyms: dedupe(
      (rawMeaning.synonyms || []).map((s) => s.trim()).filter(Boolean)
    ).slice(0, 8),
    antonyms: dedupe(
      (rawMeaning.antonyms || []).map((a) => a.trim()).filter(Boolean)
    ).slice(0, 8),
  };
}

function normalizeAudioUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

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