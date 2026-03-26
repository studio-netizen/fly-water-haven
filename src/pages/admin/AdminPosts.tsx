import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, Heart, MessageCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  like_count: number | null;
  comment_count: number | null;
  location_tag: string | null;
  fish_species: string[] | null;
  created_at: string;
  profiles?: { username: string | null; avatar_url: string | null } | null;
}

export default function AdminPosts() {
  const { adminFetch } = useAdminApi();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_profiles_fkey(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(200);
    setPosts((data || []) as Post[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deletePost = async (id: string) => {
    await adminFetch('delete_post', { id });
    toast.success('Post rimosso');
    load();
  };

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.caption || '').toLowerCase().includes(q) ||
      (p.profiles?.username || '').toLowerCase().includes(q) ||
      (p.fish_species || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: '#242242' }}>Post</h1>
      <Input placeholder="Cerca per autore, specie, didascalia..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rimuovere questo post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Il post verrà eliminato permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePost(p.id)}>Rimuovi</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="text-xs font-medium">@{p.profiles?.username || '?'}</p>
                <p className="text-xs text-muted-foreground truncate">{p.caption || ''}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.like_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{p.comment_count || 0}</span>
                  {p.location_tag && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location_tag}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(p.created_at), 'dd MMM yyyy', { locale: it })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
