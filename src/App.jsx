import { useEffect, useRef, useState } from 'react';
import { fetchWord, DictionaryError } from './lib/api';
import { useFavorites } from './hooks/useFavorites';
import { WordHeader } from './components/WordHeader';

function App() {
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const audioRef = useRef(null);

  useEffect(() => {
    fetchWord('serendipity')
      .then((entries) => {
        setEntry(entries[0]);
        setError(null);
      })
      .catch((err) => {
        setError({
          message: err.message,
          type: err instanceof DictionaryError ? err.type : 'unknown',
        });
        setEntry(null);
      });
  }, []);

  const handleToggleFavorite = () => {
    if (!entry) return;
    const status = toggleFavorite({
      word: entry.word,
      phonetic: entry.phonetic,
      pos: entry.meanings?.[0]?.partOfSpeech || '',
    });
    console.log('[Verbena] favorite status:', status);
  };

  const handlePlayAudio = () => {
    if (!entry?.audioUrl) return;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => console.warn('Audio failed:', err));
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          <strong>[{error.type}]</strong> {error.message}
        </div>
      )}

      {entry && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-8 shadow-sm">
          <WordHeader
            word={entry.word}
            phonetic={entry.phonetic}
            audioUrl={entry.audioUrl}
            isFavorite={isFavorite(entry.word)}
            onToggleFavorite={handleToggleFavorite}
            onPlayAudio={handlePlayAudio}
          />
          <p className="text-sm text-muted-foreground">
            ({entry.meanings.length} meaning{entry.meanings.length === 1 ? '' : 's'} loaded — MeaningBlock next)
          </p>
        </div>
      )}

      {entry?.audioUrl && (
        <audio ref={audioRef} src={entry.audioUrl} preload="none" className="hidden" />
      )}
    </div>
  );
}

export default App;