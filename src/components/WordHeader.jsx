import { Star, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function WordHeader({ word, phonetic, audioUrl, isFavorite, onToggleFavorite, onPlayAudio }) {
  const hasAudio = Boolean(audioUrl);
  const hasPhonetic = Boolean(phonetic && phonetic.trim());
}