import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MovieCard } from '../../components/MovieCard';
import { Colors, GlobalStyles, Layout, Typography } from '../../constants/Styles';
import { useWatchlistMovies } from '../../hooks/useWatchlistMovies';
import { Movie } from '../../types/movie';

export default function Watchlist() {
  const { movies, loading, error, refresh } = useWatchlistMovies();

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: "/movie/[id]",
      params: { id: movie.imdbID }
    });
  };

  const renderMovieCard = ({ item }: { item: Movie }) => (
    <MovieCard
      movie={item}
      onPress={handleMoviePress}
      style={styles.movieCard}
    />
  );

  // Show loading state
  if (loading && movies.length === 0) {
    return (
      <SafeAreaView style={GlobalStyles.centerContent}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[Typography.body, { marginTop: 16 }]}>Loading watchlist...</Text>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={GlobalStyles.centerContent}>
        <Text style={[Typography.body, { color: Colors.error, textAlign: 'center' }]}>
          Error loading watchlist: {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Watchlist</Text>
        {movies.length === 0 ? (
          <View style={GlobalStyles.centerContent}>
            <Text style={styles.emptyText}>Your watchlist is empty</Text>
            <Text style={[styles.emptyText, { marginTop: 8, fontSize: 12 }]}>
              Add movies to your watchlist to see them here
            </Text>
          </View>
        ) : (
          <FlatList
            data={movies}
            renderItem={renderMovieCard}
            keyExtractor={(item) => item.imdbID}
            numColumns={2}
            contentContainerStyle={styles.moviesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refresh}
                tintColor={Colors.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Layout.spacing.md,
  },
  title: {
    ...Typography.h1,
    marginBottom: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  moviesList: {
    paddingBottom: Layout.spacing.xl,
  },
  movieCard: {
    flex: 1,
    marginHorizontal: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
});