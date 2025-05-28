import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeroSection } from '../../components/HeroSection';
import { MovieSection } from '../../components/MovieSection';
import { Colors, GlobalStyles, Typography } from '../../constants/Styles';
import { useMovies } from '../../hooks/useMovies';
import { useWatchlist } from '../../hooks/useWatchlist';
import { Movie } from '../../types/movie';

export default function Home() {
  const trendingMovies = useMovies('trending');
  const popularMovies = useMovies('popular');
  const topRatedMovies = useMovies('topRated');
  const { toggleWatchlist } = useWatchlist();

  const handleMoviePress = useCallback((movie: Movie) => {
    router.push({
      pathname: "/movie/[id]",
      params: { id: movie.imdbID }
    });
  }, []);

  const handlePlayPress = useCallback(() => {
    Alert.alert('Play Movie', 'This feature will be implemented soon!');
  }, []);

  const handleWatchlistPress = useCallback(async (movieId: string) => {
    await toggleWatchlist(movieId);
  }, [toggleWatchlist]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      trendingMovies.refresh(),
      popularMovies.refresh(),
      topRatedMovies.refresh(),
    ]);
  }, [trendingMovies.refresh, popularMovies.refresh, topRatedMovies.refresh]);

  const featuredMovie = trendingMovies.movies[0];

  // Show loading state
  if (trendingMovies.loading && trendingMovies.movies.length === 0) {
    return (
      <SafeAreaView style={GlobalStyles.centerContent}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[Typography.body, { marginTop: 16 }]}>Loading movies...</Text>
      </SafeAreaView>
    );
  }

  // Show error state
  if (trendingMovies.error) {
    return (
      <SafeAreaView style={GlobalStyles.centerContent}>
        <Text style={[Typography.body, { color: Colors.error, textAlign: 'center', marginBottom: 16 }]}>
          Error loading movies: {trendingMovies.error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={trendingMovies.loading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {featuredMovie && (
          <HeroSection
            movie={featuredMovie}
            onPlayPress={handlePlayPress}
            onWatchlistPress={() => handleWatchlistPress(featuredMovie.imdbID)}
            onMoviePress={() => handleMoviePress(featuredMovie)}
          />
        )}

        {trendingMovies.movies.length > 0 && (
          <MovieSection
            title="Trending Now"
            movies={trendingMovies.movies.slice(1, 11)}
            onMoviePress={handleMoviePress}
          />
        )}

        {popularMovies.movies.length > 0 && (
          <MovieSection
            title="Popular Movies"
            movies={popularMovies.movies.slice(0, 10)}
            onMoviePress={handleMoviePress}
          />
        )}

        {topRatedMovies.movies.length > 0 && (
          <MovieSection
            title="Top Rated"
            movies={topRatedMovies.movies.slice(0, 10)}
            onMoviePress={handleMoviePress}
          />
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bottomSpacing: {
    height: 50,
  },
});