import { useState, useEffect, useRef } from 'react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Plus, Filter, X, ImagePlus } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BottomNav from '@/components/BottomNav';
import DesktopSidebar from '@/components/DesktopSidebar';
import { toast } from 'sonner';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SPOT_COLORS: Record<string, string> = {
  lake: '#3b82f6',
  river: '#06b6d4',
  sea: '#1e40af',
  stream: '#14b8a6',
};

const SPOT_TYPE_LABELS: Record<string, string> = {
  lake: 'Lago',
  river: 'Fiume',
  sea: 'Mare',
  stream: 'Torrente',
};

const createSpotIcon = (type: string, rating: number) => {
  const color = SPOT_COLORS[type] || '#3b82f6';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${rating > 0 ? rating.toFixed(1) : '•'}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

interface Spot {
  id: string;
  name: string;
  description: string | null;
  spot_type: string;
  latitude: number;
  longitude: number;
  fish_species: string[] | null;
  access_info: string | null;
  avg_rating: number;
  review_count: number;
}

const SpotMap = () => {
  const { user } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [spotName, setSpotName] = useState('');
  const [spotType, setSpotType] = useState('river');
  const [spotDesc, setSpotDesc] = useState('');
  const [spotFish, setSpotFish] = useState('');
  const [spotAccess, setSpotAccess] = useState('');
  const [spotLocation, setSpotLocation] = useState<LocationResult | null>(null);
  const [spotPhotos, setSpotPhotos] = useState<File[]>([]);
  const [spotPhotosPreviews, setSpotPhotosPreviews] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const photosRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([42.5, 12.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    const { data } = await supabase.from('spots').select('*').order('created_at', { ascending: false });
    if (data) setSpots(data as Spot[]);
  };

  // When spot location changes, center map
  useEffect(() => {
    if (spotLocation && mapRef.current) {
      mapRef.current.setView([spotLocation.lat, spotLocation.lng], 13, { animate: true });
    }
  }, [spotLocation]);

  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    const filteredSpots = filterType && filterType !== 'all' ? spots.filter(s => s.spot_type === filterType) : spots;

    filteredSpots.forEach(spot => {
      const marker = L.marker([spot.latitude, spot.longitude], {
        icon: createSpotIcon(spot.spot_type, spot.avg_rating),
      });

      const fishHtml = spot.fish_species?.length
        ? `<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">${spot.fish_species.map(f => `<span style="font-size:11px;background:#f1f5f9;padding:1px 6px;border-radius:4px">${f}</span>`).join('')}</div>`
        : '';

      const ratingHtml = spot.avg_rating > 0
        ? `<span style="font-size:11px">⭐ ${Number(spot.avg_rating).toFixed(1)} (${spot.review_count})</span>`
        : '';

      const typeLabel = SPOT_TYPE_LABELS[spot.spot_type] || spot.spot_type;

      marker.bindPopup(`
        <div style="min-width:180px">
          <strong style="font-size:13px">${spot.name}</strong>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <span style="font-size:11px;background:#e2e8f0;padding:1px 6px;border-radius:4px">${typeLabel}</span>
            ${ratingHtml}
          </div>
          ${spot.description ? `<p style="font-size:11px;margin-top:4px;color:#64748b">${spot.description}</p>` : ''}
          ${fishHtml}
          <a href="/spot/${spot.id}" style="display:inline-block;margin-top:8px;font-size:11px;color:#242242;font-weight:600;text-decoration:none">Vedi dettagli →</a>
        </div>
      `);

      marker.addTo(markersRef.current!);
    });
  }, [spots, filterType]);

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSpotPhotos(prev => [...prev, ...files]);
    setSpotPhotosPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (idx: number) => {
    setSpotPhotos(prev => prev.filter((_, i) => i !== idx));
    setSpotPhotosPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateSpot = async () => {
    if (!user || !spotLocation || !spotName) return;
    setLoading(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const file of spotPhotos) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('spots').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('spots').getPublicUrl(path);
        photoUrls.push(publicUrl);
      }

      const { error } = await supabase.from('spots').insert({
        created_by: user.id,
        name: spotName,
        description: spotDesc || null,
        spot_type: spotType,
        latitude: spotLocation.lat,
        longitude: spotLocation.lng,
        fish_species: spotFish ? spotFish.split(',').map(s => s.trim()) : null,
        access_info: spotAccess || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
      });
      if (error) throw error;
      toast.success('Spot aggiunto!');
      setShowAddDialog(false);
      resetForm();
      fetchSpots();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSpotName('');
    setSpotDesc('');
    setSpotFish('');
    setSpotAccess('');
    setSpotType('river');
    setSpotLocation(null);
    setSpotPhotos([]);
    setSpotPhotosPreviews([]);
  };

  return (
    <div className="h-screen flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col relative">
        {/* Controls */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
          {user && (
            <Button
              onClick={() => { resetForm(); setShowAddDialog(true); }}
              size="sm"
              className="shadow-lg"
            >
              <Plus className="w-4 h-4 mr-1" /> Aggiungi spot
            </Button>
          )}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 bg-card shadow-lg">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue placeholder="Tutti i tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="lake">Lago</SelectItem>
              <SelectItem value="river">Fiume</SelectItem>
              <SelectItem value="sea">Mare</SelectItem>
              <SelectItem value="stream">Torrente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div ref={mapContainerRef} className="flex-1 z-0" />

        {/* Add spot dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aggiungi nuovo spot di pesca</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Location search */}
              <div className="space-y-1">
                <Label>Posizione</Label>
                <LocationPicker
                  value={spotLocation}
                  onChange={setSpotLocation}
                  showMapPreview
                  placeholder="Cerca località, fiume, lago..."
                />
              </div>

              <div className="space-y-1">
                <Label>Nome dello spot</Label>
                <Input value={spotName} onChange={e => setSpotName(e.target.value)} placeholder="Nome dello spot" />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={spotType} onValueChange={setSpotType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lake">Lago</SelectItem>
                    <SelectItem value="river">Fiume</SelectItem>
                    <SelectItem value="sea">Mare</SelectItem>
                    <SelectItem value="stream">Torrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Descrizione</Label>
                <Textarea value={spotDesc} onChange={e => setSpotDesc(e.target.value)} placeholder="Descrivi lo spot..." rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Specie presenti (separate da virgola)</Label>
                <Input value={spotFish} onChange={e => setSpotFish(e.target.value)} placeholder="Trota, Luccio, Persico" />
              </div>
              <div className="space-y-1">
                <Label>Informazioni di accesso</Label>
                <Textarea value={spotAccess} onChange={e => setSpotAccess(e.target.value)} placeholder="Come raggiungere lo spot, parcheggio, permessi..." rows={2} />
              </div>

              {/* Photo upload */}
              <div className="space-y-1">
                <Label>Foto (opzionale)</Label>
                <div className="flex gap-2 flex-wrap">
                  {spotPhotosPreviews.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => photosRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors bg-muted"
                  >
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
                <input ref={photosRef} type="file" accept="image/*" multiple onChange={handlePhotosChange} className="hidden" />
              </div>

              <Button onClick={handleCreateSpot} className="w-full" disabled={loading || !spotName || !spotLocation}>
                {loading ? 'Salvataggio...' : 'Aggiungi spot'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <BottomNav />
      </div>
    </div>
  );
};

export default SpotMap;
