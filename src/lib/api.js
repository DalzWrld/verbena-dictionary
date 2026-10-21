const ACTIVE_PROVIDER = 'wordnik';

const DICTIONARY_API_KEY = import.meta.env.DICTIONARY_API_KEY || 'DEMO_KEY';

const PROVIDERS = {
  // Free Dictionary API — keyless, unreliable, kept as fallback
  dictionaryapi: {
    url: (word) =>
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    parse: (raw, word) => {
      if (!Array.isArray(raw) || raw.length === 0) {
        throw new DictionaryError(`No definitions found for "${word}".`, { type: 'not-found' });
      }
      return raw;
    },
  },

  // Wiktionary REST API — official Wikimedia endpoint, no key required.
  // Docs: https://en.wiktionary.org/api/rest_v1/
  wiktionary: {
    url: (word) =>
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,
    parse: (raw, word) => {
      // Response shape: { en: [ { partOfSpeech, language, definitions: [...] } ] }
      const englishEntries = raw?.en;
      if (!Array.isArray(englishEntries) || englishEntries.length === 0) {
        throw new DictionaryError(`No definitions found for "${word}".`, { type: 'not-found' });
      }

      // Flatten Wiktionary's structure into our internal "one entry per word" shape
      const meanings = englishEntries
        .map((group) => ({
          partOfSpeech: group.partOfSpeech || 'unknown',
          definitions: (group.definitions || [])
            .filter((d) => d.definition && d.definition.trim())
            .map((d) => ({
              definition: stripHtml(d.definition),
              example: extractFirstExample(d),
            })),
          // Wiktionary's REST API doesn't return synonyms/antonyms inline;
          // they're in the page HTML. We leave these empty for now.
          synonyms: [],
          antonyms: [],
        }))
        .filter((m) => m.definitions.length > 0);

      if (meanings.length === 0) {
        throw new DictionaryError(`No usable definitions for "${word}".`, { type: 'not-found' });
      }

      return [
        {
          word,
          phonetic: '', // Wiktionary REST doesn't expose this cleanly; skip for now
          phonetics: [],
          meanings,
          sourceUrls: [`https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`],
        },
      ];
    },
  },

  // Wordnik API — requires an API key, kept as fallback
  wordnik: {
    url: (word) =>{
      // Batch all the resources we need in one call to save rate limit
      const base = `http://api.wordnik.com/v4/words.json/randomWord?api_key=${DICTIONARY_API_KEY}/${encodeURIComponent(word)}`;
      const params = new URLSearchParams({
        api_key: DICTIONARY_API_KEY,
        useCanonical: 'true',
        limit: '10',
      });
      // We'll construct a multi-resource request manually below
      return `${base}?multi&resource.1=definitions&resource.2=pronunciations&resource.3=audio&resource.4=relatedWords&type.4=synonym,antonym&limit.4=10&${params}`;
    },
    parse: (raw, word) => {
      // Wordnik batch responses come back as { responseItems: [...] }
      const items = raw?.responseItems;
      if (!Array.isArray(items) || items.length === 0) {
        throw new DictionaryError(`No definitions found for "${word}".`, { type: 'not-found' });
      }

      const getItem = (name) =>
        items.find((i) => i.responseName === name)?.responseContent ?? [];

      const definitions = getItem('definitions');
      const pronunciations = getItem('pronunciations');
      const audio = getItem('audio');
      const related = getItem('relatedWords');

      if (!Array.isArray(definitions) || definitions.length === 0) {
        throw new DictionaryError(`No definitions found for "${word}".`, { type: 'not-found' });
      }

      // Group definitions by partOfSpeech
      const byPOS = {};
      for (const def of definitions) {
        const pos = def.partOfSpeech || 'unknown';
        if (!byPOS[pos]) byPOS[pos] = [];
        byPOS[pos].push({
          definition: def.text || '',
          example: def.exampleUses?.[0]?.text || '',
        });
      }

      // Extract synonyms/antonyms from relatedWords
      const syns = [];
      const ants = [];
      for (const rel of related) {
        if (rel.relationshipType === 'synonym') syns.push(...(rel.words || []));
        if (rel.relationshipType === 'antonym') ants.push(...(rel.words || []));
      }

      return [{
        word,
        phonetic: pronunciations?.[0]?.raw || '',
        phonetics: pronunciations?.map((p) => ({ text: p.raw })) || [],
        audioUrl: audio?.[0]?.fileUrl || '',
        meanings: Object.entries(byPOS).map(([pos, defs]) => ({
          partOfSpeech: pos,
          definitions: defs,
          synonyms: dedupe(syns).slice(0, 8),
          antonyms: dedupe(ants).slice(0, 8),
        })),
        sourceUrls: [`https://www.wordnik.com/words/${encodeURIComponent(word)}`],
        attribution: definitions[0]?.attributionText || '',
      }];
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

/**
 * Wiktionary definitions come wrapped in HTML. Strip tags and decode the
 * common entities so we can render plain text safely.
 */
function stripHtml(input) {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // remove all tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

/**
 * Wiktionary returns examples in a few possible shapes depending on the
 * page. Try the common ones and return the first usable string.
 */
function extractFirstExample(defObj) {
  if (Array.isArray(defObj.parsedExamples) && defObj.parsedExamples.length > 0) {
    const first = defObj.parsedExamples[0];
    if (first?.example) return stripHtml(first.example);
  }
  if (Array.isArray(defObj.examples) && defObj.examples.length > 0) {
    const first = defObj.examples[0];
    if (typeof first === 'string') return stripHtml(first);
  }
  return '';
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