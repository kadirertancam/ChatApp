import { useState } from 'react';
import { Alert, Button, SafeAreaView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

const API_URL = (Constants.expoConfig?.extra as any)?.API_URL || 'http://localhost:4000';

export default function LoginScreen() {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demopass');
  const [displayName, setDisplayName] = useState('Demo');
  const router = useRouter();

  const login = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      if (typeof localStorage !== 'undefined') localStorage.setItem('token', data.token);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Giriş başarısız', e.message);
    }
  };

  const register = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, displayName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      if (typeof localStorage !== 'undefined') localStorage.setItem('token', data.token);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Kayıt başarısız', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Hoş geldiniz</Text>
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
      <TextInput placeholder="Şifre" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
      <TextInput placeholder="Ad" value={displayName} onChangeText={setDisplayName} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Giriş" onPress={login} />
        <Button title="Kayıt" onPress={register} />
      </View>
    </SafeAreaView>
  );
}