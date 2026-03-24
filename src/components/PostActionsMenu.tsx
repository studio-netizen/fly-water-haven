import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  location_tag: string | null;
  fish_species: string[] | null;
  gear_used: string[] | null;
}

interface PostActionsMenuProps {
  post: Post;
  onUpdated: () => void;
}

const PostActionsMenu = ({ post, onUpdated }: PostActionsMenuProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [caption, setCaption] = useState(post.caption || '');
  const [locationTag, setLocationTag] = useState(post.location_tag || '');
  const [fishSpecies, setFishSpecies] = useState(post.fish_species?.join(', ') || '');
  const [gearUsed, setGearUsed] = useState(post.gear_used?.join(', ') || '');
  const [loading, setLoading] = useState(false);

  const handleEdit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('posts').update({
        caption: caption || null,
        location_tag: locationTag || null,
        fish_species: fishSpecies ? fishSpecies.split(',').map(s => s.trim()) : null,
        gear_used: gearUsed ? gearUsed.split(',').map(s => s.trim()) : null,
      }).eq('id', post.id);
      if (error) throw error;
      toast.success('Post aggiornato!');
      setEditOpen(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Extract storage path from URL
      const url = new URL(post.image_url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/posts\/(.+)/);
      if (pathMatch) {
        await supabase.storage.from('posts').remove([pathMatch[1]]);
      }

      // Delete related data first
      await supabase.from('likes').delete().eq('post_id', post.id);
      await supabase.from('comments').delete().eq('post_id', post.id);
      
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      toast.success('Post eliminato');
      setDeleteOpen(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded-full hover:bg-muted transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil className="w-4 h-4" /> Modifica post
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4" /> Elimina post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Didascalia</Label>
              <Textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Località</Label>
              <Input value={locationTag} onChange={e => setLocationTag(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Specie ittica</Label>
              <Input value={fishSpecies} onChange={e => setFishSpecies(e.target.value)} placeholder="Trota, Luccio" />
            </div>
            <div className="space-y-1">
              <Label>Attrezzatura</Label>
              <Input value={gearUsed} onChange={e => setGearUsed(e.target.value)} placeholder="Canna 5wt" />
            </div>
            <Button onClick={handleEdit} className="w-full" disabled={loading}>
              {loading ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina post</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo post? L'azione è irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostActionsMenu;
