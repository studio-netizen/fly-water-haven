import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onPostCreated: () => void;
}

const CreatePostDialog = ({ onPostCreated }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [fishSpecies, setFishSpecies] = useState('');
  const [gearUsed, setGearUsed] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !imageFile) return;
    setLoading(true);

    try {
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('posts').upload(path, imageFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption || null,
        location_tag: locationTag || null,
        fish_species: fishSpecies ? fishSpecies.split(',').map(s => s.trim()) : null,
        gear_used: gearUsed ? gearUsed.split(',').map(s => s.trim()) : null,
      });

      if (error) throw error;
      toast.success('Post condiviso!');
      setOpen(false);
      setCaption('');
      setLocationTag('');
      setFishSpecies('');
      setGearUsed('');
      setImageFile(null);
      setImagePreview(null);
      onPostCreated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Condividi la tua cattura</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Anteprima" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <ImagePlus className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tocca per aggiungere una foto</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

          <div className="space-y-2">
            <Label>Didascalia</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Descrivi la tua cattura..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Località</Label>
            <Input value={locationTag} onChange={(e) => setLocationTag(e.target.value)} placeholder="es. Lago di Como, Italia" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Specie ittica</Label>
              <Input value={fishSpecies} onChange={(e) => setFishSpecies(e.target.value)} placeholder="Trota, Luccio" />
            </div>
            <div className="space-y-2">
              <Label>Attrezzatura</Label>
              <Input value={gearUsed} onChange={(e) => setGearUsed(e.target.value)} placeholder="Canna 5wt" />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={loading || !imageFile}>
            {loading ? 'Caricamento...' : 'Pubblica'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
