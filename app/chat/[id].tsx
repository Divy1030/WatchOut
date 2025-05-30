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
import { ChatMessage } from '../../components/ChatMessage';
import { Colors } from '../../constants/Colors';
import {
  useDirectMessages,
  useFriendsList,
  useSendDirectMessage
} from '../../src/lib/queries';
import {
  initializeSocket,
  joinDirectMessageRoom,
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
    error: messagesError
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
        // Initialize socket connection
        await initializeSocket();
        
        // Join the direct message room
        joinDirectMessageRoom(id as string);
        
        // Listen for new direct messages
        onNewDirectMessage((newMessage: Message) => {
          // Check if this message belongs to this conversation
          const conversationId = [user?._id, id].sort().join('_');
          if (newMessage.directMessageId === conversationId || 
              (newMessage.sender._id === id && user?._id) ||
              (newMessage.sender._id === user?._id && id)) {
            setMessages(prev => [newMessage, ...prev]);
          }
        });
        
        // Listen for message updates
        onMessageUpdated((updatedMessage: Message) => {
          setMessages(prev => prev.map(msg => 
            msg._id === updatedMessage._id ? updatedMessage : msg
          ));
        });
        
        // Listen for message deletions
        onMessageDeleted((messageId: string) => {
          if (messageId) {
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
          }
        });
        
        // Listen for reactions
        onMessageReaction((updatedMessage: Message) => {
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
          // Show typing indicator if it's from the friend we're chatting with
          if (data.userId === id) {
            setIsTyping(data.isTyping);
          }
        });
      } catch (error) {
        console.error('Error setting up socket:', error);
      }
    };
    
    if (id && user?._id) {
      setupSocket();
    }
    
    // Clean up socket listeners
    return () => {
      removeAllListeners();
    };
  }, [id, user?._id]);
  
  // Update messages when data changes
  useEffect(() => {
    if (messagesData?.data) {
      // messagesData.data should be an array of messages
      setMessages(messagesData.data);
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
    
    sendMessageMutation.mutate({
      userId: id as string,
      content: inputText.trim()
    }, {
      onSuccess: () => {
        setInputText('');
        
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
        console.error('Error sending message:', error);
        // You could show a toast or error message here
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
          <Pressable 
            style={styles.retryButton} 
            onPress={() => window.location.reload()}
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
      
      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <ChatMessage 
            message={item}
            isMine={item.sender._id === user?._id}
          />
        )}
        keyExtractor={(item) => item._id}
        inverted
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {friendDetails.displayName || friendDetails.username} is typing...
          </Text>
        </View>
      )}
      
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
  messagesContent: {
    padding: 16,
    paddingTop: 8,
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