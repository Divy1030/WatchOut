import { Dimensions, StyleSheet } from 'react-native';
import { Colors } from './Colors';

const { width, height } = Dimensions.get('window');

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: Colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    fontSize: 14,
    color: Colors.text,
  },
  caption: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  small: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});

export const Layout = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
};

// Re-export Colors for convenience
export { Colors } from './Colors';

