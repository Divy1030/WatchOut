import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, GlobalStyles, Layout, Typography } from '../../constants/Styles';

export default function Profile() {
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'This feature will be implemented soon!');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'This feature will be implemented soon!');
  };

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.email}>john.doe@example.com</Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <Text style={[styles.menuText, { color: Colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
  profileSection: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  avatarText: {
    fontSize: 32,
  },
  name: {
    ...Typography.h2,
    marginBottom: Layout.spacing.sm,
  },
  email: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    backgroundColor: Colors.surface,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.md,
  },
  menuText: {
    ...Typography.body,
    fontSize: 16,
  },
});