import { API_CONFIG } from '../constants/API';
import { Movie, MovieDetails, MovieResponse, SearchParams } from '../types/movie';

class MovieAPIService {
  private baseURL = API_CONFIG.BASE_URL;
  private apiKey = API_CONFIG.API_KEY;

  private async fetchData<T>(params: Record<string, any>): Promise<T> {
    const url = new URL(this.baseURL);
    url.searchParams.append('apikey', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.Response === 'False') {
        throw new Error(data.Error || 'API Error');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async fetchMoviesByIds(ids: string[]): Promise<Movie[]> {
    try {
      const promises = ids.map(id => 
        this.fetchData<MovieDetails>({ i: id })
      );
      
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<MovieDetails> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    } catch (error) {
      console.error('Error fetching movies by IDs:', error);
      return [];
    }
  }

  async getTrending(): Promise<{ results: Movie[] }> {
    const movies = await this.fetchMoviesByIds(API_CONFIG.TRENDING_MOVIE_IDS);
    return { results: movies };
  }

  async getPopular(): Promise<{ results: Movie[] }> {
    const movies = await this.fetchMoviesByIds(API_CONFIG.POPULAR_MOVIE_IDS);
    return { results: movies };
  }

  async getTopRated(): Promise<{ results: Movie[] }> {
    const movies = await this.fetchMoviesByIds(API_CONFIG.TOP_RATED_IDS);
    return { results: movies };
  }

  async getNowPlaying(): Promise<{ results: Movie[] }> {
    // Use popular movies as "now playing"
    return this.getPopular();
  }

  async getUpcoming(): Promise<{ results: Movie[] }> {
    // Use a subset of trending as "upcoming"
    const movies = await this.fetchMoviesByIds(
      API_CONFIG.TRENDING_MOVIE_IDS.slice(0, 8)
    );
    return { results: movies };
  }

  async searchMovies(params: SearchParams): Promise<MovieResponse> {
    if (!params.s) {
      return {
        Search: [],
        totalResults: '0',
        Response: 'True'
      };
    }

    return this.fetchData<MovieResponse>({
      s: params.s,
      type: 'movie',
      page: params.page || 1
    });
  }

  async getMovieDetails(imdbId: string): Promise<MovieDetails> {
    return this.fetchData<MovieDetails>({ i: imdbId, plot: 'full' });
  }

  getImageURL(posterUrl: string): string {
    if (!posterUrl || posterUrl === 'N/A') {
      return 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image';
    }
    return posterUrl;
  }

  getBackdropURL(posterUrl: string): string {
    // OMDb doesn't provide backdrop images, so we'll use the poster
    // or create a blurred version effect
    if (!posterUrl || posterUrl === 'N/A') {
      return 'https://via.placeholder.com/1280x720/1a1a1a/ffffff?text=No+Image';
    }
    return posterUrl;
  }
}

export const movieAPI = new MovieAPIService();