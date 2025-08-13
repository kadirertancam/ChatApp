import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, SafeAreaView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import io from 'socket.io-client';
import Constants from 'expo-constants';

const API_URL = (Constants.expoConfig?.extra as any)?.API_URL || 'http://localhost:4000';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const t = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(t);
    if (!t) return;
    fetch(`${API_URL}/api/conversations/${id}/messages`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .finally(() => setLoading(false));

    const s = io(API_URL, { autoConnect: true, auth: { token: t } });
    socketRef.current = s;
    s.emit('joinConversation', String(id));
    s.on('message', (msg: any) => {
      if (msg.conversationId === id) setMessages(prev => [...prev, msg]);
    });

    return () => { s.disconnect(); };
  }, [id]);

  const send = () => {
    if (!socketRef.current || !text.trim()) return;
    socketRef.current.emit('sendMessage', { conversationId: id, content: text.trim() });
    setText('');
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <Text style={{ fontWeight: '600' }}>{item.senderId}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', padding: 8, borderTopWidth: 1, borderColor: '#eee' }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yazın"
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8 }}
        />
        <Button title="Gönder" onPress={send} />
      </View>
    </SafeAreaView>
  );
}