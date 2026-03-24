import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Plus, Filter, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

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
  const [addMode, setAddMode] = useState(false);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [spotName, setSpotName] = useState('');
  const [spotType, setSpotType] = useState('river');
  const [spotDesc, setSpotDesc] = useState('');
  const [spotFish, setSpotFish] = useState('');
  const [spotAccess, setSpotAccess] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const addModeRef = useRef(false);

  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([42.5, 12.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!addModeRef.current) return;
      setNewSpotCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      setShowAddDialog(true);
      setAddMode(false);
    });

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

  const handleCreateSpot = async () => {
    if (!user || !newSpotCoords || !spotName) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('spots').insert({
        created_by: user.id,
        name: spotName,
        description: spotDesc || null,
        spot_type: spotType,
        latitude: newSpotCoords.lat,
        longitude: newSpotCoords.lng,
        fish_species: spotFish ? spotFish.split(',').map(s => s.trim()) : null,
        access_info: spotAccess || null,
      });
      if (error) throw error;
      toast.success('Spot aggiunto!');
      setShowAddDialog(false);
      setSpotName('');
      setSpotDesc('');
      setSpotFish('');
      setSpotAccess('');
      fetchSpots();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
        {user && (
          <Button
            onClick={() => setAddMode(!addMode)}
            size="sm"
            variant={addMode ? 'destructive' : 'default'}
            className="shadow-lg"
          >
            {addMode ? <><X className="w-4 h-4 mr-1" /> Annulla</> : <><Plus className="w-4 h-4 mr-1" /> Aggiungi spot</>}
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

      {addMode && (
        <div className="absolute top-16 left-4 z-[1000] bg-card/90 backdrop-blur rounded-lg px-3 py-2 text-sm text-foreground shadow-lg">
          <MapPin className="w-4 h-4 inline mr-1 text-primary" /> Tocca sulla mappa per posizionare un pin
        </div>
      )}

      <div ref={mapContainerRef} className="flex-1 z-0" />

      {/* Add spot dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi nuovo spot di pesca</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
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
              <Label>Specie ittiche (separate da virgola)</Label>
              <Input value={spotFish} onChange={e => setSpotFish(e.target.value)} placeholder="Trota, Luccio, Persico" />
            </div>
            <div className="space-y-1">
              <Label>Informazioni di accesso</Label>
              <Input value={spotAccess} onChange={e => setSpotAccess(e.target.value)} placeholder="Come raggiungere lo spot" />
            </div>
            <Button onClick={handleCreateSpot} className="w-full" disabled={loading || !spotName}>
              {loading ? 'Salvataggio...' : 'Aggiungi spot'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default SpotMap;
