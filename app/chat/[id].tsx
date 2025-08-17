import { FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import {
  useAddReaction,
  useDirectMessages,
  useEditMessage,
  useFriendsList,
  useSendDirectMessage
} from '../../src/lib/queries';
import {
  initializeSocket,
  joinDirectMessageRoom,
  joinUserRoom,
  onMessageDeleted,
  onMessageReaction,
  onMessageUpdated,
  onNewDirectMessage,
  onTypingIndicator,
  removeAllListeners,
  sendTypingIndicator
} from '../../src/lib/socket';
import { useAuth } from '../../src/providers/AuthProvider';
import { Message } from '../../src/types/message';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer';
import { messageApi } from '../../src/lib/api'; // adjust path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../src/constants/config'; // adjust path as needed

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  // State for messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [showReactionBar, setShowReactionBar] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // Fetch direct messages from API
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages
  } = useDirectMessages(id as string);

  // Get friend details
  const { data: friendsData } = useFriendsList();

  // Send message mutation
  const sendMessageMutation = useSendDirectMessage();
  const addReactionMutation = useAddReaction();
  const editMessageMutation = useEditMessage();

  // Find the friend details based on the ID
  const friend = friendsData?.data?.friends?.find(
    (f: any) => f.userId?._id === id && f.status === 'accepted'
  );

  const friendDetails = friend?.userId || {
    _id: id as string,
    username: 'Loading...',
    displayName: 'Loading...',
    avatarUrl: '',
    status: 'offline'
  };

  // Initialize socket connection and join room
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await initializeSocket();
        if (user?._id) await joinUserRoom(user._id);
        joinDirectMessageRoom(id as string);

        onNewDirectMessage((newMessage: Message) => {
          const currentUserId = user?._id;
          const chatPartnerId = id as string;
          const isRelevantMessage = (
            (newMessage.sender._id === currentUserId && newMessage.directMessageId === chatPartnerId) ||
            (newMessage.sender._id === chatPartnerId && newMessage.directMessageId === currentUserId)
          );
          if (isRelevantMessage) {
            setMessages(prevMessages => {
              const messageExists = prevMessages.some(msg => msg._id === newMessage._id);
              if (messageExists) return prevMessages;
              return [newMessage, ...prevMessages];
            });
          }
        });

        onMessageUpdated((updatedMessage: Message) => {
          setMessages(prev => prev.map(msg =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          ));
        });

        onMessageDeleted((messageId: string) => {
          setMessages(prev => prev.filter(msg => msg._id !== messageId));
        });

        onMessageReaction((updatedMessage: Message) => {
          setMessages(prev => prev.map(msg =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          ));
        });

        onTypingIndicator((data: {
          userId: string;
          username: string;
          isTyping: boolean;
          directMessageId?: string;
        }) => {
          if (data.userId === id) setIsTyping(data.isTyping);
        });
      } catch (error) {
        console.error('❌ Socket setup error:', error);
      }
    };

    if (id && user?._id) setupSocket();
    return () => removeAllListeners();
  }, [id, user?._id]);

  // Load messages from API when data changes
  useEffect(() => {
    if (messagesData) {
      let messageArray: Message[] = [];
      if (Array.isArray(messagesData)) {
        messageArray = messagesData;
      } else if (messagesData.data && Array.isArray(messagesData.data)) {
        messageArray = messagesData.data;
      } else if (messagesData.data?.data && Array.isArray(messagesData.data.data)) {
        messageArray = messagesData.data.data;
      }
      setMessages(messageArray);
    }
  }, [messagesData]);

  // Set up keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Handle typing indicator
  const handleTyping = () => {
    if (!user?._id || !id) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingIndicator({
      userId: user._id,
      username: user.username,
      isTyping: true,
      directMessageId: id as string
    });
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator({
        userId: user._id,
        username: user.username,
        isTyping: false,
        directMessageId: id as string
      });
    }, 1500);
  };

  // Send message function
  const handleSendMessage = () => {
    if (!inputText.trim() || !id) return;
    if (editingMessage) {
      editMessageMutation.mutate(
        { messageId: editingMessage._id, content: inputText.trim() },
        {
          onSuccess: () => {
            setEditingMessage(null);
            setInputText('');
            refetchMessages();
          }
        }
      );
      return;
    }
    sendMessageMutation.mutate({
      receiverId: id as string,
      content: inputText.trim(),
      replyTo: replyingTo?._id
    }, {
      onSuccess: () => {
        setInputText('');
        setReplyingTo(null);
        refetchMessages();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (user?._id) {
          sendTypingIndicator({
            userId: user._id,
            username: user.username,
            isTyping: false,
            directMessageId: id as string
          });
        }
      }
    });
  };

  // Handle selecting a user to mention
  const handleMentionSelect = (user: any) => {
    const newText = inputText.replace(/@\w*$/, `@${user.username} `);
    setInputText(newText);
    setMentionQuery(null);
    setMentionResults([]);
    inputRef.current?.focus();
  };

  // Handle replying to a message
  const handleReply = (message: any) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => setReplyingTo(null);

  // Handle mentions in input text
  useEffect(() => {
    // Only show mention suggestions if @ is followed by at least one character
    const mentionMatch = inputText.match(/@(\w{1,})$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      // Replace this with your real user search API if available
      const mockUsers = [
        { _id: '1', username: 'user1', displayName: 'User One' },
        { _id: '2', username: 'user2', displayName: 'User Two' },
        { _id: '3', username: 'user3', displayName: 'User Three' },
      ];
      const filteredUsers = mockUsers.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName.toLowerCase().includes(query.toLowerCase())
      );
      setMentionResults(filteredUsers);
      setMentionQuery(query);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }, [inputText]);

  // Image picker handler
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
      base64: true, // <-- Add this
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      // asset.base64 will be available
      if (!asset.base64) {
        alert('Failed to get base64 data');
        return;
      }

      const attachment = {
        data: asset.base64,
        type: 'image',
        name: asset.fileName || 'image.jpg',
      };

      // Send DM with only the image
      const sendRes = await messageApi.sendDirectMessageWithAttachments(id as string, {
        content: '', // No text
        attachments: [attachment],
      });
      console.log('Send DM with attachment response:', sendRes);

      setInputText('');
      refetchMessages();
    }
  };

  if (isLoadingMessages) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.centerLoader} />
      </SafeAreaView>
    );
  }

  if (messagesError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load messages</Text>
          <Text style={styles.errorDetails}>{messagesError.message}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => refetchMessages()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerInfo}>
          {friendDetails.avatarUrl ? (
            <Image source={{ uri: friendDetails.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#128C7E', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {(friendDetails.displayName || friendDetails.username)?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {friendDetails.displayName || friendDetails.username}
            </Text>
            <View style={styles.row}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      friendDetails.status === 'online' ? Colors.secondary :
                        friendDetails.status === 'idle' ? '#ffa500' :
                          friendDetails.status === 'dnd' ? Colors.error :
                            Colors.textMuted
                  }
                ]}
              />
              <Text style={styles.headerSubtitle}>
                {friendDetails.status === 'online' ? 'online' : 'last seen recently'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={({ item }) => {
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
                    <Text style={[
                      styles.messageText,
                      isMine ? styles.myMessageText : styles.theirMessageText
                    ]}>
                      {item.content.split(/(\s@[a-zA-Z0-9_]+)/).map((part, index) => {
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
                    <View style={styles.messageTimeWrapper}>
                      <Text style={[
                        styles.messageTime,
                        isMine ? styles.myMessageTime : styles.theirMessageTime
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
                      <TouchableOpacity onPress={() => {
                        setEditingMessage(item);
                        setInputText(item.content);
                        inputRef.current?.focus();
                      }}>
                        <MaterialIcons name="edit" size={18} color="#bbb" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Emoji Reaction Bar */}
                  {showReactionBar === item._id && (
                    <View style={styles.reactionBar}>
                      {EMOJI_REACTIONS.map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          style={styles.reactionButton}
                          onPress={() => {
                            addReactionMutation.mutate({ messageId: item._id, emoji });
                            setShowReactionBar(null);
                          }}
                        >
                          <Text style={styles.reactionEmoji}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
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
                      {item.reactions.map((reaction, idx) => (
                        <TouchableOpacity
                          key={reaction.emoji + idx}
                          style={[
                            styles.reactionDisplay,
                            reaction.users.some((u: any) => u._id === user?._id) && styles.reactionSelected
                          ]}
                          onPress={() => {
                            // Remove reaction if already reacted, else add
                            if (reaction.users.some((u: any) => u._id === user?._id)) {
                              // Remove reaction
                              addReactionMutation.mutate({ messageId: item._id, emoji: reaction.emoji });
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
                  {/* Attachments display */}
                  {item.attachments && item.attachments.length > 0 && (
                    <View style={{ marginVertical: 4 }}>
                      {item.attachments.map((att, idx) =>
                        att.type === 'image' && att.data ? (
                          <Image
                            key={idx}
                            source={{ uri: `data:image/jpeg;base64,${att.data}` }}
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
                </Pressable>
              );
            }}
            keyExtractor={(item) => item._id}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
          />
        )}
      </View>

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {friendDetails.displayName || friendDetails.username} is typing...
          </Text>
        </View>
      )}

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
                <Text style={styles.mentionUsername}>@{item.username}</Text>
                <Text style={styles.mentionDisplayName}>{item.displayName}</Text>
              </TouchableOpacity>
            )}
            horizontal={false}
            style={{ maxHeight: 150 }}
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

      {/* Input area wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80} // Adjust this to match your header height
      >
        <View style={[
          styles.inputContainer,
          keyboardVisible && styles.inputContainerKeyboard
        ]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message"
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20', // Dark background
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDetails: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#075E54',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Emoji Reaction Bar
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23272F',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reactionButton: {
    marginHorizontal: 4,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#23272F',
  },
  reactionEmoji: {
    fontSize: 22,
  },
  reactionCloseButton: {
    marginLeft: 8,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 2,
  },
  // Mention styles
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
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  mentionUsername: {
    fontWeight: 'bold',
    marginRight: 8,
    color: '#53bdeb',
  },
  mentionDisplayName: {
    color: '#bbb',
  },
  mentionText: {
    color: '#53bdeb',
    fontWeight: 'bold',
  },
  // Reply styles
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
  replyContainer: {
    backgroundColor: 'rgba(83,189,235,0.08)',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#53bdeb',
  },
  replyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#53bdeb',
  },
  replyContent: {
    fontSize: 12,
    color: '#bbb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#23272F',
    paddingVertical: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#bbb',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    borderRadius: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 16,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 2,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#262D34',
    borderTopRightRadius: 0,
  },
  theirMessageBubble: {
    backgroundColor: '#23272F',
    borderTopLeftRadius: 0,
  },
  senderName: {
    color: '#53bdeb',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#fff',
  },
  messageTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: '#bbb',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#bbb',
    textAlign: 'left',
  },
  editedText: {
    fontStyle: 'italic',
  },
  typingContainer: {
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#23272F',
    borderRadius: 16,
  },
  typingText: {
    color: '#bbb',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#23272F',
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
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    color: '#fff',
  },
  attachButton: {
    padding: 8,
  },
  cameraButton: {
    padding: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#53bdeb',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  inputContainerKeyboard: {
    paddingBottom: 8,
  },
  reactionsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reactionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23272F',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  reactionSelected: {
    backgroundColor: '#53bdeb',
  },
  reactionCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 2,
  },
  messageActionsRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 8,
  },
});