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

        {/* Numbered definitions */}
        <ol className="space-y-3 list-none pl-0">
          {definitions.map((def, i) => (
            <li
              key={i}
              className="flex gap-3 pl-1"
            >
              <span
                className={cn(
                  'shrink-0 flex items-center justify-center',
                  'w-6 h-6 rounded-full',
                  'bg-secondary text-secondary-foreground',
                  'text-xs font-semibold'
                )}
                aria-hidden="true"
              >
                {i + 1}
              </span>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-foreground leading-relaxed">
                  {def.definition}
                </p>
                {def.example && (
                  <p className="mt-2 pl-3 border-l-2 border-amber-300 text-sm italic text-muted-foreground">
                    “{def.example}”
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Synonyms / antonyms */}
        {hasRelated && (
          <div className="mt-4 ml-9 flex flex-wrap gap-x-6 gap-y-2">
            {hasSynonyms && (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Synonyms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {synonyms.map((syn) => (
                    <RelatedWord
                      key={`syn-${syn}`}
                      word={syn}
                      onClick={() => onLookupWord?.(syn)}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasAntonyms && (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Antonyms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {antonyms.map((ant) => (
                    <RelatedWord
                      key={`ant-${ant}`}
                      word={ant}
                      onClick={() => onLookupWord?.(ant)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}


function RelatedWord({ word, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center',
        'px-2.5 py-0.5 rounded-full',
        'text-xs font-medium',
        'bg-secondary text-secondary-foreground',
        'border border-transparent',
        'transition-colors',
        'hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'dark:hover:bg-amber-950 dark:hover:text-amber-100 dark:hover:border-amber-800'
      )}
    >
      {word}
    </button>
  );
}