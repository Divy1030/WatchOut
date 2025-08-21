import { FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatMessage } from '../../components/ChatMessage';
import ServerSettingsModal from '../../components/ServerSettingsModal';
import { Colors } from '../../constants/Colors';
import {
  useAddReaction,
  useChannelMessages,
  useDeleteMessage,
  useEditMessage,
  useRemoveReaction,
  useSendChannelMessage,
  useServerDetails,
  useServerMembers
} from '../../src/lib/queries';
import { API_URL } from '../../src/constants/config';
import { messageApi } from '../../src/lib/api';
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
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ServerScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(!isSmallDevice);
  const [showChannels, setShowChannels] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showReactionBar, setShowReactionBar] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Mutations
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();
  const deleteMessageMutation = useDeleteMessage();
  const editMessageMutation = useEditMessage();
  const sendMessageMutation = useSendChannelMessage();

  // Fetch server details and members
  const { 
    data: serverData, 
    isLoading: isLoadingServer,
    error: serverError,
    refetch: refetchServer
  } = useServerDetails(id as string);
  
  const { 
    data: membersData,
    isLoading: isLoadingMembers,
    error: membersDataError,
    refetch: refetchMembers
  } = useServerMembers(id as string);
  
  // Extract server and members data safely
  const server = serverData?.data?.server || serverData?.data;
  
  // Fix members data processing
  const members = useMemo(() => {
    // Process members data safely
    if (!membersData) return [];
    
    console.log('Processing members data:', JSON.stringify(membersData).substring(0, 100) + '...');
    
    const rawMembers = membersData.data?.members || [];
    
    // Ensure members is an array
    if (!Array.isArray(rawMembers)) {
      console.warn('Members data is not an array:', rawMembers);
      setMembersError('Invalid members data structure');
      return [];
    }

    // Map members data to ensure consistent structure
    return rawMembers.map(member => {
      // If member is already in the right format, return it
      if (member.userId && (typeof member.userId === 'object' || typeof member.userId === 'string')) {
        return member;
      }
      
      // If member has direct user properties (_id, username, etc.), restructure it
      if (member._id) {
        return {
          roles: member.roles || [],
          _id: member._id,
          userId: {
            _id: member._id,
            username: member.username || 'Unknown',
            displayName: member.displayName,
            avatarUrl: member.avatarUrl,
            status: member.status || 'offline'
          }
        };
      }
      
      // Fallback for unexpected format
      return {
        _id: `unknown-${Math.random().toString(36).substring(2, 10)}`,
        userId: {
          _id: `unknown-${Math.random().toString(36).substring(2, 10)}`,
          username: 'Unknown User',
          status: 'offline'
        },
        roles: ['@everyone']
      };
    });
  }, [membersData]);
  
  // Debug members processing
  useEffect(() => {
    if (members.length > 0) {
      console.log('Processed members:', members.length);
      console.log('First member sample:', JSON.stringify(members[0]).substring(0, 100) + '...');
    }
  }, [members]);
  
  // Handle auth errors and retry mechanism
  useEffect(() => {
    if (membersDataError?.message?.includes('Unauthorized')) {
      console.log('Authentication error detected, refreshing token...');
      // Retry after a delay, but limit to 3 attempts
      if (retryCount < 3) {
        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          refetchMembers();
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setMembersError('Session expired. Please try logging in again.');
      }
    } else if (membersDataError) {
      console.error('Members error:', membersDataError);
      setMembersError('Failed to load members');
    }
  }, [membersDataError, retryCount]);
  
  // Update the channelMessages hook usage to fetch messages immediately when a channel is selected
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages
  } = useChannelMessages(
    id as string, 
    selectedChannel || '',
    // {enabled: !!selectedChannel,}
  );
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Set the first text channel as selected when server loads
  useEffect(() => {
    if (server?.channels && !selectedChannel) {
      const textChannels = server.channels.filter((c: any) => c.type === 'text');
      if (textChannels.length > 0) {
        setSelectedChannel(textChannels[0]._id);
      }
    }
  }, [server, selectedChannel]);
  
  // Improve the useEffect for handling messages data
  useEffect(() => {
    if (messagesData?.data && selectedChannel) {
      console.log(`Received ${messagesData.data.length} messages for channel ${selectedChannel}`);
      
      // If we have messagesData, set it immediately
      setMessages(messagesData.data);
      
      // Scroll to bottom (top in inverted list) after messages load
      setTimeout(() => {
        if (flatListRef.current && messagesData.data.length > 0) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        }
      }, 100);
    } else if (selectedChannel) {
      // If no messages data but channel is selected, clear messages
      setMessages([]);
    }
  }, [messagesData, selectedChannel]);
  
  // When changing channels, update the useEffect to fetch messages immediately
  useEffect(() => {
    if (selectedChannel && id) {
      // Clear previous messages when switching channels
      setMessages([]);
      
      // Join the channel socket room
      joinChannel(id as string, selectedChannel);
      
      // Explicitly trigger a fetch of messages for the new channel
      refetchMessages();
      
      console.log(`Switched to channel ${selectedChannel}, fetching messages...`);
    }
  }, [selectedChannel, id]);
  
  // Initialize socket connection and join channels
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await initializeSocket();
        
        // Join server room
        if (id) {
          joinServer(id as string);
          console.log(`Joined server room: server:${id}`);
        }
        
        // Join channel room if channel is selected
        if (selectedChannel && id) {
          joinChannel(id as string, selectedChannel);
          console.log(`Joined channel room: channel:${selectedChannel}`);
        }
        
        // Listen for new messages
        onNewMessage((newMessage: Message) => {
          if (newMessage.channelId === selectedChannel && newMessage.serverId === id) {
            console.log('New message received:', newMessage.content.substring(0, 20));
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
    // Select the new channel
    setSelectedChannel(channelId);
    
    // Clear existing messages and typing users
    setMessages([]); 
    setTypingUsers([]);
    
    // Show loading state immediately
    // (optional) You can add a local loading state here if needed
    
    // Join the new channel
    if (id) {
      joinChannel(id as string, channelId);
      console.log(`Switched to channel: ${channelId}`);
    }
    
    // On small devices, hide channels panel after selection
    if (isSmallDevice) {
      setShowChannels(false);
    }
    
    // Fetch messages immediately with a minimal delay
    setTimeout(() => {
      refetchMessages();
    }, 50); // Small timeout to ensure the channel is set first
  };
  
  // Typing indicator handler
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

  // Add this with your other handlers
const handleRefreshMembers = () => {
  setRetryCount(0);
  refetchMembers();
};
  
  // Image picker handler
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // Fixed: Capital 'I'
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = asset.fileName || uri.split('/').pop() || 'image.jpg';
      const fileType = asset.mimeType || 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: fileType,
      } as any);

      const token = await AsyncStorage.getItem('accessToken');
      console.log('Uploading image:', { uri, fileName, fileType });

      const uploadRes = await fetch(`${API_URL}/api/v1/messages/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadText = await uploadRes.text();
      console.log('Upload response:', uploadRes.status, uploadText);

      if (uploadRes.status !== 200) {
        alert('Upload failed');
        return;
      }

      const uploadData = JSON.parse(uploadText);
      if (!uploadData.data || !uploadData.data.attachment || !uploadData.data.attachment.url) {
        alert('Upload failed');
        return;
      }
      const attachment = uploadData.data.attachment;

      // Send channel message with attachment
      if (selectedChannel) {
        await messageApi.sendChannelMessageWithAttachments(id as string, selectedChannel, {
          content: '',
          attachments: [attachment],
        });
        setInputText('');
        setTimeout(() => refetchMessages(), 100);
      } else {
        alert('No channel selected');
      }
    }
  };

  // Send message handler
  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedChannel || !id) return;
    if (editingMessage) {
      editMessageMutation.mutate(
        { messageId: editingMessage._id, content: inputText.trim() },
        {
          onSuccess: () => {
            setEditingMessage(null);
            setInputText('');
            // Don't just refetch, but ensure messages are updated
            setTimeout(() => refetchMessages(), 100);
          }
        }
      );
      return;
    }
    sendMessageMutation.mutate({
      serverId: id as string,
      channelId: selectedChannel,
      content: inputText.trim(),
      mentions: [], // Add mention logic if needed
      replyTo: replyingTo?._id,
    }, {
      onSuccess: (newMessage) => {
        setInputText('');
        setReplyingTo(null);
        // Add the new message immediately to the state for instant feedback
        if (newMessage?.data) {
          setMessages(prev => [newMessage.data, ...prev]);
        }
        // Also refetch to ensure consistency
        setTimeout(() => refetchMessages(), 100);
      }
    });
  };

  // Delete message handler
  const handleDeleteMessage = (messageId: string) => {
    deleteMessageMutation.mutate(messageId, {
      onSuccess: () => {
        refetchMessages();
      }
    });
  };

  // --- Add missing handlers ---
  const handleReply = (message: any) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => setReplyingTo(null);

  // Message rendering (replace your FlatList renderItem with this)
  const renderMessageItem = ({ item }: { item: any }) => {
    const isMine = item.sender._id === user?._id;
    const senderName = item.sender.displayName || item.sender.username;
    return (
      <Pressable
        style={[
          styles.messageContainer,
          isMine ? styles.myMessage : styles.theirMessage
        ]}
        onLongPress={() => setShowReactionBar(item._id)}
      >
        <View style={[
          styles.messageBubble,
          isMine ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          {/* Reply indicator if this message is a reply */}
          {item.replyTo && item.replyTo.sender && (
            <View style={styles.replyContainer}>
              <Text style={styles.replyText}>
                Replying to {item.replyTo.sender.displayName || item.replyTo.sender.username}
              </Text>
              <Text style={styles.replyContent} numberOfLines={1}>
                {item.replyTo.content}
              </Text>
            </View>
          )}
          {!isMine && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}

          {/* Attachments (images) */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={{ marginVertical: 4 }}>
              {item.attachments.map((att: any, idx: number) =>
                att.type === 'image' && att.url ? (
                  <Image
                    key={idx}
                    source={{ uri: att.url }}
                    style={{ width: 180, height: 180, borderRadius: 8, marginBottom: 4 }}
                    resizeMode="cover"
                  />
                ) : (
                  <TouchableOpacity key={idx} onPress={() => {/* open file */}}>
                    <Text style={{ color: '#53bdeb' }}>{att.name}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}

          {/* Only render text if not blank */}
          {item.content && item.content.trim().length > 0 && (
            <Text style={[
              styles.messageText,
              isMine ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.content.split(/(\s@[a-zA-Z0-9_]+)/).map((part: string, index: number) => {
                if (part.match(/\s@[a-zA-Z0-9_]+/)) {
                  return (
                    <Text key={index} style={styles.mentionText}>
                      {part}
                    </Text>
                  );
                }
                return <Text key={index}>{part}</Text>;
              })}
            </Text>
          )}
          <View style={styles.messageTimeWrapper}>
            <Text style={[
              styles.messageTime,
              isMine ? styles.messageTime : styles.theirMessage
            ]}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {item.isEdited && <Text style={styles.editedText}> (edited)</Text>}
            </Text>
            {isMine && (
              <MaterialCommunityIcons
                name="check-all"
                size={14}
                color={item.read ? '#53bdeb' : '#7D7D7D'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
        {/* Message actions row */}
        <View style={styles.messageActionsRow}>
          <TouchableOpacity onPress={() => handleReply(item)}>
            <Ionicons name="return-up-back" size={18} color="#53bdeb" />
          </TouchableOpacity>
          {isMine && (
            <>
              <TouchableOpacity
                onPress={() => {
                  setEditingMessage(item);
                  setInputText(item.content);
                  inputRef.current?.focus();
                }}>
                <MaterialIcons name="edit" size={18} color="#bbb" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteMessage(item._id)}>
                <MaterialIcons name="delete" size={18} color="#e74c3c" />
              </TouchableOpacity>
            </>
          )}
        </View>
        {/* Emoji Reaction Bar */}
        {showReactionBar === item._id && (
          <View style={styles.reactionBar}>
            {EMOJI_REACTIONS.map((emoji) => {
                const userReacted = item.reactions?.find(
                  (r: any) => r.emoji === emoji && r.users.some((u: any) => u._id === user?._id)
                );
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.reactionButton,
                    userReacted && styles.reactionSelected
                  ]}
                  onPress={() => {
                    if (userReacted) {
                      removeReactionMutation.mutate({ messageId: item._id, emoji });
                    } else {
                      addReactionMutation.mutate({ messageId: item._id, emoji });
                    }
                    setShowReactionBar(null);
                  }}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.reactionCloseButton}
              onPress={() => setShowReactionBar(null)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(item.content);
                setShowReactionBar(null);
              }}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {/* Reactions display */}
        {item.reactions && item.reactions.length > 0 && (
          <View style={styles.reactionsRow}>
            {item.reactions.map((reaction: any, idx: number) => (
              <TouchableOpacity
                key={reaction.emoji + idx}
                style={[
                  styles.reactionDisplay,
                  reaction.users.some((u: any) => u._id === user?._id) && styles.reactionSelected
                ]}
                onPress={() => {
                  if (reaction.users.some((u: any) => u._id === user?._id)) {
                    removeReactionMutation.mutate({ messageId: item._id, emoji: reaction.emoji });
                  } else {
                    addReactionMutation.mutate({ messageId: item._id, emoji: reaction.emoji });
                  }
                }}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                <Text style={styles.reactionCount}>{reaction.users.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  // Organize channels by category
  const textChannels = server?.channels?.filter((c: any) => c.type === 'text') || [];
  const voiceChannels = server?.channels?.filter((c: any) => c.type === 'voice') || [];
  
  // Group members by status - with proper safety checks
  const onlineMembers = members.filter((m: any) => {
    if (!m?.userId) return false;
    const status = m.userId.status;
    return status === 'online' || status === 'idle' || status === 'dnd';
  });

  const offlineMembers = members.filter((m: any) => {
    if (!m?.userId) return false;
    const status = m.userId.status;
    return !status || status === 'offline' || status === 'invisible';
  });

  // Get selected channel name
  const selectedChannelName = server?.channels?.find((c: any) => c._id === selectedChannel)?.name || 'general';
  
  // Debugging useEffect
  useEffect(() => {
    console.log('🔍 Server Screen Debug Info:');
    console.log('- Server ID:', id);
    console.log('- Members Array:', members);
    console.log('- Members Length:', members?.length);
    console.log('- Is Loading Server:', isLoadingServer);
    console.log('- Is Loading Members:', isLoadingMembers);
    console.log('- Server Error:', serverError?.message);
    console.log('- Members Error:', membersDataError?.message);
    
    if (membersData) {
      console.log('- Raw Members Data:', JSON.stringify(membersData).substring(0, 200));
    }
  }, [serverData, membersData, server, members, isLoadingServer, isLoadingMembers, serverError, membersDataError, id]);
  
  // Add keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  
  // Handle mentions in input text
  useEffect(() => {
    // Only show mention suggestions if @ is followed by at least one character
    const mentionMatch = inputText.match(/@(\w{1,})$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      // Filter server members for mentions
      const filteredMembers = members.filter(member => {
        const username = member.userId?.username || '';
        const displayName = member.userId?.displayName || '';
        return username.toLowerCase().includes(query.toLowerCase()) ||
               displayName.toLowerCase().includes(query.toLowerCase());
      });
      setMentionResults(filteredMembers.slice(0, 5)); // Limit to 5 results
      setMentionQuery(query);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }, [inputText, members]);

  // Handle selecting a user to mention
  const handleMentionSelect = (member: any) => {
    const username = member.userId?.username || 'unknown';
    const newText = inputText.replace(/@\w*$/, `@${username} `);
    setInputText(newText);
    setMentionQuery(null);
    setMentionResults([]);
    inputRef.current?.focus();
  };

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Server header - always visible */}
      <View style={styles.serverHeader}>
        <Pressable 
          style={styles.serverHeaderContent}
          onPress={() => setShowServerSettings(true)}
        >
          {server.iconUrl ? (
            <Image 
              source={{ uri: server.iconUrl }} 
              style={styles.serverIcon} 
            />
          ) : (
            <View style={styles.serverIconPlaceholder}>
              <Text style={styles.serverIconText}>
                {server.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.serverName} numberOfLines={1}>
            {server.name || 'Loading...'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.text} />
        </Pressable>
        
        <View style={styles.headerActions}>
          {isSmallDevice && (
            <Pressable 
              style={styles.headerAction}
              onPress={() => setShowChannels(!showChannels)}
            >
              <Ionicons 
                name={showChannels ? "menu" : "chatbubble-outline"} 
                size={22} 
                color={Colors.text} 
              />
            </Pressable>
          )}
          {isSmallDevice && (
            <Pressable 
              style={styles.headerAction}
              onPress={() => setShowMembers(!showMembers)}
            >
              <Ionicons name="people" size={22} color={Colors.text} />
              {members.length > 0 && (
                <View style={styles.memberCountBadge}>
                  <Text style={styles.memberCountText}>{members.length}</Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        {/* Left sidebar - Channels */}
        {(!isSmallDevice || showChannels) && (
          <View style={styles.channelsArea}>
            <ScrollView style={styles.channelsList} showsVerticalScrollIndicator={false}>
              {/* Text channels */}
              {textChannels.length > 0 && (
                <View style={styles.categoryContainer}>
                  <View style={styles.categoryHeader}>
                    <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
                    <Text style={styles.categoryTitle}>TEXT CHANNELS</Text>
                    {server.userRoles?.includes('owner') && (
                      <Pressable style={styles.addChannelButton}>
                        <Ionicons name="add" size={16} color={Colors.textMuted} />
                      </Pressable>
                    )}
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
              )}

              {/* Voice channels */}
              {voiceChannels.length > 0 && (
                <View style={styles.categoryContainer}>
                  <View style={styles.categoryHeader}>
                    <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
                    <Text style={styles.categoryTitle}>VOICE CHANNELS</Text>
                    {server.userRoles?.includes('owner') && (
                      <Pressable style={styles.addChannelButton}>
                        <Ionicons name="add" size={16} color={Colors.textMuted} />
                      </Pressable>
                    )}
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
                  <Ionicons name="settings" size={20} color={Colors.text} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Center - Chat area - Add KeyboardAvoidingView back */}
        <KeyboardAvoidingView 
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Channel header */}
          <View style={styles.channelHeader}>
            <View style={styles.channelInfo}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.textMuted} />
              <Text style={styles.channelName}>#{selectedChannelName}</Text>
            </View>
            
            <View style={styles.channelActions}>
              <Pressable style={styles.channelAction}>
                <Ionicons name="notifications" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.channelAction}>
                <Ionicons name="pin" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.channelAction}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
              </Pressable>
              {!isSmallDevice && (
                <Pressable 
                  style={styles.channelAction} 
                  onPress={() => setShowMembers(!showMembers)}
                >
                  <Ionicons name="people" size={20} color={Colors.textMuted} />
                  {members.length > 0 && (
                    <View style={styles.memberCountSmallBadge}>
                      <Text style={styles.memberCountSmallText}>{members.length}</Text>
                    </View>
                  )}
                </Pressable>
              )}
            </View>
          </View>
          
          {/* Messages area */}
          <View style={styles.messagesArea}>
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
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={item => item._id}
                inverted
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
              />
            )}
            
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
          </View>
          
          {/* Mention suggestions */}
          {mentionQuery !== null && mentionResults.length > 0 && (
            <View style={styles.mentionContainer}>
              <FlatList
                data={mentionResults}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.mentionItem}
                    onPress={() => handleMentionSelect(item)}
                  >
                    <Image
                      source={{ 
                        uri: item.userId?.avatarUrl || 
                        `https://via.placeholder.com/32/5865f2/ffffff?text=${(item.userId?.username || 'U').charAt(0).toUpperCase()}` 
                      }}
                      style={styles.mentionAvatar}
                    />
                    <View style={styles.mentionInfo}>
                      <Text style={styles.mentionUsername}>@{item.userId?.username || 'unknown'}</Text>
                      <Text style={styles.mentionDisplayName}>{item.userId?.displayName || 'Unknown User'}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                horizontal={false}
                style={{ maxHeight: 200 }}
              />
            </View>
          )}

          {/* Reply indicator */}
          {replyingTo && (
            <View style={styles.replyingContainer}>
              <View style={styles.replyingContent}>
                <Text style={styles.replyingToText}>
                  Replying to {replyingTo.sender.displayName || replyingTo.sender.username}
                </Text>
                <Text style={styles.replyingMessageText} numberOfLines={1}>
                  {replyingTo.content}
                </Text>
              </View>
              <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
                <Ionicons name="close" size={20} color="#767676" />
              </TouchableOpacity>
            </View>
          )}

          {/* Edit indicator */}
          {editingMessage && (
            <View style={styles.replyingContainer}>
              <View style={styles.replyingContent}>
                <Text style={styles.replyingToText}>Editing your message</Text>
                <Text style={styles.replyingMessageText} numberOfLines={1}>
                  {editingMessage.content}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => { setEditingMessage(null); setInputText(''); }}
                style={styles.cancelReplyButton}
              >
                <Ionicons name="close" size={20} color="#767676" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Message Input */}
          {selectedChannel && (
            <View style={[
              styles.inputContainer,
              keyboardVisible && styles.inputContainerKeyboard
            ]}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={`Message #${selectedChannelName}`}
                  placeholderTextColor={Colors.textMuted}
                  value={inputText}
                  onChangeText={(text) => {
                    setInputText(text);
                    handleTyping();
                  }}
                  multiline
                  ref={inputRef}
                  maxLength={2000}
                />
                <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
                  <MaterialIcons name="attach-file" size={24} color="#767676" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraButton}>
                  <MaterialIcons name="camera-alt" size={24} color="#767676" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  sendMessageMutation.isPending && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={sendMessageMutation.isPending}
              >
                {inputText.trim() ? (
                  sendMessageMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )
                ) : (
                  <MaterialIcons name="mic" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
        
        {/* Right sidebar - Members */}
        {showMembers && (
          <View style={[
            styles.membersArea,
            isSmallDevice && styles.membersAreaMobile
          ]}>
            <View style={styles.membersAreaHeader}>
              <Text style={styles.membersHeader}>
                MEMBERS - {isLoadingMembers ? '...' : members.length}
              </Text>
              <Pressable onPress={handleRefreshMembers} style={styles.refreshIcon}>
                <Ionicons name="refresh" size={16} color={Colors.textMuted} />
              </Pressable>
            </View>
            
            {isLoadingMembers ? (
              <View style={styles.loadingMembersContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingMembersText}>Loading members...</Text>
              </View>
            ) : membersError ? (
              <View style={styles.emptyMembersContainer}>
                <Ionicons name="alert-circle" size={32} color={Colors.error} />
                <Text style={styles.membersErrorText}>{membersError}</Text>
                <Pressable 
                  style={styles.refreshButton}
                  onPress={handleRefreshMembers}
                >
                  <Text style={styles.refreshButtonText}>Try Again</Text>
                </Pressable>
              </View>
            ) : members.length === 0 ? (
              <View style={styles.emptyMembersContainer}>
                <Ionicons name="people" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyMembersText}>
                  No members found
                </Text>
                <Text style={styles.emptyMembersSubtext}>
                  There might be an issue loading the server members
                </Text>
                <Pressable 
                  style={styles.refreshButton}
                  onPress={handleRefreshMembers}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
                {/* Online members */}
                {onlineMembers.length > 0 && (
                  <>
                    <Text style={styles.memberCategory}>
                      ONLINE - {onlineMembers.length}
                    </Text>
                    {onlineMembers.map((member: any) => (
                      <MemberItem 
                        key={member.userId._id || member._id}
                        member={member}
                        isOwner={(member.userId._id || member.userId) === server?.owner}
                        isOnline={true}
                      />
                    ))}
                  </>
                )}
                
                {/* Offline members */}
                {offlineMembers.length > 0 && (
                  <>
                    <Text style={styles.memberCategory}>
                      OFFLINE - {offlineMembers.length}
                    </Text>
                    {offlineMembers.map((member: any) => (
                      <MemberItem 
                        key={member.userId._id || member._id}
                        member={member}
                        isOwner={(member.userId._id || member.userId) === server?.owner}
                        isOnline={false}
                      />
                    ))}
                  </>
                )}
              </ScrollView>
            )}
            
            {isSmallDevice && (
              <Pressable 
                style={styles.closeMembersButton}
                onPress={() => setShowMembers(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            )}
          </View>
        )}
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

// Updated MemberItem component with better error handling
const MemberItem = ({ member, isOwner, isOnline }: { 
  member: any, 
  isOwner: boolean,
  isOnline: boolean
}) => {
  // Handle different data formats - userId can be either object or string
  const userId = member.userId || {};
  const isUserIdObject = typeof userId === 'object';
  
  // Get safe values with fallbacks
  const id = isUserIdObject ? userId._id : userId;
  const username = isUserIdObject ? (userId.username || 'Unknown') : `User_${String(userId).substring(0, 5)}`;
  const displayName = member.nickname || (isUserIdObject ? (userId.displayName || username) : username);
  const avatarUrl = isUserIdObject ? userId.avatarUrl : null;
  const status = isUserIdObject ? userId.status : 'offline';
  
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        <Image
          source={{ 
            uri: avatarUrl || 
            `https://via.placeholder.com/32/5865f2/ffffff?text=${username.charAt(0).toUpperCase()}` 
          }}
          style={[
            styles.memberAvatarImage,
            !isOnline && styles.offlineMember
          ]}
        />
        <View 
          style={[
            styles.statusIndicator, 
            !isOnline ? 
              styles.offlineStatus :
              { 
                backgroundColor: 
                  status === 'online' ? Colors.secondary :
                  status === 'idle' ? Colors.warning :
                  status === 'dnd' ? Colors.error :
                  Colors.textMuted 
              }
          ]} 
        />
      </View>
      <Text style={[styles.memberName, !isOnline && styles.offlineName]}>
        {displayName}
        {isOwner && <Text style={styles.ownerTag}> • Owner</Text>}
      </Text>
    </View>
  );
};

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
  // Server header
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  serverHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serverIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  serverIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  serverIconText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  serverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 4,
    position: 'relative',
  },
  memberCountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  memberCountSmallBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCountSmallText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Main content container
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  // Channels area
  channelsArea: {
    width: isSmallDevice ? '100%' : 200,
    backgroundColor: Colors.surfaceLight,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    flexDirection: 'column',
  },
  channelsList: {
    flex: 1,
    padding: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginVertical: 1,
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
    fontWeight: '500',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  // Chat area
  chatArea: {
    flex: 1,
    backgroundColor: Colors.background,
    flexDirection: 'column',
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelActions: {
    flexDirection: 'row',
  },
  channelAction: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  messagesArea: {
    flex: 1,
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
    textAlign: 'center',
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
    padding: 12,
    backgroundColor: Colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 10,
    color: Colors.text,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 36,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  // Members area
  membersArea: {
    width: isSmallDevice ? '60%' : 200,
    backgroundColor: Colors.surfaceLight,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  membersAreaMobile: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  membersAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  membersHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textMuted,
  },
  refreshIcon: {
    padding: 4,
  },
  membersList: {
    flex: 1,
    padding: 8,
  },
  memberCategory: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
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
  loadingMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
  },
  loadingMembersText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  emptyMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
  },
  emptyMembersText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyMembersSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  membersErrorText: {
    color: Colors.error,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  closeMembersButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  // Message styles
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  messageBubble: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    position: 'relative',
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
  },
  theirMessageBubble: {
    backgroundColor: Colors.surface,
  },
  messageText: {
    fontSize: 16,
    color: Colors.text,
  },
  myMessageText: {
    color: Colors.text,
  },
  theirMessageText: {
    color: Colors.text,
  },
  senderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  messageTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  editedText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  replyContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  replyContent: {
    fontSize: 14,
    color: Colors.text,
  },
  messageActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    position: 'absolute',
    bottom: 50,
    right: 10,
    zIndex: 10,
  },
  reactionButton: {
    padding: 8,
    borderRadius: 16,
    marginRight: 4,
    backgroundColor: Colors.surface,
  },
  reactionSelected: {
    backgroundColor: Colors.primary,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionCloseButton: {
    padding: 8,
    borderRadius: 16,
    marginLeft: 4,
    backgroundColor: Colors.error,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reactionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 16,
    marginRight: 4,
    backgroundColor: Colors.surface,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  // New styles for reply indicator
  replyingContainer: {
    backgroundColor: '#23272F',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  replyingContent: {
    flex: 1,
    paddingLeft: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#53bdeb',
  },
  replyingToText: {
    fontWeight: 'bold',
    color: '#53bdeb',
    fontSize: 12,
  },
  replyingMessageText: {
    color: '#bbb',
    fontSize: 14,
  },
  cancelReplyButton: {
    padding: 8,
  },
  mentionContainer: {
    backgroundColor: '#23272F',
    borderTopWidth: 1,
    borderTopColor: '#333',
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  mentionInfo: {
    flex: 1,
  },
  mentionUsername: {
    fontWeight: 'bold',
    color: '#53bdeb',
    fontSize: 14,
  },
  mentionDisplayName: {
    color: '#bbb',
    fontSize: 12,
  },
  mentionText: {
    color: '#53bdeb',
    fontWeight: 'bold',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 25,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  attachButton: {
    padding: 8,
  },
  cameraButton: {
    padding: 8,
  },
  inputContainerKeyboard: {
    paddingBottom: 8,
  },
  // Other styles remain unchanged
});