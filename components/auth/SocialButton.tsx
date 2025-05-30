import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface SocialButtonProps {
  title: string;
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  isLoading?: boolean;
  style?: ViewStyle;
}

export default function SocialButton({
  title,
  onPress,
  iconName,
  iconColor = Colors.primary,
  isLoading,
  style,
}: SocialButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        isLoading && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.textMuted} />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={22} color={iconColor} />
          </View>
          <Text style={styles.buttonText}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
});