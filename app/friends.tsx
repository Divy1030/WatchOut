import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import {
  useBlockUser,
  useFriendsList,
  useRemoveFriend,
  useRespondToFriendRequest,
  useSendFriendRequest,
  useUnblockUser
} from '../src/lib/queries';
import { useAuth } from '../src/providers/AuthProvider';

interface Friend {
  userId: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';
    customStatus?: string;
  };
  status: 'pending' | 'accepted' | 'blocked';
  addedAt: string;
  isIncoming?: boolean; // For pending requests
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'blocked' | 'add'>('all');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');

  // API hooks
  const { data: friendsData, isLoading, error, refetch } = useFriendsList();
  const sendFriendRequestMutation = useSendFriendRequest();
  const respondToFriendRequestMutation = useRespondToFriendRequest();
  const removeFriendMutation = useRemoveFriend();
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  // Extract friends data
  const allFriends: Friend[] = friendsData?.data?.friends || [];

  // Filter friends by category - add safety checks
  const acceptedFriends = allFriends.filter(f => f && f.status === 'accepted' && f.userId);
  const onlineFriends = acceptedFriends.filter(f => 
    f && f.userId && 
    (f.userId.status === 'online' || f.userId.status === 'idle' || f.userId.status === 'dnd')
  );
  const pendingFriends = allFriends.filter(f => f && f.status === 'pending' && f.userId);
  const blockedFriends = allFriends.filter(f => f && f.status === 'blocked' && f.userId);

  // Apply search filter - add safety checks
  const filterFriends = (friends: Friend[]) => {
    if (!searchQuery.trim()) return friends;
    return friends.filter(friend => 
      friend && friend.userId && (
        (friend.userId.username && friend.userId.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (friend.userId.displayName && friend.userId.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  };

  // Get friends to show based on active tab
  const getFriendsToShow = () => {
    switch (activeTab) {
      case 'online':
        return filterFriends(onlineFriends);
      case 'all':
        return filterFriends(acceptedFriends);
      case 'pending':
        return filterFriends(pendingFriends);
      case 'blocked':
        return filterFriends(blockedFriends);
      default:
        return [];
    }
  };

  const friendsToShow = getFriendsToShow();

  // Handle friend request response
  const handleFriendRequest = (friendId: string, action: 'accept' | 'reject') => {
    respondToFriendRequestMutation.mutate({ requesterId: friendId, action }, {
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        Alert.alert('Error', `Failed to ${action} friend request`);
      }
    });
  };

  // Handle remove friend
  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFriendMutation.mutate(friendId, {
              onSuccess: () => {
                refetch();
              },
              onError: () => {
                Alert.alert('Error', 'Failed to remove friend');
              }
            });
          }
        }
      ]
    );
  };

  // Handle block user
  const handleBlockUser = (userId: string, userName: string) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName}? You won't receive messages from them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUserMutation.mutate(userId, {
              onSuccess: () => {
                refetch();
              },
              onError: () => {
                Alert.alert('Error', 'Failed to block user');
              }
            });
          }
        }
      ]
    );
  };

  // Handle unblock user
  const handleUnblockUser = (userId: string) => {
    unblockUserMutation.mutate(userId, {
      onSuccess: () => {
        refetch();
      },
      onError: () => {
        Alert.alert('Error', 'Failed to unblock user');
      }
    });
  };

  // Handle send friend request
  const handleSendFriendRequest = () => {
    if (!addFriendInput.trim()) {
      Alert.alert('Error', 'Please enter a username or user ID');
      return;
    }

    sendFriendRequestMutation.mutate(addFriendInput.trim(), {
      onSuccess: () => {
        setAddFriendInput('');
        setShowAddFriend(false);
        Alert.alert('Success', 'Friend request sent!');
        refetch();
      },
      onError: (error: any) => {
        Alert.alert('Error', error.response?.data?.message || 'Failed to send friend request');
      }
    });
  };

  const renderFriend = ({ item }: { item: Friend }) => {
    const friend = item.userId;
    const isPending = item.status === 'pending';
    const isBlocked = item.status === 'blocked';
    const isIncoming = isPending && item.isIncoming;

    return (
      <Pressable
        style={styles.friendItem}
        onPress={() => {
          if (!isBlocked && !isPending) {
            router.push(`/chat/${friend._id}` as any);
          }
        }}
        disabled={isBlocked || isPending}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ 
              uri: friend.avatarUrl || 
              `https://via.placeholder.com/40/5865f2/ffffff?text=${friend.username.charAt(0).toUpperCase()}` 
            }} 
            style={[styles.avatar, isBlocked && styles.blockedAvatar]} 
          />
          {!isBlocked && !isPending && (
            <View style={[
              styles.statusIndicator,
              {
                backgroundColor: 
                  friend.status === 'online' ? Colors.secondary :
                  friend.status === 'idle' ? Colors.warning :
                  friend.status === 'dnd' ? Colors.error :
                  Colors.textMuted
              }
            ]} />
          )}
        </View>
        
        <View style={styles.friendContent}>
          <Text style={[styles.friendName, isBlocked && styles.blockedText]}>
            {friend.displayName || friend.username}
          </Text>
          <Text style={[styles.friendStatus, isBlocked && styles.blockedText]}>
            {isBlocked ? 'Blocked' :
             isPending ? (isIncoming ? 'Incoming Friend Request' : 'Outgoing Friend Request') :
             friend.customStatus || 
             (friend.status === 'online' ? 'Online' : 
              friend.status === 'idle' ? 'Away' :
              friend.status === 'dnd' ? 'Do Not Disturb' : 'Offline')}
          </Text>
        </View>
        
        <View style={styles.friendActions}>
          {isBlocked ? (
            <Pressable 
              style={styles.actionButton}
              onPress={() => handleUnblockUser(friend._id)}
              disabled={unblockUserMutation.isPending}
            >
              <Ionicons name="person-add" size={20} color={Colors.secondary} />
            </Pressable>
          ) : isPending ? (
            isIncoming ? (
              <>
                <Pressable 
                  style={styles.actionButton}
                  onPress={() => handleFriendRequest(friend._id, 'accept')}
                  disabled={respondToFriendRequestMutation.isPending}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.secondary} />
                </Pressable>
                <Pressable 
                  style={styles.actionButton}
                  onPress={() => handleFriendRequest(friend._id, 'reject')}
                  disabled={respondToFriendRequestMutation.isPending}
                >
                  <Ionicons name="close" size={20} color={Colors.error} />
                </Pressable>
              </>
            ) : (
              <Pressable 
                style={styles.actionButton}
                onPress={() => handleRemoveFriend(friend._id, friend.displayName || friend.username)}
                disabled={removeFriendMutation.isPending}
              >
                <Ionicons name="close" size={20} color={Colors.error} />
              </Pressable>
            )
          ) : (
            <>
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push(`/chat/${friend._id}` as any)}
              >
                <Ionicons name="chatbubble" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Pressable 
                style={styles.actionButton}
                onPress={() => handleBlockUser(friend._id, friend.displayName || friend.username)}
                disabled={blockUserMutation.isPending}
              >
                <Ionicons name="ban" size={20} color={Colors.error} />
              </Pressable>
              <Pressable 
                style={styles.actionButton}
                onPress={() => handleRemoveFriend(friend._id, friend.displayName || friend.username)}
                disabled={removeFriendMutation.isPending}
              >
                <Ionicons name="person-remove" size={20} color={Colors.error} />
              </Pressable>
            </>
          )}
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Friends</Text>
        <Pressable 
          style={styles.headerButton}
          onPress={() => setShowAddFriend(true)}
        >
          <Ionicons name="person-add" size={24} color={Colors.text} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends"
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'online' && styles.activeTab]}
          onPress={() => setActiveTab('online')}
        >
          <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>
            Online — {onlineFriends.length}
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All — {acceptedFriends.length}
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending — {pendingFriends.length}
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
          onPress={() => setActiveTab('blocked')}
        >
          <Text style={[styles.tabText, activeTab === 'blocked' && styles.activeTabText]}>
            Blocked — {blockedFriends.length}
          </Text>
        </Pressable>
      </View>
      
      {/* Friends List */}
      {friendsToShow.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={
              activeTab === 'online' ? 'people-outline' :
              activeTab === 'pending' ? 'hourglass-outline' :
              activeTab === 'blocked' ? 'ban-outline' :
              'person-add-outline'
            } 
            size={64} 
            color={Colors.textMuted} 
          />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No results found' :
             activeTab === 'online' ? 'No friends online' :
             activeTab === 'pending' ? 'No pending requests' :
             activeTab === 'blocked' ? 'No blocked users' :
             'No friends yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try a different search term' :
             activeTab === 'online' ? 'Your friends will appear here when they come online' :
             activeTab === 'pending' ? 'Friend requests will appear here' :
             activeTab === 'blocked' ? 'Blocked users will appear here' :
             'Add some friends to get started!'}
          </Text>
          {!searchQuery && activeTab === 'all' && (
            <Pressable 
              style={styles.addFriendButton}
              onPress={() => setShowAddFriend(true)}
            >
              <Text style={styles.addFriendButtonText}>Add Friend</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={friendsToShow}
          renderItem={renderFriend}
          keyExtractor={(item) => item && item.userId && item.userId._id ? item.userId._id : `friend-${Math.random()}`}
          style={styles.friendsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.friendsListContent}
        />
      )}

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriend}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddFriend(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <Pressable 
                onPress={() => setShowAddFriend(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Enter a username or user ID to send a friend request
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Username or User ID"
              placeholderTextColor={Colors.textMuted}
              value={addFriendInput}
              onChangeText={setAddFriendInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalActions}>
              <Pressable 
                style={styles.modalCancelButton}
                onPress={() => setShowAddFriend(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[
                  styles.modalSendButton,
                  (!addFriendInput.trim() || sendFriendRequestMutation.isPending) && styles.modalSendButtonDisabled
                ]}
                onPress={handleSendFriendRequest}
                disabled={!addFriendInput.trim() || sendFriendRequestMutation.isPending}
              >
                {sendFriendRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Text style={styles.modalSendText}>Send Request</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.text,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.text,
  },
  friendsList: {
    flex: 1,
  },
  friendsListContent: {
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  blockedAvatar: {
    opacity: 0.5,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  friendContent: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  blockedText: {
    color: Colors.textMuted,
  },
  friendActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addFriendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  addFriendButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  modalSendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSendButtonDisabled: {
    opacity: 0.5,
  },
  modalSendText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});