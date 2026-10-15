import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';


export function MeaningBlock({ partOfSpeech, definitions, synonyms = [], antonyms = [], onLookupWord }) {
  const hasDefinitions = Array.isArray(definitions) && definitions.length > 0;
  const hasSynonyms = Array.isArray(synonyms) && synonyms.length > 0;
  const hasAntonyms = Array.isArray(antonyms) && antonyms.length > 0;
  const hasRelated = hasSynonyms || hasAntonyms;

  if (!hasDefinitions) return null;

  return (
    <section className="mb-8 last:mb-0">
      {/* Part of speech heading */}
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-amber-600 shrink-0" />
        <h3 className="text-xl font-semibold italic text-foreground capitalize">
          {partOfSpeech}
        </h3>
        <div className="flex-1 h-px bg-border ml-2" />
      </div>
    </section>
  )
}