import { useCallback, useEffect, useState } from 'react';
import { movieAPI } from '../services/movieAPI';
import { Movie } from '../types/movie';
import { useWatchlist } from './useWatchlist';

interface UseWatchlistMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useWatchlistMovies = (): UseWatchlistMoviesResult => {
  const { watchlist } = useWatchlist();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlistMovies = useCallback(async () => {
    if (watchlist.length === 0) {
      setMovies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch movie details for each IMDb ID in the watchlist
      const moviePromises = watchlist.map(async (imdbId) => {
        try {
          return await movieAPI.getMovieDetails(imdbId);
        } catch (error) {
          console.error(`Error fetching movie ${imdbId}:`, error);
          return null;
        }
      });

      const movieResults = await Promise.all(moviePromises);
      
      // Filter out null results (failed fetches)
      const validMovies = movieResults.filter((movie) => movie !== null);
      
      setMovies(validMovies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load watchlist movies');
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  const refresh = useCallback(async () => {
    await fetchWatchlistMovies();
  }, [fetchWatchlistMovies]);

  useEffect(() => {
    fetchWatchlistMovies();
  }, [fetchWatchlistMovies]);

  return {
    movies,
    loading,
    error,
    refresh,
  };
};