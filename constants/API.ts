export const API_CONFIG = {
  BASE_URL: 'http://www.omdbapi.com',
  API_KEY: 'd6dfbede', // Your OMDb API key
  ENDPOINTS: {
    SEARCH: '/',
    MOVIE_DETAILS: '/',
  },
  // Popular movie IMDb IDs for our sections
  POPULAR_MOVIE_IDS: [
    'tt3896198', // Guardians of the Galaxy Vol. 2
    'tt4154756', // Avengers: Infinity War
    'tt4154796', // Avengers: Endgame
    'tt6320628', // Spider-Man: Far From Home
    'tt2395427', // Avengers: Age of Ultron
    'tt0848228', // The Avengers
    'tt1825683', // Black Panther
    'tt3501632', // Thor: Ragnarok
    'tt1211837', // Doctor Strange
    'tt2250912', // Spider-Man: Homecoming
    'tt3480822', // Black Widow
    'tt9376612', // Shang-Chi
    'tt9032400', // Eternals
    'tt10648342', // Thor: Love and Thunder
    'tt1843866', // Captain America: The Winter Soldier
  ],
  TRENDING_MOVIE_IDS: [
    'tt15398776', // Oppenheimer
    'tt15239678', // Dune: Part Two
    'tt6263850', // Batman
    'tt10872600', // Spider-Man: No Way Home
    'tt9114286', // Black Panther: Wakanda Forever
    'tt1745960', // Top Gun: Maverick
    'tt6806448', // Fast X
    'tt15791034', // Scream VI
    'tt1462764', // Indiana Jones 5
    'tt7975244', // Creed III
  ],
  TOP_RATED_IDS: [
    'tt0111161', // The Shawshank Redemption
    'tt0068646', // The Godfather
    'tt0071562', // The Godfather Part II
    'tt0468569', // The Dark Knight
    'tt0050083', // 12 Angry Men
    'tt0108052', // Schindler's List
    'tt0167260', // The Lord of the Rings: The Return of the King
    'tt0110912', // Pulp Fiction
    'tt0060196', // The Good, the Bad and the Ugly
    'tt0137523', // Fight Club
  ],
};