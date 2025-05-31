import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import {
  useDirectMessages,
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

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  
  // State for messages
  const [messages, setMessages] = useState<Message[]>([]);
  
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
        console.log('===== SOCKET SETUP START =====');
        console.log('Setting up socket for chat with user ID:', id);
        console.log('Current user ID:', user?._id);
        
        // Initialize socket connection
        await initializeSocket();
        console.log('Socket initialized successfully');
        
        // Join user room for receiving messages
        if (user?._id) {
          await joinUserRoom(user._id);
          console.log('Joined user room:', user._id);
        }
        
        // Join the direct message room
        joinDirectMessageRoom(id as string);
        console.log('Joined DM room with ID:', id);
        
        // Listen for new direct messages
        onNewDirectMessage((newMessage: Message) => {
          console.log('🔥 NEW MESSAGE RECEIVED:', newMessage);
          
          const currentUserId = user?._id;
          const chatPartnerId = id as string;
          
          // Check if this message belongs to the current conversation
          // Based on your backend: messages between two users have either:
          // - sender: currentUser, directMessageId: chatPartner
          // - sender: chatPartner, directMessageId: currentUser
          const isRelevantMessage = (
            (newMessage.sender._id === currentUserId && newMessage.directMessageId === chatPartnerId) ||
            (newMessage.sender._id === chatPartnerId && newMessage.directMessageId === currentUserId)
          );
          
          console.log('💬 Message relevance check:');
          console.log('- Current user:', currentUserId);
          console.log('- Chat partner:', chatPartnerId);
          console.log('- Message sender:', newMessage.sender._id);
          console.log('- Message directMessageId:', newMessage.directMessageId);
          console.log('- Is relevant:', isRelevantMessage);
          
          if (isRelevantMessage) {
            console.log('✅ Adding message to UI');
            setMessages(prevMessages => {
              // Check if message already exists
              const messageExists = prevMessages.some(msg => msg._id === newMessage._id);
              if (messageExists) {
                console.log('⚠️ Message already exists, skipping');
                return prevMessages;
              }
              
              const newMessages = [newMessage, ...prevMessages];
              console.log('📝 Updated messages count:', newMessages.length);
              return newMessages;
            });
          } else {
            console.log('❌ Message filtered out - not relevant to current conversation');
          }
        });
        
        // Listen for message updates
        onMessageUpdated((updatedMessage: Message) => {
          console.log('📝 Message updated:', updatedMessage._id);
          setMessages(prev => prev.map(msg => 
            msg._id === updatedMessage._id ? updatedMessage : msg
          ));
        });
        
        // Listen for message deletions
        onMessageDeleted((messageId: string) => {
          console.log('🗑️ Message deleted:', messageId);
          setMessages(prev => prev.filter(msg => msg._id !== messageId));
        });
        
        // Listen for reactions
        onMessageReaction((updatedMessage: Message) => {
          console.log('👍 Message reaction:', updatedMessage._id);
          setMessages(prev => prev.map(msg => 
            msg._id === updatedMessage._id ? updatedMessage : msg
          ));
        });
        
        // Listen for typing indicators
        onTypingIndicator((data: {
          userId: string;
          username: string;
          isTyping: boolean;
          directMessageId?: string;
        }) => {
          console.log('⌨️ Typing indicator:', data);
          // Show typing indicator if it's from the friend we're chatting with
          if (data.userId === id) {
            setIsTyping(data.isTyping);
          }
        });
        
        console.log('===== SOCKET SETUP END =====');
      } catch (error) {
        console.error('❌ Socket setup error:', error);
      }
    };
    
    if (id && user?._id) {
      setupSocket();
    }
    
    // Clean up socket listeners
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      removeAllListeners();
    };
  }, [id, user?._id]);
  
  // Load messages from API when data changes
  useEffect(() => {
    if (messagesData) {
      console.log('📥 Loading messages from API');
      console.log('Raw API response:', messagesData);
      
      // Extract messages array from the API response
      let messageArray: Message[] = [];
      
      if (Array.isArray(messagesData)) {
        messageArray = messagesData;
      } else if (messagesData.data && Array.isArray(messagesData.data)) {
        messageArray = messagesData.data;
      } else if (messagesData.data?.data && Array.isArray(messagesData.data.data)) {
        messageArray = messagesData.data.data;
      }
      
      console.log('📨 Extracted messages:', messageArray.length);
      console.log('📋 First message:', messageArray[0]?.content || 'No messages');
      
      setMessages(messageArray);
    }
  }, [messagesData]);
  
  // Set up keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  
  // Handle typing indicator
  const handleTyping = () => {
    if (!user?._id || !id) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    sendTypingIndicator({
      userId: user._id,
      username: user.username,
      isTyping: true,
      directMessageId: id as string
    });
    
    // Set timeout to clear typing indicator
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
    
    console.log('📤 Sending message to:', id);
    console.log('📝 Message content:', inputText.trim());
    
    sendMessageMutation.mutate({
      userId: id as string,
      content: inputText.trim()
    }, {
      onSuccess: (response) => {
        console.log('✅ Message sent successfully:', response);
        setInputText('');
        
        // Refetch messages to ensure we have the latest
        refetchMessages();
        
        // Clear typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (user?._id) {
          sendTypingIndicator({
            userId: user._id,
            username: user.username,
            isTyping: false,
            directMessageId: id as string
          });
        }
      },
      onError: (error) => {
        console.error('❌ Error sending message:', error);
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
  
  // Debug: Log current state
  useEffect(() => {
    console.log('🔍 Current state:');
    console.log('- Messages count:', messages.length);
    console.log('- Loading:', isLoadingMessages);
    console.log('- Error:', messagesError?.message || 'None');
    console.log('- Chat partner ID:', id);
    console.log('- Current user ID:', user?._id);
  }, [messages, isLoadingMessages, messagesError, id, user?._id]);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        
        <View style={styles.headerInfo}>
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
              {friendDetails.status === 'dnd' ? 'Do Not Disturb' :
               friendDetails.status === 'idle' ? 'Away' :
               friendDetails.status.charAt(0).toUpperCase() + friendDetails.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.row}>
          <Pressable style={styles.headerButton}>
            <Ionicons name="call" size={22} color={Colors.text} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Ionicons name="videocam" size={22} color={Colors.text} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={22} color={Colors.text} />
          </Pressable>
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
                <View style={[
                  styles.messageContainer,
                  isMine ? styles.myMessage : styles.theirMessage
                ]}>
                  <View style={[
                    styles.messageBubble,
                    isMine ? styles.myMessageBubble : styles.theirMessageBubble
                  ]}>
                    {!isMine && (
                      <Text style={styles.senderName}>{senderName}</Text>
                    )}
                    <Text style={[
                      styles.messageText,
                      isMine ? styles.myMessageText : styles.theirMessageText
                    ]}>
                      {item.content}
                    </Text>
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
                  </View>
                </View>
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
      
      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          💬 {messages.length} messages loaded | 
          🔗 Socket: {user?._id ? 'Connected' : 'Disconnected'} | 
          👤 Chat with: {id}
        </Text>
      </View>
      
      {/* Input area */}
      <View style={[
        styles.inputContainer,
        keyboardVisible && styles.inputContainerKeyboard
      ]}>
        <Pressable style={styles.inputButton}>
          <Ionicons name="add" size={24} color={Colors.textMuted} />
        </Pressable>
        
        <TextInput 
          style={styles.input}
          placeholder="Type a message..."
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
        
        <Pressable style={styles.inputButton}>
          <Ionicons name="happy" size={24} color={Colors.textMuted} />
        </Pressable>
        
        {inputText.trim() ? (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    borderRadius: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: Colors.textSecondary,
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
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.text,
  },
  theirMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: Colors.textMuted,
    textAlign: 'left',
  },
  editedText: {
    fontStyle: 'italic',
  },
  typingContainer: {
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
  },
  typingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  debugContainer: {
    padding: 8,
    backgroundColor: 'rgba(50, 50, 70, 0.5)',
    marginHorizontal: 8,
    borderRadius: 4,
  },
  debugText: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputContainerKeyboard: {
    paddingBottom: 8,
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
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});