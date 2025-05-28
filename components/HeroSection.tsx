import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Layout, Typography } from '../constants/Styles';
import { movieAPI } from '../services/movieAPI';
import { Movie } from '../types/movie';

interface HeroSectionProps {
  movie: Movie;
  onPlayPress?: () => void;
  onWatchlistPress?: () => void;
  onMoviePress?: () => void;
}

const { height } = Dimensions.get('window');

export const HeroSection: React.FC<HeroSectionProps> = ({
  movie,
  onPlayPress,
  onWatchlistPress,
  onMoviePress,
}) => {
  // Safety checks
  if (!movie) {
    return null;
  }

  const backdropUri = movieAPI.getBackdropURL(movie.Poster);
  const title = movie.Title || 'Unknown Title';
  const plot = movie.Plot || 'No description available';
  const rating = movie.imdbRating || null;
  const year = movie.Year || 'Unknown Year';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onMoviePress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: backdropUri }} style={styles.backdrop} />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)', '#000']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.overview} numberOfLines={3}>
            {plot}
          </Text>
          <View style={styles.metadata}>
            {rating && (
              <Text style={styles.rating}>
                ⭐ {rating}
              </Text>
            )}
            <Text style={styles.year}>
              {year}
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.playButton} onPress={onPlayPress}>
              <Text style={styles.playButtonText}>▶ Play</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.watchlistButton}
              onPress={onWatchlistPress}
            >
              <Text style={styles.watchlistButtonText}>+ Watchlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height * 0.6,
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
    height: '70%',
    justifyContent: 'flex-end',
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  title: {
    ...Typography.h1,
    marginBottom: Layout.spacing.sm,
    color: Colors.text,
  },
  overview: {
    ...Typography.body,
    lineHeight: 20,
    marginBottom: Layout.spacing.md,
    color: Colors.text,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  rating: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: Layout.spacing.md,
  },
  year: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  playButton: {
    backgroundColor: Colors.text,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.md,
  },
  playButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  watchlistButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  watchlistButtonText: {
    color: Colors.text,
    fontSize: 16,
  },
});