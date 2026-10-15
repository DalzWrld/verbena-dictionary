import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'verbena_favorites';

/**
 * Manages the user's favorite words, persisted to localStorage.
 * 
 * Each favorite has shape: { word: string, phonetic: string, pos: string, addedAt: number }
 */