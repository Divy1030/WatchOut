import { Colors } from './Colors';

export { Colors };

export const GlobalStyles = {
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export const Typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  h3: {
    fontSize: 18,
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
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    color: Colors.textMuted,
  },
};

export const Layout = {
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
    lg: 12,
    xl: 16,
    round: 9999,
  },
};

