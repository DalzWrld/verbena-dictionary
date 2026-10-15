import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';


export function MeaningBlock({ partOfSpeech, definitions, synonyms = [], antonyms = [], onLookupWord }) {
  const hasDefinitions = Array.isArray(definitions) && definitions.length > 0;
  const hasSynonyms = Array.isArray(synonyms) && synonyms.length > 0;
  const hasAntonyms = Array.isArray(antonyms) && antonyms.length > 0;
  const hasRelated = hasSynonyms || hasAntonyms;

  if (!hasDefinitions) return null;

  return ()
}