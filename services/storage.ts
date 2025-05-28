import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  private prefix = '@watchout_';

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(`${this.prefix}${key}`, jsonValue);
    } catch (error) {
      console.error('Storage setItem error:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(`${this.prefix}${key}`);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.error('Storage removeItem error:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(this.prefix));
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }
}

export const storage = new StorageService();