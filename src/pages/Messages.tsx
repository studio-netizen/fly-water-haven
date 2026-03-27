import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Plus, Search, X } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useTranslation } from 'react-i18next';

interface Conversation {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read?: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (paramUserId && user) openConversationWithUser(paramUserId);
  }, [paramUserId, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!selectedUser || !user) return;
    fetchMessages(selectedUser.user_id);
    const channel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const msg = payload.new as Message;
        const isRelevant = (msg.sender_id === selectedUser.user_id && msg.receiver_id === user.id) || (msg.sender_id === user.id && msg.receiver_id === selectedUser.user_id);
        if (isRelevant) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            const cleaned = prev.filter(m => m.id);
            return [...cleaned, msg];
          });
          scrollToBottom();
          if (msg.sender_id === selectedUser.user_id) {
            supabase.from('messages').update({ read: true }).eq('id', msg.id).then();
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedUser, user]);

  const openConversationWithUser = async (targetUserId: string) => {
    const { data: profile } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').eq('user_id', targetUserId).single();
    if (profile) {
      setSelectedUser({ user_id: profile.user_id, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url, last_message: '', last_time: new Date().toISOString(), unread: 0 });
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }
    const convMap = new Map<string, { last_message: string; last_time: string; unread: number }>();
    data.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, { last_message: msg.content, last_time: msg.created_at, unread: (!msg.read && msg.receiver_id === user.id) ? 1 : 0 });
      } else if (!msg.read && msg.receiver_id === user.id) {
        convMap.get(partnerId)!.unread++;
      }
    });
    const userIds = Array.from(convMap.keys());
    if (userIds.length === 0) { setConversations([]); setLoading(false); return; }
    const { data: profiles } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').in('user_id', userIds);
    const convs: Conversation[] = userIds.map(uid => {
      const profile = profiles?.find(p => p.user_id === uid);
      return { user_id: uid, username: profile?.username || null, display_name: profile?.display_name || null, avatar_url: profile?.avatar_url || null, ...convMap.get(uid)! };
    });
    convs.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
    setConversations(convs);
    setLoading(false);
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;
    const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      scrollToBottom();
      await supabase.from('messages').update({ read: true }).eq('sender_id', partnerId).eq('receiver_id', user.id).eq('read', false);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedUser || !newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage('');
    const optimistic: Message = { sender_id: user.id, receiver_id: selectedUser.user_id, content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selectedUser.user_id, content });
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const { data } = await supabase.from('profiles').select('user_id, username, display_name, avatar_url').neq('user_id', user!.id).or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(10);
    setSearchResults(data || []);
    setSearchLoading(false);
  };

  const startConversation = (profile: any) => {
    setShowSearch(false); setSearchQuery(''); setSearchResults([]);
    setSelectedUser({ user_id: profile.user_id, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url, last_message: '', last_time: new Date().toISOString(), unread: 0 });
  };

  const scrollToBottom = () => { setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const goBack = () => { setSelectedUser(null); if (paramUserId) navigate('/messages', { replace: true }); };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('auth.loginToSee')} {t('nav.messages').toLowerCase()}</p>
        </div>
      </AppLayout>
    );
  }

  if (selectedUser) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="w-5 h-5" /></Button>
          <button onClick={() => navigate(`/profile/${selectedUser.user_id}`)} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedUser.avatar_url || ''} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">{(selectedUser.display_name || 'U')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-foreground text-sm">{selectedUser.display_name || selectedUser.username}</span>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user.id;
            return (
              <div key={msg.id || `opt-${i}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed ${isMine ? 'bg-[#242242] text-white' : 'bg-[#f0f0eb] text-foreground'}`} style={{ borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-border px-4 py-3 bg-background" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="flex gap-2">
            <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={t('messages.typeMessage')} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} className="rounded-full" />
            <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()} className="rounded-full px-5"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    );
  }

  if (showSearch) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => searchUsers(e.target.value)} placeholder={t('messages.searchUser')} className="rounded-full pl-9" autoFocus />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {searchLoading && <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>}
          {searchResults.map(p => (
            <button key={p.user_id} onClick={() => startConversation(p)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 text-left">
              <Avatar className="h-11 w-11"><AvatarImage src={p.avatar_url || ''} /><AvatarFallback className="bg-muted text-muted-foreground text-sm">{(p.display_name || 'U')[0].toUpperCase()}</AvatarFallback></Avatar>
              <div><p className="text-sm font-semibold text-foreground">{p.display_name || p.username}</p>{p.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}</div>
            </button>
          ))}
          {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <p className="text-center py-10 text-sm text-muted-foreground">{t('messages.noUserFound')}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">{t('messages.title')}</h1>
          <button onClick={() => setShowSearch(true)} className="p-2 hover:bg-muted rounded-full transition-colors"><Plus className="w-5 h-5 text-foreground" /></button>
        </div>
      </header>
      <div className="hidden lg:flex max-w-lg mx-auto px-4 pt-4 justify-between items-center">
        <h1 className="text-lg font-semibold text-foreground">{t('messages.title')}</h1>
        <button onClick={() => setShowSearch(true)} className="p-2 hover:bg-muted rounded-full transition-colors"><Plus className="w-5 h-5 text-foreground" /></button>
      </div>
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Send className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">{t('messages.noMessages')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('messages.startConversation')}</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowSearch(true)}>
              <Plus className="w-4 h-4 mr-2" /> {t('messages.newMessage')}
            </Button>
          </div>
        ) : (
          conversations.map(conv => (
            <button key={conv.user_id} onClick={() => setSelectedUser(conv)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border text-left">
              <Avatar className="h-14 w-14"><AvatarImage src={conv.avatar_url || ''} /><AvatarFallback className="bg-muted text-muted-foreground text-lg">{(conv.display_name || 'U')[0].toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm text-foreground ${conv.unread > 0 ? 'font-bold' : 'font-medium'}`}>{conv.display_name || conv.username}</p>
                  <span className="text-xs text-muted-foreground">{formatTime(conv.last_time)}</span>
                </div>
                <p className={`text-sm truncate ${conv.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{conv.last_message}</p>
              </div>
              {conv.unread > 0 && <span className="bg-blue-500 text-white text-[11px] rounded-full w-2.5 h-2.5 flex-shrink-0" />}
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Messages;
