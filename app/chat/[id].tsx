import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatMessage } from '../../components/ChatMessage';
import { Colors } from '../../constants/Colors';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  avatar?: string;
  username?: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  // Get chat details based on ID
  const chatDetails = {
    id: id as string,
    name: "Rishi",
    avatar: "https://via.placeholder.com/40/7289da/ffffff?text=R",
    status: "online",
  };
  
  // Mock messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Sir contact us page me mail send karne ke liye api chaiye thi ma'am keh rahi thi usko karne ko",
      sender: 'other',
      timestamp: 'Yesterday at 9:08 PM',
      avatar: "https://via.placeholder.com/40/5865f2/ffffff?text=D",
      username: "Divy",
    },
    {
      id: '2',
      text: "Acha main dekhta hun",
      sender: 'other',
      timestamp: 'Yesterday at 9:53 PM',
      avatar: "https://via.placeholder.com/40/7289da/ffffff?text=R",
      username: "Rishi",
    },
    {
      id: '3',
      text: "sir latest wali branch main wali hai ya live",
      sender: 'other',
      timestamp: 'Yesterday at 10:14 PM',
      avatar: "https://via.placeholder.com/40/5865f2/ffffff?text=D",
      username: "Divy",
    },
    {
      id: '4',
      text: "Main",
      sender: 'other',
      timestamp: 'Yesterday at 10:17 PM',
      avatar: "https://via.placeholder.com/40/7289da/ffffff?text=R",
      username: "Rishi",
    },
    {
      id: '5',
      text: "ok sir",
      sender: 'other',
      timestamp: 'Yesterday at 10:17 PM',
      avatar: "https://via.placeholder.com/40/5865f2/ffffff?text=D",
      username: "Divy",
    },
    {
      id: '6',
      text: "sir main merge karke testing pe pr ki hai",
      sender: 'other',
      timestamp: '12:36 AM',
      avatar: "https://via.placeholder.com/40/5865f2/ffffff?text=D",
      username: "Divy",
    },
    {
      id: '7',
      text: "Koi build issue nhi hai to merge kardo",
      sender: 'other',
      timestamp: '12:37 AM',
      avatar: "https://via.placeholder.com/40/7289da/ffffff?text=R",
      username: "Rishi",
    },
    {
      id: '8',
      text: "thik hai sir",
      sender: 'me',
      timestamp: '12:39 AM',
    },
  ]);
  
  // Send message function
  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{chatDetails.name}</Text>
          <View style={styles.row}>
            <View style={[
              styles.statusDot,
              { backgroundColor: chatDetails.status === 'online' ? Colors.secondary : Colors.textMuted }
            ]} />
            <Text style={styles.headerSubtitle}>
              {chatDetails.status === 'online' ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        
        <Pressable style={styles.headerButton}>
          <Ionicons name="call" size={22} color={Colors.text} />
        </Pressable>
        <Pressable style={styles.headerButton}>
          <Ionicons name="videocam" size={22} color={Colors.text} />
        </Pressable>
      </View>
      
      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={({ item, index }) => {
          const isSameSenderAsPrevious = 
            index > 0 && 
            messages[index - 1].sender === item.sender &&
            messages[index - 1].username === item.username;
          
          const isSameDay = 
            index > 0 && 
            item.timestamp.includes(messages[index - 1].timestamp.split(' ')[0]);
          
          const showHeader = !isSameSenderAsPrevious || !isSameDay;
          
          return <ChatMessage message={item} showHeader={showHeader} />;
        }}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        inverted={false}
      />
      
      {/* Date divider */}
      <View style={styles.dateDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>May 30, 2025</Text>
        <View style={styles.dividerLine} />
      </View>
      
      {/* Input */}
      <View style={styles.inputContainer}>
        <Pressable style={styles.inputButton}>
          <Ionicons name="add" size={24} color={Colors.text} />
        </Pressable>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onFocus={() => setKeyboardVisible(true)}
          onBlur={() => setKeyboardVisible(false)}
          multiline
        />
        <Pressable style={styles.inputButton}>
          <Ionicons name="happy" size={24} color={Colors.text} />
        </Pressable>
        {inputText.trim() ? (
          <Pressable style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color={Colors.text} />
          </Pressable>
        ) : (
          <Pressable style={styles.inputButton}>
            <Ionicons name="mic" size={24} color={Colors.text} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
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
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingTop: 0,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.textMuted,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
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
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  }
});