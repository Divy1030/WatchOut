export interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
  // Additional fields for detailed response
  Plot?: string;
  Director?: string;
  Actors?: string;
  Genre?: string;
  imdbRating?: string;
  Runtime?: string;
  Released?: string;
  Writer?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Metascore?: string;
  imdbVotes?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
}

export interface MovieResponse {
  Search: Movie[];
  totalResults: string;
  Response: string;
  Error?: string;
}

export interface MovieDetails extends Movie {
  Rated: string;
  Plot: string;
  Director: string;
  Writer: string;
  Actors: string;
  Language: string;
  Country: string;
  Awards: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
}

export interface SearchParams {
  s?: string; // search term
  y?: string; // year
  type?: string; // movie, series, episode
  page?: number;
}

// Keep these for compatibility
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  watchlist: string[]; // Changed to string array for IMDb IDs
  favorites: string[];
}