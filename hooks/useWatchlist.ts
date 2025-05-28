import { useCallback, useEffect, useState } from 'react';
import { storage } from '../services/storage';

const WATCHLIST_KEY = 'watchlist';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]); // Changed from number[] to string[]
  const [loading, setLoading] = useState(true);

  const loadWatchlist = useCallback(async () => {
    try {
      const stored = await storage.getItem<string[]>(WATCHLIST_KEY);
      setWatchlist(stored || []);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWatchlist = useCallback(async (movieId: string) => { // Changed from number to string
    try {
      const newWatchlist = [...watchlist, movieId];
      setWatchlist(newWatchlist);
      await storage.setItem(WATCHLIST_KEY, newWatchlist);
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  }, [watchlist]);

  const removeFromWatchlist = useCallback(async (movieId: string) => { // Changed from number to string
    try {
      const newWatchlist = watchlist.filter(id => id !== movieId);
      setWatchlist(newWatchlist);
      await storage.setItem(WATCHLIST_KEY, newWatchlist);
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  }, [watchlist]);

  const isInWatchlist = useCallback((movieId: string) => { // Changed from number to string
    return watchlist.includes(movieId);
  }, [watchlist]);

  const toggleWatchlist = useCallback(async (movieId: string) => { // Changed from number to string
    if (isInWatchlist(movieId)) {
      await removeFromWatchlist(movieId);
    } else {
      await addToWatchlist(movieId);
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
  };
};