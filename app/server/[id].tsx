import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatMessage } from '../../components/ChatMessage';
import ServerSettingsModal from '../../components/ServerSettingsModal';
import { Colors } from '../../constants/Colors';
import {
  useChannelMessages,
  useSendChannelMessage,
  useServerDetails,
  useServerMembers
} from '../../src/lib/queries';
import {
  initializeSocket,
  joinChannel,
  joinServer,
  onMessageDeleted,
  onMessageReaction,
  onMessageUpdated,
  onNewMessage,
  onTypingIndicator,
  removeAllListeners,
  sendTypingIndicator
} from '../../src/lib/socket';
import { useAuth } from '../../src/providers/AuthProvider';
import { Message } from '../../src/types/message';

export default function ServerScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  
  // Fetch server details and members
  const { 
    data: serverData, 
    isLoading: isLoadingServer,
    error: serverError 
  } = useServerDetails(id as string);
  
  const { 
    data: membersData,
    isLoading: isLoadingMembers 
  } = useServerMembers(id as string);
  
  // Extract server and members data properly
  const server = serverData?.data;
  const members = Array.isArray(membersData?.data) ? membersData.data : [];
  
  // Fetch channel messages only when a channel is selected
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages
  } = useChannelMessages(
    id as string, 
    selectedChannel || ''
  );
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Send message mutation
  const sendMessageMutation = useSendChannelMessage();
  
  // Set the first text channel as selected when server loads
  useEffect(() => {
    if (server?.channels && !selectedChannel) {
      const textChannels = server.channels.filter((c: any) => c.type === 'text');
      if (textChannels.length > 0) {
        setSelectedChannel(textChannels[0]._id);
      }
    }
  }, [server, selectedChannel]);
  
  // Update messages when data changes
  useEffect(() => {
    if (messagesData?.data) {
      setMessages(messagesData.data);
    }
  }, [messagesData]);
  
  // Initialize socket connection and join channels
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await initializeSocket();
        
        // Join server room
        if (id) {
          joinServer(id as string);
        }
        
        // Join channel room if channel is selected
        if (selectedChannel && id) {
          joinChannel(id as string, selectedChannel);
        }
        
        // Listen for new messages
        onNewMessage((newMessage: Message) => {
          if (newMessage.channelId === selectedChannel && newMessage.serverId === id) {
            setMessages(prev => [newMessage, ...prev]);
          }
        });
        
        // Listen for message updates
        onMessageUpdated((updatedMessage: Message) => {
          if (updatedMessage.channelId === selectedChannel) {
            setMessages(prev => prev.map(msg => 
              msg._id === updatedMessage._id ? updatedMessage : msg
            ));
          }
        });
        
        // Listen for message deletions
        onMessageDeleted((messageId: string) => {
          if (messageId) {
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
          }
        });
        
        // Listen for reactions
        onMessageReaction((updatedMessage: Message) => {
          if (updatedMessage.channelId === selectedChannel) {
            setMessages(prev => prev.map(msg => 
              msg._id === updatedMessage._id ? updatedMessage : msg
            ));
          }
        });
        
        // Listen for typing indicators
        onTypingIndicator((data: {
          userId: string;
          username: string;
          isTyping: boolean;
          channelId?: string;
          serverId?: string;
        }) => {
          if (data.channelId === selectedChannel && data.serverId === id && data.userId !== user?._id) {
            if (data.isTyping) {
              setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username]);
            } else {
              setTypingUsers(prev => prev.filter(u => u !== data.username));
            }
          }
        });
      } catch (error) {
        console.error('Error setting up socket:', error);
      }
    };
    
    if (id && user?._id) {
      setupSocket();
    }
    
    return () => {
      removeAllListeners();
    };
  }, [id, selectedChannel, user?._id]);
  
  // Handle channel selection
  const handleChannelSelect = (channelId: string) => {
    setSelectedChannel(channelId);
    setMessages([]); // Clear messages when switching channels
    setTypingUsers([]); // Clear typing users
    
    // Join the new channel
    if (id) {
      joinChannel(id as string, channelId);
    }
  };
  
  // Handle typing indicator
  const handleTyping = () => {
    if (!user?._id || !selectedChannel || !id) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    sendTypingIndicator({
      userId: user._id,
      username: user.username,
      isTyping: true,
      channelId: selectedChannel,
      serverId: id as string
    });
    
    // Set timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedChannel && id && user?._id) {
        sendTypingIndicator({
          userId: user._id,
          username: user.username,
          isTyping: false,
          channelId: selectedChannel,
          serverId: id as string
        });
      }
    }, 1500);
  };
  
  // Send message function
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChannel || !id) return;
    
    sendMessageMutation.mutate({
      serverId: id as string,
      channelId: selectedChannel,
      content: messageText.trim(),
      mentions: [] // Add mentions functionality later
    }, {
      onSuccess: () => {
        setMessageText('');
        
        // Clear typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (selectedChannel && id && user?._id) {
          sendTypingIndicator({
            userId: user._id,
            username: user.username,
            isTyping: false,
            channelId: selectedChannel,
            serverId: id as string
          });
        }
      },
      onError: (error) => {
        console.error('Error sending message:', error);
      }
    });
  };
  
  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  // Organize channels by category
  const textChannels = server?.channels?.filter((c: any) => c.type === 'text') || [];
  const voiceChannels = server?.channels?.filter((c: any) => c.type === 'voice') || [];
  
  // Group members by status - with proper safety checks
  const onlineMembers = members.filter((m: any) => 
    m?.userId?.status === 'online' || 
    m?.userId?.status === 'idle' || 
    m?.userId?.status === 'dnd'
  );

  const offlineMembers = members.filter((m: any) => 
    m?.userId?.status === 'offline' || 
    m?.userId?.status === 'invisible' ||
    !m?.userId?.status
  );

  
  // Get selected channel name
  const selectedChannelName = server?.channels?.find((c: any) => c._id === selectedChannel)?.name || 'general';
  
  // Debugging useEffect
  useEffect(() => {
    console.log('🔍 Server Screen Debug Info:');
    console.log('- Server ID:', id);
    console.log('- Server Data:', serverData);
    console.log('- Server:', server);
    console.log('- Members Data:', membersData);
    console.log('- Members Array:', members);
    console.log('- Members Length:', members?.length);
    console.log('- Is Loading Server:', isLoadingServer);
    console.log('- Is Loading Members:', isLoadingMembers);
    console.log('- Server Error:', serverError?.message);
  }, [serverData, membersData, server, members, isLoadingServer, isLoadingMembers, serverError, id]);
  
  if (isLoadingServer) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading server...</Text>
      </SafeAreaView>
    );
  }

  if (serverError) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load server</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!server) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Server not found</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainLayout}>
        {/* Left sidebar - Channels */}
        <View style={styles.channelsArea}>
          <View style={styles.serverHeader}>
            <Pressable 
              style={styles.serverHeaderContent}
              onPress={() => setShowServerSettings(true)}
            >
              <Text style={styles.serverName} numberOfLines={1}>
                {server.name || 'Loading...'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </Pressable>
          </View>
          
          <ScrollView style={styles.channelsList}>
            {/* Text channels */}
            <View style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
                <Text style={styles.categoryTitle}>TEXT CHANNELS</Text>
                <Pressable style={styles.addChannelButton}>
                  <Ionicons name="add" size={16} color={Colors.textMuted} />
                </Pressable>
              </View>
              
              {textChannels.map((channel: any) => (
                <Pressable
                  key={channel._id}
                  style={[
                    styles.channelItem,
                    selectedChannel === channel._id && styles.selectedChannel
                  ]}
                  onPress={() => handleChannelSelect(channel._id)}
                >
                  <Ionicons 
                    name="chatbubble-outline" 
                    size={20} 
                    color={selectedChannel === channel._id ? Colors.text : Colors.textMuted} 
                  />
                  <Text 
                    style={[
                      styles.channelName,
                      selectedChannel === channel._id && styles.selectedChannelName
                    ]}
                    numberOfLines={1}
                  >
                    {channel.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Voice channels */}
            {voiceChannels.length > 0 && (
              <View style={styles.categoryContainer}>
                <View style={styles.categoryHeader}>
                  <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
                  <Text style={styles.categoryTitle}>VOICE CHANNELS</Text>
                  <Pressable style={styles.addChannelButton}>
                    <Ionicons name="add" size={16} color={Colors.textMuted} />
                  </Pressable>
                </View>
                
                {voiceChannels.map((channel: any) => (
                  <Pressable
                    key={channel._id}
                    style={[
                      styles.channelItem,
                      selectedChannel === channel._id && styles.selectedChannel
                    ]}
                    onPress={() => handleChannelSelect(channel._id)}
                  >
                    <Ionicons 
                      name="volume-medium-outline" 
                      size={20} 
                      color={selectedChannel === channel._id ? Colors.text : Colors.textMuted} 
                    />
                    <Text 
                      style={[
                        styles.channelName,
                        selectedChannel === channel._id && styles.selectedChannelName
                      ]}
                      numberOfLines={1}
                    >
                      {channel.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
          
          {/* User info at bottom */}
          <View style={styles.userInfo}>
            <Image
              source={{ 
                uri: user?.avatarUrl || 
                `https://via.placeholder.com/32/5865f2/ffffff?text=${user?.username?.charAt(0).toUpperCase()}` 
              }}
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userDisplayName} numberOfLines={1}>
                {user?.displayName || user?.username}
              </Text>
              <Text style={styles.userStatus}>
                {user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Online'}
              </Text>
            </View>
            
            <View style={styles.userActions}>
              <Pressable style={styles.userAction}>
                <Ionicons name="mic" size={20} color={Colors.text} />
              </Pressable>
              <Pressable style={styles.userAction}>
                <Ionicons name="headset" size={20} color={Colors.text} />
              </Pressable>
              <Pressable style={styles.userAction}>
                <Ionicons name="settings" size={20} color={Colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Right - Chat area */}
        <View style={styles.chatArea}>
          <View style={styles.chatHeader}>
            <Pressable 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </Pressable>
            <Ionicons 
              name="chatbubble-outline" 
              size={24} 
              color={Colors.textMuted} 
            />
            <Text style={styles.chatChannelName}>#{selectedChannelName}</Text>
            <View style={styles.chatActions}>
              <Pressable style={styles.chatAction}>
                <Ionicons name="notifications" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.chatAction}>
                <Ionicons name="pin" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable 
                style={styles.chatAction}
                onPress={() => setShowMembers(!showMembers)}
              >
                <Ionicons name="people" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.chatAction}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>
          
          <View style={styles.chatContentContainer}>
            <View style={[styles.messagesContainer, showMembers && styles.withMembers]}>
              {/* Welcome message for empty channels or loading */}
              {!selectedChannel ? (
                <View style={styles.welcomeSection}>
                  <Text style={styles.welcomeTitle}>Welcome to {server.name}!</Text>
                  <Text style={styles.welcomeText}>
                    Select a channel to start chatting.
                  </Text>
                </View>
              ) : isLoadingMessages ? (
                <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
              ) : messagesError ? (
                <View style={styles.welcomeSection}>
                  <Text style={styles.errorText}>Failed to load messages</Text>
                  <Pressable style={styles.retryButton} onPress={() => refetchMessages()}>
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : messages.length === 0 ? (
                <View style={styles.welcomeSection}>
                  <Text style={styles.welcomeTitle}>Welcome to #{selectedChannelName}!</Text>
                  <Text style={styles.welcomeText}>
                    This is the start of the #{selectedChannelName} channel.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Messages */}
                  <FlatList
                    data={messages}
                    renderItem={({ item }) => (
                      <ChatMessage 
                        message={item}
                        isMine={item.sender._id === user?._id}
                      />
                    )}
                    keyExtractor={item => item._id}
                    inverted
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                  />
                  
                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <View style={styles.typingContainer}>
                      <Text style={styles.typingText}>
                        {typingUsers.length === 1 
                          ? `${typingUsers[0]} is typing...`
                          : typingUsers.length === 2 
                          ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                          : `${typingUsers.length} people are typing...`
                        }
                      </Text>
                    </View>
                  )}
                </>
              )}
              
              {/* Message Input */}
              {selectedChannel && (
                <View style={styles.inputContainer}>
                  <Pressable style={styles.inputButton}>
                    <Ionicons name="add" size={24} color={Colors.textMuted} />
                  </Pressable>
                  <TextInput
                    style={styles.input}
                    placeholder={`Message #${selectedChannelName}`}
                    placeholderTextColor={Colors.textMuted}
                    value={messageText}
                    onChangeText={(text) => {
                      setMessageText(text);
                      handleTyping();
                    }}
                    multiline
                    maxLength={2000}
                  />
                  <Pressable style={styles.inputButton}>
                    <Ionicons name="happy" size={24} color={Colors.textMuted} />
                  </Pressable>
                  {messageText.trim() ? (
                    <Pressable 
                      style={[
                        styles.sendButton,
                        sendMessageMutation.isPending && styles.sendButtonDisabled
                      ]} 
                      onPress={handleSendMessage}
                      disabled={sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.text} />
                      ) : (
                        <Ionicons name="send" size={20} color={Colors.text} />
                      )}
                    </Pressable>
                  ) : (
                    <Pressable style={styles.inputButton}>
                      <Ionicons name="mic" size={24} color={Colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
            
            {/* Members sidebar */}
            {showMembers && (
              <View style={styles.membersArea}>
                <Text style={styles.membersHeader}>
                  MEMBERS - {isLoadingMembers ? '...' : members.length}
                </Text>
                
                {isLoadingMembers ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
                ) : members.length === 0 ? (
                  <Text style={styles.noMembersText}>No members found</Text>
                ) : (
                  <>
                    {/* Online members */}
                    {onlineMembers.length > 0 && (
                      <>
                        <Text style={styles.memberCategory}>
                          ONLINE - {onlineMembers.length}
                        </Text>
                        {onlineMembers.map((member: any) => {
                          if (!member?.userId) {
                            console.warn('Invalid member data:', member);
                            return null;
                          }
                          
                          return (
                            <View key={member.userId._id} style={styles.memberItem}>
                              <View style={styles.memberAvatar}>
                                <Image
                                  source={{ 
                                    uri: member.userId.avatarUrl || 
                                    `https://via.placeholder.com/32/5865f2/ffffff?text=${member.userId.username?.charAt(0).toUpperCase()}` 
                                  }}
                                  style={styles.memberAvatarImage}
                                />
                                <View 
                                  style={[
                                    styles.statusIndicator, 
                                    { 
                                      backgroundColor: 
                                        member.userId.status === 'online' ? Colors.secondary :
                                        member.userId.status === 'idle' ? Colors.warning :
                                        member.userId.status === 'dnd' ? Colors.error :
                                        Colors.textMuted 
                                    }
                                  ]} 
                                />
                              </View>
                              <Text style={styles.memberName}>
                                {member.nickname || member.userId.displayName || member.userId.username}
                                {member.userId._id === server?.owner && (
                                  <Text style={styles.ownerTag}> • Owner</Text>
                                )}
                              </Text>
                            </View>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Offline members */}
                    {offlineMembers.length > 0 && (
                      <>
                        <Text style={styles.memberCategory}>
                          OFFLINE - {offlineMembers.length}
                        </Text>
                        {offlineMembers.map((member: any) => {
                          if (!member?.userId) {
                            console.warn('Invalid member data:', member);
                            return null;
                          }
                          
                          return (
                            <View key={member.userId._id} style={styles.memberItem}>
                              <View style={styles.memberAvatar}>
                                <Image
                                  source={{ 
                                    uri: member.userId.avatarUrl || 
                                    `https://via.placeholder.com/32/5865f2/ffffff?text=${member.userId.username?.charAt(0).toUpperCase()}` 
                                  }}
                                  style={[styles.memberAvatarImage, styles.offlineMember]}
                                />
                                <View style={[styles.statusIndicator, styles.offlineStatus]} />
                              </View>
                              <Text style={[styles.memberName, styles.offlineName]}>
                                {member.nickname || member.userId.displayName || member.userId.username}
                                {member.userId._id === server?.owner && (
                                  <Text style={styles.ownerTag}> • Owner</Text>
                                )}
                              </Text>
                            </View>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Show message when no members found in both categories */}
                    {onlineMembers.length === 0 && offlineMembers.length === 0 && (
                      <View style={styles.emptyMembersContainer}>
                        <Ionicons name="people" size={32} color={Colors.textMuted} />
                        <Text style={styles.emptyMembersText}>
                          No members found
                        </Text>
                        <Text style={styles.emptyMembersSubtext}>
                          Try refreshing the page
                        </Text>
                        <Pressable 
                          style={styles.refreshButton}
                          onPress={() => {
                            // Add a manual refetch function for members
                            router.replace(`/server/${id}`);
                          }}
                        >
                          <Text style={styles.refreshButtonText}>Refresh</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      <ServerSettingsModal
        visible={showServerSettings}
        onClose={() => setShowServerSettings(false)}
        server={server}
        isOwner={server?.owner === user?._id}
        onServerDeleted={() => {
          router.replace('/(tabs)/home');
        }}
        onServerLeft={() => {
          router.replace('/(tabs)/home');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  channelsArea: {
    width: 240,
    backgroundColor: Colors.surfaceLight,
  },
  serverHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  serverHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  channelsList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  addChannelButton: {
    padding: 4,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  selectedChannel: {
    backgroundColor: Colors.surface,
  },
  channelName: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  selectedChannelName: {
    color: Colors.text,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.surface,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userDetails: {
    flex: 1,
    marginLeft: 8,
  },
  userDisplayName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  userStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
  },
  userAction: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  chatArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chatChannelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  chatActions: {
    flexDirection: 'row',
  },
  chatAction: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  chatContentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  messagesContainer: {
    flex: 1,
  },
  withMembers: {
    flex: 0.7,
  },
  welcomeSection: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  messagesContent: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingContainer: {
    padding: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    margin: 8,
  },
  typingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  membersArea: {
    width: 200,
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: Colors.surface,
  },
  membersHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textMuted,
    marginBottom: 16,
  },
  memberCategory: {
    fontSize: 12,
    color: Colors.textMuted,
    marginVertical: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  memberAvatar: {
    position: 'relative',
    marginRight: 8,
  },
  memberAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
  },
  memberName: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  ownerTag: {
    color: Colors.warning,
    fontSize: 12,
  },
  offlineMember: {
    opacity: 0.5,
  },
  offlineStatus: {
    backgroundColor: Colors.textMuted,
  },
  offlineName: {
    color: Colors.textMuted,
  },
  noMembersText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  emptyMembersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyMembersText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
  emptyMembersSubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  refreshButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});