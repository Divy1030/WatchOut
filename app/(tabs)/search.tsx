import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MovieCard } from '../../components/MovieCard';
import { Colors, GlobalStyles, Layout, Typography } from '../../constants/Styles';
import { useSearch } from '../../hooks/useSearch';
import { Movie } from '../../types/movie';

export default function Search() {
  const [query, setQuery] = useState('');
  const { results, loading, search, clearResults } = useSearch();

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      search(text);
    } else {
      clearResults();
    }
  };

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: "/movie/[id]",
      params: { id: movie.imdbID } // Changed from movie.id
    });
  };

  const renderMovieCard = ({ item }: { item: Movie }) => (
    <MovieCard
      movie={item}
      onPress={handleMoviePress}
      style={styles.movieCard}
    />
  );

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Search Movies</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for movies..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={handleSearch}
          />
        </View>
        <FlatList
          data={results}
          renderItem={renderMovieCard}
          keyExtractor={(item) => item.imdbID} // Changed from item.id.toString()
          numColumns={2}
          contentContainerStyle={styles.moviesList}
          showsVerticalScrollIndicator={false}
        />
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
  searchContainer: {
    marginBottom: Layout.spacing.lg,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    fontSize: 16,
  },
  moviesList: {
    paddingBottom: Layout.spacing.xl,
  },
  movieCard: {
    flex: 1,
    marginHorizontal: Layout.spacing.sm,
  },
});