import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, Text, View, Button } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { getItem } from '../src/storage';

const API_URL = (Constants.expoConfig?.extra as any)?.API_URL || 'http://localhost:4000';

export default function HomeScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const router = useRouter();

  const fetchConversations = async () => {
    const t = await getItem('token');
    setToken(t);
    if (!t) {
      router.replace('/login');
      return;
    }
    fetch(`${API_URL}/api/conversations`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchConversations(); }, []);

  const createSelfChat = async () => {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ participantIds: [], title: 'Kişisel Notlar' })
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/chat/${data.conversation.id}`);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 12 }}>
        <Button title="Yeni Sohbet" onPress={createSelfChat} />
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.title || 'Sohbet'}</Text>
            {item.messages?.[0] && <Text numberOfLines={1} style={{ color: '#666' }}>{item.messages[0].content}</Text>}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}