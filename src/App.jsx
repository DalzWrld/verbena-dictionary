import { useFavorites } from './hooks/useFavorites';

function App() {
  const { favorites, isFavorite, toggleFavorite, count, isLoaded } = useFavorites();

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Verbena · hook test</h1>
      <p>Count: {count} {isLoaded ? '(loaded)' : '(loading…)'}</p>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
          onClick={() => toggleFavorite({ word: 'serendipity', phonetic: '/ˌsɛrənˈdɪpɪti/', pos: 'noun' })}
        >
          Toggle "serendipity"
        </button>
        <button
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
          onClick={() => toggleFavorite({ word: 'eloquent', phonetic: '/ˈɛləkwənt/', pos: 'adjective' })}
        >
          Toggle "eloquent"
        </button>
      </div>

      <ul className="text-sm font-mono">
        {favorites.map((f) => (
          <li key={f.word}>
            {f.word} — {f.phonetic} ({f.pos}) — isFavorite: {String(isFavorite(f.word))}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;