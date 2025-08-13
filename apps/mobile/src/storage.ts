export type StorageKey = 'token';

function isWeb() {
  return typeof document !== 'undefined';
}

export async function setItem(key: StorageKey, value: string): Promise<void> {
  if (isWeb()) {
    localStorage.setItem(key, value);
    return;
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(key, value);
}

export async function getItem(key: StorageKey): Promise<string | null> {
  if (isWeb()) {
    return localStorage.getItem(key);
    return null;
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  return AsyncStorage.getItem(key);
}

export async function removeItem(key: StorageKey): Promise<void> {
  if (isWeb()) {
    localStorage.removeItem(key);
    return;
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.removeItem(key);
}