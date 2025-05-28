import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, GlobalStyles, Layout, Typography } from '../../constants/Styles';
import { useWatchlist } from '../../hooks/useWatchlist';
import { movieAPI } from '../../services/movieAPI';
import { MovieDetails } from '../../types/movie';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const movieData = await movieAPI.getMovieDetails(id as string); // Cast to string
        setMovie(movieData);
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={GlobalStyles.centerContent}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!movie) {
    return (
      <SafeAreaView style={GlobalStyles.centerContent}>
        <Text style={Typography.body}>Movie not found</Text>
      </SafeAreaView>
    );
  }

  const backdropUri = movieAPI.getBackdropURL(movie.Poster);
  const posterUri = movieAPI.getImageURL(movie.Poster);

  const handleWatchlistToggle = async () => {
    try {
      await toggleWatchlist(movie.imdbID);
      
      // Show feedback
      if (isInWatchlist(movie.imdbID)) {
        Alert.alert('Removed', 'Movie removed from watchlist');
      } else {
        Alert.alert('Added', 'Movie added to watchlist');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update watchlist');
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Image source={{ uri: backdropUri }} style={styles.backdrop} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.movieInfo}>
            <Image source={{ uri: posterUri }} style={styles.poster} />
            <View style={styles.details}>
              <Text style={styles.title}>{movie.Title}</Text>
              {movie.Plot && <Text style={styles.tagline}>{movie.Plot}</Text>}
              {movie.imdbRating && (
                <Text style={styles.rating}>
                  ⭐ {movie.imdbRating}/10
                </Text>
              )}
              <Text style={styles.runtime}>
                {movie.Runtime} • {movie.Year}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Play</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.watchlistButton,
                isInWatchlist(movie.imdbID) && styles.watchlistButtonActive,
              ]}
              onPress={handleWatchlistToggle}
            >
              <Text style={styles.watchlistButtonText}>
                {isInWatchlist(movie.imdbID) ? '✓ In Watchlist' : '+ Watchlist'}
              </Text>
            </TouchableOpacity>
          </View>

          {movie.Plot && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.overview}>{movie.Plot}</Text>
            </View>
          )}

          {movie.Genre && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genreContainer}>
                {movie.Genre.split(', ').map((genre, index) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {movie.Director && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Director</Text>
              <Text style={styles.overview}>{movie.Director}</Text>
            </View>
          )}

          {movie.Actors && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <Text style={styles.overview}>{movie.Actors}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    height: 300,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: Layout.spacing.lg,
  },
  movieInfo: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.lg,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: Layout.borderRadius.md,
    marginRight: Layout.spacing.md,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    marginBottom: Layout.spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Layout.spacing.sm,
  },
  rating: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  runtime: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.xl,
  },
  playButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginRight: Layout.spacing.md,
    flex: 1,
    alignItems: 'center',
  },
  playButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  watchlistButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    flex: 1,
    alignItems: 'center',
  },
  watchlistButtonActive: {
    backgroundColor: Colors.primary,
  },
  watchlistButtonText: {
    color: Colors.text,
    fontSize: 16,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Layout.spacing.md,
  },
  overview: {
    ...Typography.body,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    marginRight: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  genreText: {
    ...Typography.caption,
    color: Colors.text,
  },
});