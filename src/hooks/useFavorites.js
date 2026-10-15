import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'verbena_favorites';

/**
 * Manages the user's favorite words, persisted to localStorage.
 * 
 * Each favorite has shape: { word: string, phonetic: string, pos: string, addedAt: number }
 */

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (err) {
      console.warn('[Verbena] Failed to load favorites from localStorage:', err);
      // Non-fatal — start with empty list
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist to localStorage whenever favorites change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (err) {
      console.warn('[Verbena] Failed to save favorites to localStorage:', err);
    }
  }, [favorites, isLoaded]);

  // Check if a word is already saved (case-insensitive)
  const isFavorite = useCallback(
    (word) => {
      if (!word) return false;
      const target = word.trim().toLowerCase();
      return favorites.some((fav) => fav.word.toLowerCase() === target);
    },
    [favorites]
  );

  // Add a word to favorites. Accepts { word, phonetic, pos }.
  // Returns true if added, false if it was already there or invalid.
  const addFavorite = useCallback(
    ({ word, phonetic = '', pos = '' }) => {
      if (!word || !word.trim()) return false;
      const normalized = word.trim().toLowerCase();

      let added = false;
      setFavorites((prev) => {
        if (prev.some((fav) => fav.word.toLowerCase() === normalized)) {
          return prev; // already exists — no change
        }
        added = true;
        return [
          { word: normalized, phonetic, pos, addedAt: Date.now() },
          ...prev,
        ];
      });

      return added;
    },
    []
  );

  // Remove a word by name (case-insensitive). Returns true if removed.
  const removeFavorite = useCallback((word) => {
    if (!word) return false;
    const target = word.trim().toLowerCase();

    let removed = false;
    setFavorites((prev) => {
      const next = prev.filter((fav) => {
        if (fav.word.toLowerCase() === target) {
          removed = true;
          return false;
        }
        return true;
      });
      return removed ? next : prev;
    });

    return removed;
  }, []);
}