import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useCreateInvite, useDeleteServer, useLeaveServer, useUpdateServer } from '../src/lib/queries';

interface ServerSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  server: any;
  isOwner: boolean;
  onServerDeleted?: () => void;
  onServerLeft?: () => void;
}

export default function ServerSettingsModal({ 
  visible, 
  onClose, 
  server, 
  isOwner,
  onServerDeleted,
  onServerLeft 
}: ServerSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'invites' | 'danger'>('general');
  const [serverName, setServerName] = useState(server?.name || '');
  const [description, setDescription] = useState(server?.description || '');
  const [iconUrl, setIconUrl] = useState(server?.iconUrl || '');
  const [inviteCode, setInviteCode] = useState('');

  const updateServerMutation = useUpdateServer();
  const createInviteMutation = useCreateInvite();
  const deleteServerMutation = useDeleteServer();
  const leaveServerMutation = useLeaveServer();

  const handleUpdateServer = async () => {
    if (!serverName.trim()) {
      Alert.alert('Error', 'Server name is required');
      return;
    }

    try {
      await updateServerMutation.mutateAsync({
        serverId: server._id,
        data: {
          name: serverName.trim(),
          description: description.trim() || undefined,
          iconUrl: iconUrl.trim() || undefined
        }
      });
      Alert.alert('Success', 'Server updated successfully!');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update server');
    }
  };

  const handleCreateInvite = async () => {
    try {
      const result = await createInviteMutation.mutateAsync({
        serverId: server._id,
        data: { maxUses: 100, expiresIn: 24 * 7 } // 1 week
      });
      
      // Just show the invite code, not the server ID
      const newInviteCode = result.data.code || result.data.invite?.code;
      setInviteCode(newInviteCode);
      Alert.alert('Success', `Invite created: ${newInviteCode}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create invite');
    }
  };

  const handleDeleteServer = () => {
    Alert.alert(
      'Delete Server',
      'Are you sure you want to delete this server? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteServerMutation.mutateAsync(server._id);
              Alert.alert('Success', 'Server deleted successfully');
              onServerDeleted?.();
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete server');
            }
          }
        }
      ]
    );
  };

  const handleLeaveServer = () => {
    Alert.alert(
      'Leave Server',
      'Are you sure you want to leave this server?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveServerMutation.mutateAsync(server._id);
              Alert.alert('Success', 'Left server successfully');
              onServerLeft?.();
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to leave server');
            }
          }
        }
      ]
    );
  };

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings-outline' },
    { id: 'invites', label: 'Invites', icon: 'link-outline' },
    { id: 'danger', label: 'Danger Zone', icon: 'warning-outline' }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Server Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={20} 
                  color={activeTab === tab.id ? Colors.primary : Colors.textMuted} 
                />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={styles.tabContent}>
            {activeTab === 'general' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>General Settings</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Server Name</Text>
                  <TextInput
                    style={styles.input}
                    value={serverName}
                    onChangeText={setServerName}
                    placeholder="Server name"
                    placeholderTextColor={Colors.textMuted}
                    editable={isOwner}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Server description"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={3}
                    editable={isOwner}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Icon URL</Text>
                  <TextInput
                    style={styles.input}
                    value={iconUrl}
                    onChangeText={setIconUrl}
                    placeholder="https://example.com/icon.png"
                    placeholderTextColor={Colors.textMuted}
                    editable={isOwner}
                  />
                </View>

                {isOwner && (
                  <Pressable
                    style={[
                      styles.saveButton,
                      updateServerMutation.isPending && styles.saveButtonDisabled
                    ]}
                    onPress={handleUpdateServer}
                    disabled={updateServerMutation.isPending}
                  >
                    {updateServerMutation.isPending ? (
                      <ActivityIndicator color={Colors.text} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}

            {activeTab === 'invites' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Server Invites</Text>
                
                <Pressable
                  style={[
                    styles.createInviteButton,
                    createInviteMutation.isPending && styles.createInviteButtonDisabled
                  ]}
                  onPress={handleCreateInvite}
                  disabled={createInviteMutation.isPending}
                >
                  {createInviteMutation.isPending ? (
                    <ActivityIndicator color={Colors.text} />
                  ) : (
                    <>
                      <Ionicons name="add" size={20} color={Colors.text} />
                      <Text style={styles.createInviteButtonText}>Create Invite</Text>
                    </>
                  )}
                </Pressable>

                {inviteCode && (
                  <View style={styles.inviteCodeContainer}>
                    <Text style={styles.label}>Latest Invite Code:</Text>
                    <View style={styles.inviteCodeBox}>
                      <Text style={styles.inviteCodeText}>{inviteCode}</Text>
                      <Pressable
                        style={styles.copyButton}
                        onPress={() => {
                          // You can implement clipboard functionality here
                          Alert.alert('Copied', 'Invite code copied to clipboard');
                        }}
                      >
                        <Ionicons name="copy" size={16} color={Colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'danger' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Danger Zone</Text>
                
                {!isOwner && (
                  <Pressable
                    style={[
                      styles.dangerButton,
                      leaveServerMutation.isPending && styles.dangerButtonDisabled
                    ]}
                    onPress={handleLeaveServer}
                    disabled={leaveServerMutation.isPending}
                  >
                    {leaveServerMutation.isPending ? (
                      <ActivityIndicator color={Colors.text} />
                    ) : (
                      <Text style={styles.dangerButtonText}>Leave Server</Text>
                    )}
                  </Pressable>
                )}

                {isOwner && (
                  <Pressable
                    style={[
                      styles.dangerButton,
                      deleteServerMutation.isPending && styles.dangerButtonDisabled
                    ]}
                    onPress={handleDeleteServer}
                    disabled={deleteServerMutation.isPending}
                  >
                    {deleteServerMutation.isPending ? (
                      <ActivityIndicator color={Colors.text} />
                    ) : (
                      <Text style={styles.dangerButtonText}>Delete Server</Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
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
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
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
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  createInviteButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createInviteButtonDisabled: {
    opacity: 0.6,
  },
  createInviteButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inviteCodeContainer: {
    marginTop: 16,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  inviteCodeText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  dangerButton: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonDisabled: {
    opacity: 0.6,
  },
  dangerButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});