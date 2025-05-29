import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header with profile image */}
        <View style={styles.headerSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100/5865f2/ffffff?text=D' }}
              style={styles.profileImage}
            />
            <View style={styles.statusIndicator} />
          </View>
          
          <Text style={styles.username}>Divy</Text>
          <Text style={styles.discriminator}>divy__1030</Text>
          
          <Pressable style={styles.editButton}>
            <Ionicons name="pencil" size={16} color="#ffffff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>
        
        {/* Nitro promotion */}
        <View style={styles.promoSection}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Amp up your profile</Text>
            <View style={styles.promoButtons}>
              <Pressable style={styles.promoButton}>
                <Ionicons name="flash" size={16} color="#ffffff" />
                <Text style={styles.promoButtonText}>Get Nitro</Text>
              </Pressable>
              <Pressable style={styles.promoButton}>
                <Ionicons name="bag" size={16} color="#ffffff" />
                <Text style={styles.promoButtonText}>Shop</Text>
              </Pressable>
            </View>
          </View>
          <Pressable style={styles.closeButton}>
            <Ionicons name="close" size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>
        
        {/* Member since */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Member Since</Text>
          <View style={styles.infoContent}>
            <Ionicons name="logo-discord" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Jan 25, 2024</Text>
          </View>
        </View>
        
        {/* Friends */}
        <Pressable 
          style={styles.navigationSection}
          onPress={() => router.push('/friends')}
        >
          <Text style={styles.navigationText}>Your Friends</Text>
          <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
        </Pressable>
        
        {/* Personal note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteSectionTitle}>Note (only visible to you)</Text>
          <Pressable style={styles.noteButton}>
            <Ionicons name="create-outline" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
        
        {/* Settings options */}
        <View style={styles.optionsTitle}>
          <Text style={styles.optionsTitleText}>Account Settings</Text>
        </View>
        
        <View style={styles.optionsList}>
          <Pressable style={styles.optionItem} onPress={() => router.push('/settings/account')}>
            <Ionicons name="person" size={22} color={Colors.text} />
            <Text style={styles.optionText}>Account</Text>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={() => router.push('/settings/privacy')}>
            <Ionicons name="shield" size={22} color={Colors.text} />
            <Text style={styles.optionText}>Data & Privacy</Text>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={() => router.push('/settings/content')}>
            <Ionicons name="people" size={22} color={Colors.text} />
            <Text style={styles.optionText}>Content & Social</Text>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={() => router.push('/settings/devices')}>
            <Ionicons name="phone-portrait" size={22} color={Colors.text} />
            <Text style={styles.optionText}>Devices</Text>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    borderWidth: 4,
    borderColor: Colors.background,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  discriminator: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: Colors.text,
    fontWeight: '600',
    marginLeft: 8,
  },
  promoSection: {
    backgroundColor: 'rgba(88, 101, 242, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    margin: 16,
    padding: 16,
    flexDirection: 'row',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  promoButtons: {
    flexDirection: 'row',
  },
  promoButton: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 8,
  },
  promoButtonText: {
    color: Colors.text,
    marginLeft: 8,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: 16,
  },
  infoSectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    color: Colors.text,
    marginLeft: 8,
  },
  navigationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  navigationText: {
    color: Colors.text,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  noteSectionTitle: {
    color: Colors.textSecondary,
  },
  noteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsTitle: {
    padding: 16,
    paddingBottom: 8,
  },
  optionsTitleText: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  optionsList: {
    backgroundColor: Colors.surfaceLight,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionText: {
    flex: 1,
    color: Colors.text,
    marginLeft: 16,
  },
});