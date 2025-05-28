import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Typography } from '../constants/Styles';
import { useWatchlist } from '../hooks/useWatchlist';
import { movieAPI } from '../services/movieAPI';
import { Movie } from '../types/movie';

interface MovieCardProps {
  movie: Movie;
  onPress?: (movie: Movie) => void;
  style?: any;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2.5;

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onPress, style }) => {
  const { isInWatchlist } = useWatchlist();

  // Safety checks to prevent rendering undefined/null values
  if (!movie) {
    return null;
  }

  const imageUri = movieAPI.getImageURL(movie.Poster);
  const title = movie.Title || 'Unknown Title';
  const year = movie.Year || 'Unknown Year';
  const rating = movie.imdbRating || null;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress?.(movie)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        
        {/* Watchlist indicator */}
        {isInWatchlist(movie.imdbID) && (
          <View style={styles.watchlistBadge}>
            <Text style={styles.watchlistBadgeText}>✓</Text>
          </View>
        )}
        
        {rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.rating}>
              ⭐ {rating}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.year}>
        {year}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rating: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    ...Typography.h4,
    fontSize: 14,
    marginBottom: 4,
    color: Colors.text,
  },
  year: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  watchlistBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchlistBadgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
});