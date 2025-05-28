import { useCallback, useEffect, useState } from 'react';
import { movieAPI } from '../services/movieAPI';
import { Movie } from '../types/movie';

interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useMovies = (
  endpoint: 'trending' | 'popular' | 'topRated' | 'nowPlaying' | 'upcoming'
): UseMoviesResult => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response: { results: Movie[] };
      
      switch (endpoint) {
        case 'trending':
          response = await movieAPI.getTrending();
          break;
        case 'popular':
          response = await movieAPI.getPopular();
          break;
        case 'topRated':
          response = await movieAPI.getTopRated();
          break;
        case 'nowPlaying':
          response = await movieAPI.getNowPlaying();
          break;
        case 'upcoming':
          response = await movieAPI.getUpcoming();
          break;
        default:
          throw new Error('Invalid endpoint');
      }

      setMovies(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const loadMore = useCallback(async () => {
    // OMDb API pagination is limited, so we'll keep it simple
  }, []);

  const refresh = useCallback(async () => {
    await fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return {
    movies,
    loading,
    error,
    hasMore: false, // Disable pagination for now
    loadMore,
    refresh,
  };
};