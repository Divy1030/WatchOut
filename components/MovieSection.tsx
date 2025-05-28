import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Layout, Typography } from '../constants/Styles';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieSectionProps {
  title: string;
  movies: Movie[];
  onMoviePress?: (movie: Movie) => void;
  onSeeAllPress?: () => void;
  loading?: boolean;
}

export const MovieSection: React.FC<MovieSectionProps> = ({
  title,
  movies,
  onMoviePress,
  onSeeAllPress,
  loading,
}) => {
  const renderMovieCard = ({ item }: { item: Movie }) => (
    <MovieCard
      movie={item}
      onPress={onMoviePress}
      style={styles.movieCard}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAllPress && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={movies}
        renderItem={renderMovieCard}
        keyExtractor={(item) => item.imdbID} // Changed from item.id.toString()
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moviesList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Layout.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  title: {
    ...Typography.h2,
  },
  seeAll: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  moviesList: {
    paddingHorizontal: Layout.spacing.md,
  },
  movieCard: {
    marginHorizontal: Layout.spacing.sm,
  },
});