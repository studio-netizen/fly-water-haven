import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface Conversation {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages(selectedUser.user_id);

      const channel = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, (payload) => {
          if (payload.new.sender_id === selectedUser.user_id) {
            setMessages(prev => [...prev, payload.new]);
            scrollToBottom();
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedUser, user]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    const convMap = new Map<string, { last_message: string; last_time: string; unread: number }>();
    data.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          last_message: msg.content,
          last_time: msg.created_at,
          unread: (!msg.read && msg.receiver_id === user.id) ? 1 : 0,
        });
      } else if (!msg.read && msg.receiver_id === user.id) {
        const c = convMap.get(partnerId)!;
        c.unread++;
      }
    });

    const userIds = Array.from(convMap.keys());
    if (userIds.length === 0) { setConversations([]); setLoading(false); return; }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    const convs: Conversation[] = userIds.map(uid => {
      const profile = profiles?.find(p => p.user_id === uid);
      const conv = convMap.get(uid)!;
      return {
        user_id: uid,
        username: profile?.username || null,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        ...conv,
      };
    });

    setConversations(convs);
    setLoading(false);
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      scrollToBottom();
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('read', false);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedUser || !newMessage.trim()) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser.user_id,
      content: newMessage.trim(),
    });
    if (!error) {
      setMessages(prev => [...prev, { sender_id: user.id, receiver_id: selectedUser.user_id, content: newMessage.trim(), created_at: new Date().toISOString() }]);
      setNewMessage('');
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Accedi per vedere i messaggi</p>
        <BottomNav />
      </div>
    );
  }

  // Chat view
  if (selectedUser) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="glass border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedUser.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {(selectedUser.display_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground text-sm">{selectedUser.display_name || selectedUser.username}</span>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user.id;
            return (
              <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="glass border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-foreground">Messaggi</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-muted-foreground">Nessun messaggio ancora</p>
            <p className="text-sm text-muted-foreground mt-1">Inizia una conversazione dal profilo di un utente</p>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.user_id}
              onClick={() => setSelectedUser(conv)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border text-left"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={conv.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(conv.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{conv.display_name || conv.username}</p>
                <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
              </div>
              {conv.unread > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {conv.unread}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
