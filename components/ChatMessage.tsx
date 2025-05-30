import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useAddReaction, useDeleteMessage, useRemoveReaction } from '../src/lib/queries';
import { Message } from '../src/types/message';
import EmojiPicker from './EmojiPicker';

interface ChatMessageProps {
  message: Message;
  isMine: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMine }) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();
  const deleteMessageMutation = useDeleteMessage();
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return 'Today at ' + format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday at ' + format(date, 'h:mm a');
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };
  
  const handleLongPress = () => {
    setShowActions(!showActions);
  };
  
  const handleAddReaction = (emoji: string) => {
    addReactionMutation.mutate(
      { messageId: message._id, emoji },
      {
        onSuccess: () => {
          setShowEmojiPicker(false);
        },
        onError: (error) => {
          console.error('Error adding reaction:', error);
        }
      }
    );
  };
  
  const handleRemoveReaction = (emoji: string) => {
    removeReactionMutation.mutate(
      { messageId: message._id, emoji },
      {
        onError: (error) => {
          console.error('Error removing reaction:', error);
        }
      }
    );
  };
  
  const handleDeleteMessage = () => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessageMutation.mutate(message._id, {
        onError: (error) => {
          console.error('Error deleting message:', error);
        }
      });
    }
  };
  
  // Group reactions by emoji
  const reactionsMap = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.userId);
    return acc;
  }, {} as Record<string, string[]>) || {};
  
  const hasReacted = (emoji: string) => {
    return message.reactions?.some(r => r.userId === message.sender._id && r.emoji === emoji);
  };
  
  return (
    <Pressable 
      style={[
        styles.container,
        isMine ? styles.myContainer : styles.otherContainer
      ]}
      onLongPress={handleLongPress}
    >
      {!isMine && (
        <Image
          source={{ 
            uri: message.sender.avatarUrl || 
            `https://via.placeholder.com/40/5865f2/ffffff?text=${message.sender.username.charAt(0).toUpperCase()}` 
          }}
          style={styles.avatar}
        />
      )}
      
      <View style={[
        styles.bubble,
        isMine ? styles.myBubble : styles.otherBubble
      ]}>
        {!isMine && (
          <Text style={styles.username}>
            {message.sender.displayName || message.sender.username}
          </Text>
        )}
        
        <Text style={styles.content}>{message.content}</Text>
        
        <View style={styles.metadata}>
          <Text style={styles.timestamp}>
            {formatTime(message.createdAt)}
            {message.isEdited && ' (edited)'}
          </Text>
        </View>
        
        {/* Reactions */}
        {Object.keys(reactionsMap).length > 0 && (
          <View style={styles.reactionsContainer}>
            {Object.entries(reactionsMap).map(([emoji, users]) => (
              <Pressable 
                key={emoji} 
                style={[
                  styles.reaction,
                  hasReacted(emoji) && styles.hasReacted
                ]}
                onPress={() => {
                  hasReacted(emoji) 
                    ? handleRemoveReaction(emoji)
                    : handleAddReaction(emoji);
                }}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
                <Text style={styles.reactionCount}>{users.length}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      
      {/* Message actions */}
      {showActions && (
        <View style={[
          styles.actionsContainer,
          isMine ? styles.myActionsContainer : styles.otherActionsContainer
        ]}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => setShowEmojiPicker(true)}
          >
            <Ionicons name="happy-outline" size={20} color={Colors.text} />
          </Pressable>
          
          {isMine && (
            <>
              <Pressable style={styles.actionButton}>
                <Ionicons name="pencil-outline" size={20} color={Colors.text} />
              </Pressable>
              <Pressable 
                style={styles.actionButton}
                onPress={handleDeleteMessage}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </Pressable>
            </>
          )}
          
          <Pressable style={styles.actionButton}>
            <Ionicons name="repeat-outline" size={20} color={Colors.text} />
          </Pressable>
        </View>
      )}
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={handleAddReaction}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    position: 'relative',
  },
  myContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  username: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  content: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  reaction: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  hasReacted: {
    backgroundColor: Colors.primary + '40',  // 40 is opacity in hex
  },
  emojiText: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionsContainer: {
    position: 'absolute',
    top: -40,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    flexDirection: 'row',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  myActionsContainer: {
    right: 0,
  },
  otherActionsContainer: {
    left: 36,  // To account for the avatar
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});