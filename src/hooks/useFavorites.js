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
}