import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useJoinServerByCode } from '../src/lib/queries';

interface JoinServerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function JoinServerModal({ visible, onClose, onSuccess }: JoinServerModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  
  const joinServerMutation = useJoinServerByCode();

  const handleJoinServer = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    // Clean the invite code - remove any extra characters
    const cleanInviteCode = inviteCode.trim().toLowerCase();

    try {
      await joinServerMutation.mutateAsync(cleanInviteCode);
      
      setInviteCode('');
      Alert.alert('Success', 'Joined server successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Join server error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Invalid invite code or failed to join server');
    }
  };

  const handleClose = () => {
    setInviteCode('');
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
          <Text style={styles.title}>Join Server</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={48} color={Colors.primary} />
          </View>

          <Text style={styles.subtitle}>
            Join a server to chat with friends and communities.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Invite Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="917284a3"
              placeholderTextColor={Colors.textMuted}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helpText}>
              Enter the invite code provided by the server owner.{'\n'}
              Example: 917284a3
            </Text>
          </View>

          <Pressable
            style={[
              styles.joinButton,
              (!inviteCode.trim() || joinServerMutation.isPending) && styles.joinButtonDisabled
            ]}
            onPress={handleJoinServer}
            disabled={!inviteCode.trim() || joinServerMutation.isPending}
          >
            {joinServerMutation.isPending ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.joinButtonText}>Join Server</Text>
            )}
          </Pressable>
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
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 32,
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
    width: '100%',
  },
  helpText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    lineHeight: 16,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});