import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import {
  useBlockUser,
  useChangePassword,
  useFriendsList,
  useRemoveFriend,
  useRespondToFriendRequest,
  useSendFriendRequest,
  useUnblockUser,
  useUpdateUserProfile,
  useUpdateProfilePhoto,
  useUpdateUserStatus,
  useUserProfile
} from '../../src/lib/queries';
import { useAuth } from '../../src/providers/AuthProvider';

interface Friend {
  _id: string;
  userId: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';
    customStatus?: string;
  };
  status: 'pending' | 'accepted' | 'blocked';
  isIncoming: boolean;
  addedAt: string;
}

type TabType = 'friends' | 'pending' | 'blocked' | 'add';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Profile edit states
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
  const [editCustomStatus, setEditCustomStatus] = useState(user?.customStatus || '');
  const [selectedStatus, setSelectedStatus] = useState(user?.status || 'online');

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Add friend state
  const [friendUsername, setFriendUsername] = useState('');

  // API hooks
  const { data: profileData, refetch: refetchProfile } = useUserProfile();
  const { 
    data: friendsData, 
    isLoading: isLoadingFriends,
    refetch: refetchFriends 
  } = useFriendsList();

  // Mutations
  const updateProfileMutation = useUpdateUserProfile();
  const updateStatusMutation = useUpdateUserStatus();
  const changePasswordMutation = useChangePassword();
  const sendFriendRequestMutation = useSendFriendRequest();
  const respondToFriendRequestMutation = useRespondToFriendRequest();
  const removeFriendMutation = useRemoveFriend();
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();
  const updateProfilePhotoMutation = useUpdateProfilePhoto();

  // Extract friends data
  const friends = friendsData?.data?.friends || [];
  const acceptedFriends = friends.filter((f: Friend) => f.status === 'accepted');
  const pendingRequests = friends.filter((f: Friend) => f.status === 'pending');
  const incomingRequests = pendingRequests.filter((f: Friend) => f.isIncoming);
  const outgoingRequests = pendingRequests.filter((f: Friend) => !f.isIncoming);
  const blockedUsers = friends.filter((f: Friend) => f.status === 'blocked');

  // Filter friends based on search
  const filteredFriends = acceptedFriends.filter((friend: Friend) =>
    friend.userId.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.userId.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status options
  const statusOptions = [
    { value: 'online', label: 'Online', color: Colors.secondary, icon: 'checkmark-circle' },
    { value: 'idle', label: 'Away', color: Colors.warning, icon: 'time' },
    { value: 'dnd', label: 'Do Not Disturb', color: Colors.error, icon: 'remove-circle' },
    { value: 'invisible', label: 'Invisible', color: Colors.textMuted, icon: 'eye-off' },
  ];

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        displayName: editDisplayName.trim() || undefined,
      });
      
      await updateStatusMutation.mutateAsync({ 
        status: selectedStatus,
        customStatus: editCustomStatus.trim() || undefined,
      });
      
      setShowEditProfile(false);
      refetchProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
      });
      
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };

  // Send friend request
  const handleSendFriendRequest = async () => {
    if (!friendUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      await sendFriendRequestMutation.mutateAsync(friendUsername.trim());
      
      setFriendUsername('');
      setShowAddFriend(false);
      refetchFriends();
      Alert.alert('Success', 'Friend request sent');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  // Respond to friend request
  const handleRespondToRequest = async (friendId: string, action: 'accept' | 'reject') => {
    try {
      await respondToFriendRequestMutation.mutateAsync({
        requesterId: friendId,
        action,
      });
      
      refetchFriends();
      Alert.alert('Success', `Friend request ${action}ed`);
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${action} friend request`);
    }
  };

  // Remove friend
  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriendMutation.mutateAsync(friendId);
              refetchFriends();
              Alert.alert('Success', 'Friend removed');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  // Block user
  const handleBlockUser = (userId: string, userName: string) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUserMutation.mutateAsync(userId);
              refetchFriends();
              Alert.alert('Success', 'User blocked');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  // Unblock user
  const handleUnblockUser = async (userId: string) => {
    try {
      await unblockUserMutation.mutateAsync(userId);
      refetchFriends();
      Alert.alert('Success', 'User unblocked');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unblock user');
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos to update your avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const name = uri.split('/').pop() || 'avatar.jpg';
        const type = asset.type || 'image/jpeg';

        const formData = new FormData();
        formData.append('avatar', {
          uri,
          name,
          type,
        } as any);

        await updateProfilePhotoMutation.mutateAsync(formData);
        refetchProfile();
        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile photo');
    }
  };

  // Render friend item
  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <Pressable 
        style={styles.friendContent}
        onPress={() => router.push(`/chat/${item.userId._id}` as any)}
      >
        <View style={styles.friendAvatar}>
          <Image
            source={{
              uri: item.userId.avatarUrl ||
                `https://via.placeholder.com/40/5865f2/ffffff?text=${item.userId.username.charAt(0).toUpperCase()}`
            }}
            style={styles.avatarImage}
          />
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.userId.status === 'online' ? Colors.secondary :
                  item.userId.status === 'idle' ? Colors.warning :
                  item.userId.status === 'dnd' ? Colors.error :
                  Colors.textMuted
              }
            ]}
          />
        </View>
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.userId.displayName || item.userId.username}
          </Text>
          <Text style={styles.friendStatus}>
            {item.userId.customStatus ||
             (item.userId.status === 'dnd' ? 'Do Not Disturb' :
              item.userId.status === 'idle' ? 'Away' :
              item.userId.status.charAt(0).toUpperCase() + item.userId.status.slice(1))}
          </Text>
        </View>
      </Pressable>
      
      <View style={styles.friendActions}>
        <Pressable
          style={styles.friendAction}
          onPress={() => router.push(`/chat/${item.userId._id}` as any)}
        >
          <Ionicons name="chatbubble" size={20} color={Colors.primary} />
        </Pressable>
        
        <Pressable
          style={styles.friendAction}
          onPress={() => handleRemoveFriend(item._id, item.userId.displayName || item.userId.username)}
        >
          <Ionicons name="person-remove" size={20} color={Colors.error} />
        </Pressable>
        
        <Pressable
          style={styles.friendAction}
          onPress={() => handleBlockUser(item.userId._id, item.userId.displayName || item.userId.username)}
        >
          <Ionicons name="ban" size={20} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );

  // Render pending request item
  const renderPendingItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendContent}>
        <View style={styles.friendAvatar}>
          <Image
            source={{
              uri: item.userId.avatarUrl ||
                `https://via.placeholder.com/40/5865f2/ffffff?text=${item.userId.username.charAt(0).toUpperCase()}`
            }}
            style={styles.avatarImage}
          />
        </View>
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.userId.displayName || item.userId.username}
          </Text>
          <Text style={styles.friendStatus}>
            {item.isIncoming ? 'Incoming friend request' : 'Outgoing friend request'}
          </Text>
        </View>
      </View>
      
      {item.isIncoming ? (
        <View style={styles.friendActions}>
          <Pressable
            style={[styles.friendAction, styles.acceptButton]}
            onPress={() => handleRespondToRequest(item._id, 'accept')}
          >
            <Ionicons name="checkmark" size={20} color={Colors.text} />
          </Pressable>
          
          <Pressable
            style={[styles.friendAction, styles.declineButton]}
            onPress={() => handleRespondToRequest(item._id, 'reject')}
          >
            <Ionicons name="close" size={20} color={Colors.text} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.friendActions}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      )}
    </View>
  );

  // Render blocked user item
  const renderBlockedItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendContent}>
        <View style={styles.friendAvatar}>
          <Image
            source={{
              uri: item.userId.avatarUrl ||
                `https://via.placeholder.com/40/5865f2/ffffff?text=${item.userId.username.charAt(0).toUpperCase()}`
            }}
            style={[styles.avatarImage, styles.blockedAvatar]}
          />
        </View>
        
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, styles.blockedName]}>
            {item.userId.displayName || item.userId.username}
          </Text>
          <Text style={styles.friendStatus}>Blocked</Text>
        </View>
      </View>
      
      <View style={styles.friendActions}>
        <Pressable
          style={[styles.friendAction, styles.unblockButton]}
          onPress={() => handleUnblockUser(item.userId._id)}
        >
          <Text style={styles.unblockText}>Unblock</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable style={styles.headerButton} onPress={() => setShowEditProfile(true)}>
          <Ionicons name="settings" size={24} color={Colors.text} />
        </Pressable>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <View style={{ position: 'relative' }}>
            <Image
              source={{
                uri: user?.avatarUrl ||
                  `https://via.placeholder.com/80/5865f2/ffffff?text=${user?.username?.charAt(0).toUpperCase()}`
              }}
              style={styles.userAvatar}
            />
            {/* Edit Avatar Icon */}
            <Pressable
              style={styles.editAvatarIcon}
              onPress={handleAvatarUpload}
            >
              <Ionicons name="camera" size={22} color={Colors.text} />
            </Pressable>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user?.displayName || user?.username}
            </Text>
            <Text style={styles.userUsername}>@{user?.username}</Text>
            <View style={styles.userStatusContainer}>
              <View
                style={[
                  styles.userStatusDot,
                  {
                    backgroundColor:
                      user?.status === 'online' ? Colors.secondary :
                      user?.status === 'idle' ? Colors.warning :
                      user?.status === 'dnd' ? Colors.error :
                      Colors.textMuted
                  }
                ]}
              />
              <Text style={styles.userStatusText}>
                {user?.customStatus ||
                 (user?.status === 'dnd' ? 'Do Not Disturb' :
                  user?.status === 'idle' ? 'Away' :
                  user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Online')}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.userActions}>
          <Pressable style={styles.userActionButton} onPress={() => setShowEditProfile(true)}>
            <Ionicons name="create" size={20} color={Colors.primary} />
            <Text style={styles.userActionText}>Edit</Text>
          </Pressable>
          <Pressable style={styles.userActionButton} onPress={() => setShowChangePassword(true)}>
            <Ionicons name="lock-closed" size={20} color={Colors.primary} />
            <Text style={styles.userActionText}>Password</Text>
          </Pressable>
          <Pressable style={[styles.userActionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color={Colors.error} />
            <Text style={[styles.userActionText, styles.logoutText]}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {/* Friends Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends ({acceptedFriends.length})
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pending ({pendingRequests.length})
            </Text>
            {incomingRequests.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{incomingRequests.length}</Text>
              </View>
            )}
          </Pressable>
          
          <Pressable
            style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
            onPress={() => setActiveTab('blocked')}
          >
            <Text style={[styles.tabText, activeTab === 'blocked' && styles.activeTabText]}>
              Blocked ({blockedUsers.length})
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.tab, activeTab === 'add' && styles.activeTab]}
            onPress={() => setActiveTab('add')}
          >
            <Ionicons 
              name="person-add" 
              size={20} 
              color={activeTab === 'add' ? Colors.primary : Colors.textMuted} 
            />
          </Pressable>
        </ScrollView>
      </View>

      {/* Search Bar (for friends tab) */}
      {activeTab === 'friends' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'friends' && (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No friends yet</Text>
                <Text style={styles.emptySubtitle}>Add some friends to get started</Text>
              </View>
            }
          />
        )}

        {activeTab === 'pending' && (
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="hourglass" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No pending requests</Text>
                <Text style={styles.emptySubtitle}>All friend requests have been resolved</Text>
              </View>
            }
          />
        )}

        {activeTab === 'blocked' && (
          <FlatList
            data={blockedUsers}
            renderItem={renderBlockedItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="ban" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No blocked users</Text>
                <Text style={styles.emptySubtitle}>Users you block will appear here</Text>
              </View>
            }
          />
        )}

        {activeTab === 'add' && (
          <View style={styles.addFriendContainer}>
            <Text style={styles.addFriendTitle}>Add Friend</Text>
            <Text style={styles.addFriendSubtitle}>
              Enter a username to send a friend request
            </Text>
            
            <View style={styles.addFriendForm}>
              <TextInput
                style={styles.addFriendInput}
                placeholder="Username"
                placeholderTextColor={Colors.textMuted}
                value={friendUsername}
                onChangeText={setFriendUsername}
                autoCapitalize="none"
              />
              <Pressable
                style={[
                  styles.addFriendButton,
                  !friendUsername.trim() && styles.addFriendButtonDisabled
                ]}
                onPress={handleSendFriendRequest}
                disabled={!friendUsername.trim() || sendFriendRequestMutation.isPending}
              >
                {sendFriendRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Text style={styles.addFriendButtonText}>Send Request</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowEditProfile(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Pressable 
              onPress={handleUpdateProfile}
              disabled={updateProfileMutation.isPending || updateStatusMutation.isPending}
            >
              {updateProfileMutation.isPending || updateStatusMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </Pressable>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Display Name</Text>
              <TextInput
                style={styles.formInput}
                value={editDisplayName}
                onChangeText={setEditDisplayName}
                placeholder="Enter display name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Custom Status</Text>
              <TextInput
                style={styles.formInput}
                value={editCustomStatus}
                onChangeText={setEditCustomStatus}
                placeholder="What's on your mind?"
                placeholderTextColor={Colors.textMuted}
                maxLength={100}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              {statusOptions.map((status) => (
                <Pressable
                  key={status.value}
                  style={[
                    styles.statusOption,
                    selectedStatus === status.value && styles.selectedStatusOption
                  ]}
                  onPress={() => setSelectedStatus(status.value as 'online' | 'offline' | 'idle' | 'dnd' | 'invisible')}
                >
                  <Ionicons name={status.icon as any} size={20} color={status.color} />
                  <Text style={styles.statusOptionText}>{status.label}</Text>
                  {selectedStatus === status.value && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowChangePassword(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Pressable 
              onPress={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </Pressable>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Current Password</Text>
              <TextInput
                style={styles.formInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>New Password</Text>
              <TextInput
                style={styles.formInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.formInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userUsername: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  userStatusText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  userActionText: {
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  logoutText: {
    color: Colors.error,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.text,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  friendStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
  },
  friendAction: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
  },
  acceptButton: {
    backgroundColor: Colors.secondary,
  },
  declineButton: {
    backgroundColor: Colors.error,
  },
  pendingText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  blockedAvatar: {
    opacity: 0.5,
  },
  blockedName: {
    color: Colors.textMuted,
  },
  unblockButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
  },
  unblockText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  addFriendContainer: {
    padding: 16,
  },
  addFriendTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  addFriendSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addFriendForm: {
    gap: 12,
  },
  addFriendInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
  },
  addFriendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addFriendButtonDisabled: {
    opacity: 0.5,
  },
  addFriendButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalCancel: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  modalSave: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedStatusOption: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    flex: 1,
    color: Colors.text,
    marginLeft: 12,
    fontSize: 16,
  },
  editAvatarIcon: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    zIndex: 2,
  },
});