import { Star, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function WordHeader({ word, phonetic, audioUrl, isFavorite, onToggleFavorite, onPlayAudio }) {
  const hasAudio = Boolean(audioUrl);
  const hasPhonetic = Boolean(phonetic && phonetic.trim());

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4 mb-6">
      {/* Left side: word + phonetic */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 min-w-0">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground wrap-break-word">
          {word}
        </h2>
        {hasPhonetic && (
          <span className="font-mono text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
            {phonetic}
          </span>
        )}
      </div>

      {/* Right side: audio + favorite */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onPlayAudio}
          disabled={!hasAudio}
          aria-label={hasAudio ? 'Play pronunciation' : 'Pronunciation unavailable'}
          title={hasAudio ? 'Play pronunciation' : 'Pronunciation unavailable'}
          className={cn(
            'rounded-full h-10 w-10 transition-transform',
            hasAudio && 'hover:scale-105'
          )}
        >
          <Volume2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}