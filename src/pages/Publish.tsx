import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImagePlus, ArrowLeft, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';

const COMMON_SPECIES = ['Trota fario', 'Trota iridea', 'Temolo', 'Salmerino', 'Luccio', 'Persico', 'Carpa'];
const COMMON_GEAR = ['Canna 3wt', 'Canna 5wt', 'Canna 7wt', 'Nymphing', 'Streamer', 'Secca', 'Spinning'];

const Publish = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedGear, setSelectedGear] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
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
        location_tag: location?.name || null,
        fish_species: selectedSpecies.length > 0 ? selectedSpecies : null,
        gear_used: selectedGear.length > 0 ? selectedGear : null,
      });

      if (error) throw error;
      toast.success('Post pubblicato!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Accedi per pubblicare</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Nuovo post</h1>
          <Button size="sm" onClick={handleSubmit} disabled={loading || !imageFile} className="text-sm">
            {loading ? 'Pubblica...' : 'Pubblica'}
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Image upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="aspect-[4/5] rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Anteprima" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <ImagePlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Tocca per aggiungere una foto</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {/* Location tagging */}
        <div>
          <Label className="text-sm font-medium">Posizione</Label>
          {location ? (
            <div className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-primary/10 rounded-full w-fit">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium text-foreground">{location.name}</span>
              <button onClick={() => setLocation(null)}>
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ) : showLocationPicker ? (
            <div className="mt-1.5">
              <LocationPicker value={location} onChange={(loc) => { setLocation(loc); if (loc) setShowLocationPicker(false); }} placeholder="Cerca località..." />
              <button onClick={() => setShowLocationPicker(false)} className="text-xs text-muted-foreground mt-1 hover:underline">
                Annulla
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-1.5 gap-2"
              onClick={() => setShowLocationPicker(true)}
            >
              <MapPin className="w-4 h-4" /> Aggiungi posizione
            </Button>
          )}
        </div>

        {/* Caption */}
        <div>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="Scrivi una didascalia..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{caption.length}/300</p>
        </div>

        {/* Fish species chips */}
        <div>
          <Label className="text-sm font-medium">Specie ittica</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {COMMON_SPECIES.map(s => (
              <button
                key={s}
                onClick={() => toggleItem(s, selectedSpecies, setSelectedSpecies)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  selectedSpecies.includes(s)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Gear chips */}
        <div>
          <Label className="text-sm font-medium">Attrezzatura utilizzata</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {COMMON_GEAR.map(g => (
              <button
                key={g}
                onClick={() => toggleItem(g, selectedGear, setSelectedGear)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  selectedGear.includes(g)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary/50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Pubblico</p>
            <p className="text-xs text-muted-foreground">{isPublic ? 'Visibile a tutti' : 'Solo follower'}</p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Publish;
