import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import { validateImageFile, compressImage } from '@/lib/image-compression';
import TagChipSelector from '@/components/TagChipSelector';
import { FISH_SPECIES, FISHING_TECHNIQUES, FISHING_GEAR } from '@/lib/fishing-constants';

interface Props {
  onPostCreated: () => void;
}

const CreatePostDialog = ({ onPostCreated }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [selectedGear, setSelectedGear] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) { toast.error(error); return; }
    setCompressing(true);
    try {
      const result = await compressImage(file, 'default');
      setImageFile(result.file);
      setImagePreview(URL.createObjectURL(result.file));
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !imageFile) return;
    setLoading(true);

    try {
      const path = `${user.id}/${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage.from('posts').upload(path, imageFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption || null,
        location_tag: location?.name || null,
        fish_species: selectedSpecies.length > 0 ? selectedSpecies : null,
        fishing_technique: selectedTechniques.length > 0 ? selectedTechniques : null,
        gear_used: selectedGear.length > 0 ? selectedGear : null,
      });

      if (error) throw error;
      toast.success('Post condiviso!');
      setOpen(false);
      setCaption('');
      setLocation(null);
      setSelectedSpecies([]);
      setSelectedTechniques([]);
      setSelectedGear([]);
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
          compressing ? (
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImagePlus className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tocca per aggiungere una foto</p>
              </div>
            )
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFileChange} className="hidden" />

          <div className="space-y-2">
            <Label>Didascalia</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Descrivi la tua cattura..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Località</Label>
            <LocationPicker value={location} onChange={setLocation} placeholder="Cerca località..." />
          </div>

          <TagChipSelector label="Specie ittica" options={FISH_SPECIES} selected={selectedSpecies} onChange={setSelectedSpecies} />
          <TagChipSelector label="Tecnica di pesca" options={FISHING_TECHNIQUES} selected={selectedTechniques} onChange={setSelectedTechniques} />
          <TagChipSelector label="Attrezzatura utilizzata" options={FISHING_GEAR} selected={selectedGear} onChange={setSelectedGear} />

          <Button onClick={handleSubmit} className="w-full" disabled={loading || !imageFile}>
            {loading ? 'Caricamento...' : 'Pubblica'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
