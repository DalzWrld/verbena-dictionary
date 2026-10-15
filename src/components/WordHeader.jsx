import { Star, Volume2, VolumeX } from 'lucide-react';
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
            'rounded-full h-10 w-10 transition-all',
            hasAudio
              ? 'hover:scale-105 hover:text-foreground'
              : // Muted, inert look when no audio is available
                'opacity-40 grayscale bg-transparent border-dashed text-muted-foreground cursor-not-allowed hover:bg-transparent'
          )}
        >
          {hasAudio ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          className={cn(
            'rounded-full h-10 w-10 transition-all',
            isFavorite
              ? 'text-amber-500 border-amber-300 hover:text-amber-600 hover:border-amber-400'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Star
            className="h-5 w-5"
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </Button>
      </div>
    </div>
  )
}