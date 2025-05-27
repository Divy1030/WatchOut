import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Mock data
const featuredMovie = {
  id: 1,
  title: "Avengers: Endgame",
  description:
    "The grave course of events set in motion by Thanos that wiped out half the universe and fractured the Avengers ranks compels the remaining Avengers to take one final stand.",
  image: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
  rating: "8.4",
  genre: "Action, Adventure, Drama",
};

const trendingMovies = [
  {
    id: 1,
    title: "Spider-Man",
    image: "https://image.tmdb.org/t/p/w300/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
  },
  {
    id: 2,
    title: "Batman",
    image: "https://image.tmdb.org/t/p/w300/74xTEgt7R36Fpooo50r9T25onhq.jpg",
  },
  {
    id: 3,
    title: "Wonder Woman",
    image: "https://image.tmdb.org/t/p/w300/gfJGlDaHuWimErCr5Ql0I8x9QSy.jpg",
  },
  {
    id: 4,
    title: "Thor",
    image: "https://image.tmdb.org/t/p/w300/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg",
  },
  {
    id: 5,
    title: "Iron Man",
    image: "https://image.tmdb.org/t/p/w300/78lPtwv72eTNqFW9COBYI0dWDJa.jpg",
  },
];

const categories = [
  { id: 1, title: "Action Movies", movies: trendingMovies },
  { id: 2, title: "Comedy Movies", movies: trendingMovies },
  { id: 3, title: "Drama Series", movies: trendingMovies },
];

export default function Index() {
  const renderMovieCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.movieCard}>
      <Image source={{ uri: item.image }} style={styles.movieImage} />
      <Text style={styles.movieTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: any }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      <FlatList
        data={item.movies}
        renderItem={renderMovieCard}
        keyExtractor={(movie) => movie.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moviesList}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>WatchOut</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: featuredMovie.image }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)", "#000"]}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{featuredMovie.title}</Text>
              <Text style={styles.heroGenre}>{featuredMovie.genre}</Text>
              <Text style={styles.heroDescription} numberOfLines={3}>
                {featuredMovie.description}
              </Text>
              <View style={styles.heroButtons}>
                <TouchableOpacity style={styles.playButton}>
                  <Text style={styles.playButtonText}>▶ Play</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.watchlistButton}>
                  <Text style={styles.watchlistButtonText}>+ Watchlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Trending Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <FlatList
            data={trendingMovies}
            renderItem={renderMovieCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moviesList}
          />
        </View>

        {/* Categories */}
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20, // Increased to account for status bar
    paddingBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
  },
  headerButtons: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 20,
  },
  headerButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  heroContainer: {
    height: height * 0.6,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  heroGenre: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
    marginBottom: 20,
  },
  heroButtons: {
    flexDirection: "row",
  },
  playButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  playButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  watchlistButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  watchlistButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryContainer: {
    marginTop: 30,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  moviesList: {
    paddingHorizontal: 15,
  },
  movieCard: {
    marginHorizontal: 5,
    width: 120,
  },
  movieImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  movieTitle: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 50,
  },
});
