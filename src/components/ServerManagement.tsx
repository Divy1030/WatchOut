import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { serverApi } from '../lib/api';

const { width } = Dimensions.get('window');

interface Role {
  _id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
}

interface Channel {
  _id: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  position: number;
  isPrivate: boolean;
}

interface Member {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  roles: string[];
  joinedAt: string;
}

interface Invite {
  code: string;
  createdBy: {
    username: string;
    displayName?: string;
  };
  expiresAt?: string;
  maxUses?: number;
  uses: number;
}

interface ServerManagementProps {
  serverId: string;
  serverName: string;
  isOwner: boolean;
  userRoles: string[];
  onClose: () => void;
}

const ServerManagement: React.FC<ServerManagementProps> = ({
  serverId,
  serverName,
  isOwner,
  userRoles,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'roles' | 'members' | 'invites'>('channels');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form states
  const [channelForm, setChannelForm] = useState({
    name: '',
    type: 'text' as 'text' | 'voice',
    topic: '',
    isPrivate: false,
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    color: '#99AAB5',
    permissions: [] as string[],
  });

  const [inviteForm, setInviteForm] = useState({
    maxUses: undefined as number | undefined,
    expiresIn: undefined as number | undefined,
  });

  const availablePermissions = [
    'admin',
    'manage_channels',
    'manage_roles',
    'kick_members',
    'ban_members',
    'manage_messages',
    'manage_server',
    'create_invite',
    'read_messages',
    'send_messages',
    'embed_links',
    'attach_files',
    'add_reactions',
    'connect',
    'speak',
  ];

  useEffect(() => {
    loadServerData();
  }, [activeTab]);

  const loadServerData = async () => {
    try {
      setLoading(true);
      const serverResponse = await serverApi.getServerDetails(serverId);
      const server = serverResponse.data.server;

      setChannels(server.channels || []);
      setRoles(server.roles || []);

      if (activeTab === 'members') {
        const membersResponse = await serverApi.getServerMembers(serverId);
        setMembers(membersResponse.data.members || []);
      }

      if (activeTab === 'invites') {
        const invitesResponse = await serverApi.getServerInvites(serverId);
        setInvites(invitesResponse.data.invites || []);
      }
    } catch (error) {
      console.error('Failed to load server data:', error);
      Alert.alert('Error', 'Failed to load server data');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    return isOwner || userRoles.some(role => {
      const roleObj = roles.find(r => r.name === role);
      return roleObj?.permissions.includes(permission);
    });
  };

  // Channel management
  const createChannel = async () => {
    try {
      await serverApi.createChannel(serverId, channelForm);
      setShowChannelModal(false);
      setChannelForm({ name: '', type: 'text', topic: '', isPrivate: false });
      loadServerData();
    } catch (error) {
      console.error('Failed to create channel:', error);
      Alert.alert('Error', 'Failed to create channel');
    }
  };

  const updateChannel = async () => {
    if (!editingChannel) return;
    try {
      await serverApi.updateChannel(serverId, editingChannel._id, channelForm);
      setShowChannelModal(false);
      setEditingChannel(null);
      setChannelForm({ name: '', type: 'text', topic: '', isPrivate: false });
      loadServerData();
    } catch (error) {
      console.error('Failed to update channel:', error);
      Alert.alert('Error', 'Failed to update channel');
    }
  };

  const deleteChannel = async (channelId: string, channelName: string) => {
    Alert.alert(
      'Delete Channel',
      `Are you sure you want to delete #${channelName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await serverApi.deleteChannel(serverId, channelId);
              loadServerData();
            } catch (error) {
              console.error('Failed to delete channel:', error);
              Alert.alert('Error', 'Failed to delete channel');
            }
          },
        },
      ]
    );
  };

  // Role management
  const createRole = async () => {
    try {
      await serverApi.createRole(serverId, roleForm);
      setShowRoleModal(false);
      setRoleForm({ name: '', color: '#99AAB5', permissions: [] });
      loadServerData();
    } catch (error) {
      console.error('Failed to create role:', error);
      Alert.alert('Error', 'Failed to create role');
    }
  };

  const updateRole = async () => {
    if (!editingRole) return;
    try {
      await serverApi.updateRole(serverId, editingRole._id, roleForm);
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleForm({ name: '', color: '#99AAB5', permissions: [] });
      loadServerData();
    } catch (error) {
      console.error('Failed to update role:', error);
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const deleteRole = async (roleId: string, roleName: string) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete the ${roleName} role?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await serverApi.deleteRole(serverId, roleId);
              loadServerData();
            } catch (error) {
              console.error('Failed to delete role:', error);
              Alert.alert('Error', 'Failed to delete role');
            }
          },
        },
      ]
    );
  };

  // Invite management
  const createInvite = async () => {
    try {
      await serverApi.createInvite(serverId, inviteForm);
      setShowInviteModal(false);
      setInviteForm({ maxUses: undefined, expiresIn: undefined });
      loadServerData();
    } catch (error) {
      console.error('Failed to create invite:', error);
      Alert.alert('Error', 'Failed to create invite');
    }
  };

  const revokeInvite = async (inviteCode: string) => {
    Alert.alert(
      'Revoke Invite',
      'Are you sure you want to revoke this invite?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await serverApi.revokeInvite(serverId, inviteCode);
              loadServerData();
            } catch (error) {
              console.error('Failed to revoke invite:', error);
              Alert.alert('Error', 'Failed to revoke invite');
            }
          },
        },
      ]
    );
  };

  const openChannelModal = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelForm({
        name: channel.name,
        type: channel.type,
        topic: channel.topic || '',
        isPrivate: channel.isPrivate,
      });
    } else {
      setEditingChannel(null);
      setChannelForm({ name: '', type: 'text', topic: '', isPrivate: false });
    }
    setShowChannelModal(true);
  };

  const openRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        color: role.color,
        permissions: [...role.permissions],
      });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', color: '#99AAB5', permissions: [] });
    }
    setShowRoleModal(true);
  };

  const togglePermission = (permission: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'channels':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>Channels</Text>
              {hasPermission('manage_channels') && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openChannelModal()}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add Channel</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={channels.sort((a, b) => a.position - b.position)}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.itemInfo}>
                    <Ionicons
                      name={item.type === 'voice' ? 'volume-high' : 'chatbubble'}
                      size={16}
                      color="#b9bbbe"
                    />
                    <Text style={styles.itemName}>#{item.name}</Text>
                    {item.topic && <Text style={styles.itemSubtext}>{item.topic}</Text>}
                  </View>
                  {hasPermission('manage_channels') && (
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openChannelModal(item)}
                      >
                        <Ionicons name="pencil" size={16} color="#b9bbbe" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteChannel(item._id, item.name)}
                      >
                        <Ionicons name="trash" size={16} color="#ed4245" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        );

      case 'roles':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>Roles</Text>
              {hasPermission('manage_roles') && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openRoleModal()}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add Role</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={roles.sort((a, b) => b.position - a.position)}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.itemInfo}>
                    <View style={[styles.roleColor, { backgroundColor: item.color }]} />
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSubtext}>
                      {item.permissions.length} permissions
                    </Text>
                  </View>
                  {hasPermission('manage_roles') && item.name !== '@everyone' && item.name !== 'Owner' && (
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openRoleModal(item)}
                      >
                        <Ionicons name="pencil" size={16} color="#b9bbbe" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteRole(item._id, item.name)}
                      >
                        <Ionicons name="trash" size={16} color="#ed4245" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        );

      case 'members':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>Members ({members.length})</Text>
            </View>
            <FlatList
              data={members}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.itemInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(item.displayName || item.username).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.itemName}>
                        {item.displayName || item.username}
                      </Text>
                      <Text style={styles.itemSubtext}>
                        {item.roles.join(', ') || 'No roles'}
                      </Text>
                    </View>
                  </View>
                  {(hasPermission('kick_members') || hasPermission('manage_roles')) && (
                    <View style={styles.itemActions}>
                      {hasPermission('manage_roles') && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {/* TODO: Open role assignment modal */}}
                        >
                          <Ionicons name="shield" size={16} color="#b9bbbe" />
                        </TouchableOpacity>
                      )}
                      {hasPermission('kick_members') && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {
                            Alert.alert(
                              'Kick Member',
                              `Are you sure you want to kick ${item.displayName || item.username}?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Kick',
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      await serverApi.kickMember(serverId, item._id);
                                      loadServerData();
                                    } catch (error) {
                                      console.error('Failed to kick member:', error);
                                      Alert.alert('Error', 'Failed to kick member');
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="person-remove" size={16} color="#ed4245" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        );

      case 'invites':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>Invites</Text>
              {hasPermission('create_invite') && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowInviteModal(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Create Invite</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={invites}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.code}</Text>
                    <Text style={styles.itemSubtext}>
                      Created by {item.createdBy.displayName || item.createdBy.username}
                    </Text>
                    <Text style={styles.itemSubtext}>
                      Uses: {item.uses}{item.maxUses ? `/${item.maxUses}` : ''}
                      {item.expiresAt && ` • Expires: ${new Date(item.expiresAt).toLocaleDateString()}`}
                    </Text>
                  </View>
                  {hasPermission('create_invite') && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => revokeInvite(item.code)}
                    >
                      <Ionicons name="trash" size={16} color="#ed4245" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{serverName} Settings</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#b9bbbe" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['channels', 'roles', 'members', 'invites'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}

      {/* Channel Modal */}
      <Modal visible={showChannelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingChannel ? 'Edit Channel' : 'Create Channel'}
              </Text>
              <TouchableOpacity onPress={() => setShowChannelModal(false)}>
                <Ionicons name="close" size={24} color="#b9bbbe" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.label}>Channel Name</Text>
              <TextInput
                style={styles.input}
                value={channelForm.name}
                onChangeText={(text) => setChannelForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter channel name"
                placeholderTextColor="#72767d"
              />

              <Text style={styles.label}>Channel Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, channelForm.type === 'text' && styles.selectedType]}
                  onPress={() => setChannelForm(prev => ({ ...prev, type: 'text' }))}
                >
                  <Ionicons name="chatbubble" size={20} color="#b9bbbe" />
                  <Text style={styles.typeText}>Text</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeOption, channelForm.type === 'voice' && styles.selectedType]}
                  onPress={() => setChannelForm(prev => ({ ...prev, type: 'voice' }))}
                >
                  <Ionicons name="volume-high" size={20} color="#b9bbbe" />
                  <Text style={styles.typeText}>Voice</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Topic (Optional)</Text>
              <TextInput
                style={styles.input}
                value={channelForm.topic}
                onChangeText={(text) => setChannelForm(prev => ({ ...prev, topic: text }))}
                placeholder="Enter channel topic"
                placeholderTextColor="#72767d"
                multiline
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Private Channel</Text>
                <Switch
                  value={channelForm.isPrivate}
                  onValueChange={(value) => setChannelForm(prev => ({ ...prev, isPrivate: value }))}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowChannelModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingChannel ? updateChannel : createChannel}
              >
                <Text style={styles.saveButtonText}>
                  {editingChannel ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Modal */}
      <Modal visible={showRoleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRole ? 'Edit Role' : 'Create Role'}
              </Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color="#b9bbbe" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Role Name</Text>
              <TextInput
                style={styles.input}
                value={roleForm.name}
                onChangeText={(text) => setRoleForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter role name"
                placeholderTextColor="#72767d"
              />

              <Text style={styles.label}>Role Color</Text>
              <TextInput
                style={styles.input}
                value={roleForm.color}
                onChangeText={(text) => setRoleForm(prev => ({ ...prev, color: text }))}
                placeholder="#99AAB5"
                placeholderTextColor="#72767d"
              />

              <Text style={styles.label}>Permissions</Text>
              {availablePermissions.map((permission) => (
                <TouchableOpacity
                  key={permission}
                  style={styles.permissionRow}
                  onPress={() => togglePermission(permission)}
                >
                  <Text style={styles.permissionText}>
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Switch
                    value={roleForm.permissions.includes(permission)}
                    onValueChange={() => togglePermission(permission)}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRoleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingRole ? updateRole : createRole}
              >
                <Text style={styles.saveButtonText}>
                  {editingRole ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Invite</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#b9bbbe" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.label}>Max Uses (Optional)</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.maxUses?.toString() || ''}
                onChangeText={(text) => setInviteForm(prev => ({ 
                  ...prev, 
                  maxUses: text ? parseInt(text) : undefined 
                }))}
                placeholder="Unlimited"
                placeholderTextColor="#72767d"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Expires In (Hours, Optional)</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.expiresIn?.toString() || ''}
                onChangeText={(text) => setInviteForm(prev => ({ 
                  ...prev, 
                  expiresIn: text ? parseInt(text) : undefined 
                }))}
                placeholder="Never expires"
                placeholderTextColor="#72767d"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={createInvite}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#40444b',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#40444b',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5865f2',
  },
  tabText: {
    color: '#b9bbbe',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#5865f2',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5865f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#40444b',
    marginBottom: 8,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  itemSubtext: {
    color: '#b9bbbe',
    fontSize: 12,
    marginLeft: 8,
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  roleColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5865f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#36393f',
    borderRadius: 8,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#40444b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    padding: 16,
  },
  label: {
    color: '#b9bbbe',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#40444b',
    color: '#fff',
    padding: 12,
    borderRadius: 4,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#40444b',
    marginRight: 8,
    borderRadius: 4,
  },
  selectedType: {
    backgroundColor: '#5865f2',
  },
  typeText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionText: {
    color: '#fff',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#40444b',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#b9bbbe',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#5865f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ServerManagement;
  