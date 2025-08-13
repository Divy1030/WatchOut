import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useCreateServer } from '../src/lib/queries';

interface CreateServerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateServerModal({ visible, onClose, onSuccess }: CreateServerModalProps) {
  const [serverName, setServerName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  
  const createServerMutation = useCreateServer();

  const handleCreateServer = async () => {
    if (!serverName.trim()) {
      Alert.alert('Error', 'Server name is required');
      return;
    }

    try {
      await createServerMutation.mutateAsync({
        name: serverName.trim(),
        description: description.trim() || undefined,
        iconUrl: iconUrl.trim() || undefined
      });
      
      // Reset form
      setServerName('');
      setDescription('');
      setIconUrl('');
      
      Alert.alert('Success', 'Server created successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create server');
    }
  };

  const handleClose = () => {
    setServerName('');
    setDescription('');
    setIconUrl('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Create Server</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Create your own server where you and your friends can hang out.
          </Text>

          {/* Server Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              {iconUrl ? (
                <Image source={{ uri: iconUrl }} style={styles.serverIcon} />
              ) : (
                <View style={styles.placeholderIcon}>
                  <Ionicons name="image" size={32} color={Colors.textMuted} />
                </View>
              )}
            </View>
            <Text style={styles.iconLabel}>Server Icon (Optional)</Text>
          </View>

          {/* Server Icon URL Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Icon URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/icon.png"
              placeholderTextColor={Colors.textMuted}
              value={iconUrl}
              onChangeText={setIconUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Server Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Server Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="My Awesome Server"
              placeholderTextColor={Colors.textMuted}
              value={serverName}
              onChangeText={setServerName}
              maxLength={100}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's your server about?"
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Create Button */}
          <Pressable
            style={[
              styles.createButton,
              (!serverName.trim() || createServerMutation.isPending) && styles.createButtonDisabled
            ]}
            onPress={handleCreateServer}
            disabled={!serverName.trim() || createServerMutation.isPending}
          >
            {createServerMutation.isPending ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.createButtonText}>Create Server</Text>
            )}
          </Pressable>

          <Text style={styles.termsText}>
            By creating a server, you agree to our Community Guidelines.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  serverIcon: {
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});