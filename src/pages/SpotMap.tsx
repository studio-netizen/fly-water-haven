import { useState, useEffect, useRef } from 'react';
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
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

// Fix leaflet default markers
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

const AddSpotMarker = ({ onAdd }: { onAdd: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const SpotMap = () => {
  const { user } = useAuth();
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
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    const { data } = await supabase.from('spots').select('*').order('created_at', { ascending: false });
    if (data) setSpots(data as Spot[]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!addMode) return;
    setNewSpotCoords({ lat, lng });
    setShowAddDialog(true);
    setAddMode(false);
  };

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
      toast.success('Spot added!');
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

  const filteredSpots = filterType ? spots.filter(s => s.spot_type === filterType) : spots;

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
            {addMode ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Plus className="w-4 h-4 mr-1" /> Add Spot</>}
          </Button>
        )}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 bg-card shadow-lg">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="lake">Lake</SelectItem>
            <SelectItem value="river">River</SelectItem>
            <SelectItem value="sea">Sea</SelectItem>
            <SelectItem value="stream">Stream</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {addMode && (
        <div className="absolute top-16 left-4 z-[1000] glass rounded-lg px-3 py-2 text-sm text-foreground shadow-lg">
          <MapPin className="w-4 h-4 inline mr-1 text-primary" /> Tap on the map to drop a pin
        </div>
      )}

      <MapContainer
        center={[42.5, 12.5]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {addMode && <AddSpotMarker onAdd={handleMapClick} />}
        {filteredSpots.map(spot => (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude]}
            icon={createSpotIcon(spot.spot_type, spot.avg_rating)}
            eventHandlers={{ click: () => setSelectedSpot(spot) }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-sm">{spot.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs capitalize">{spot.spot_type}</Badge>
                  {spot.avg_rating > 0 && (
                    <span className="flex items-center gap-0.5 text-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {Number(spot.avg_rating).toFixed(1)} ({spot.review_count})
                    </span>
                  )}
                </div>
                {spot.description && <p className="text-xs mt-1 text-muted-foreground">{spot.description}</p>}
                {spot.fish_species && spot.fish_species.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {spot.fish_species.map(f => (
                      <span key={f} className="text-xs bg-secondary px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Add spot dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Fishing Spot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={spotName} onChange={e => setSpotName(e.target.value)} placeholder="Spot name" />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={spotType} onValueChange={setSpotType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lake">Lake</SelectItem>
                  <SelectItem value="river">River</SelectItem>
                  <SelectItem value="sea">Sea</SelectItem>
                  <SelectItem value="stream">Stream</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={spotDesc} onChange={e => setSpotDesc(e.target.value)} placeholder="Describe the spot..." rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Fish Species (comma separated)</Label>
              <Input value={spotFish} onChange={e => setSpotFish(e.target.value)} placeholder="Trout, Pike, Bass" />
            </div>
            <div className="space-y-1">
              <Label>Access Info</Label>
              <Input value={spotAccess} onChange={e => setSpotAccess(e.target.value)} placeholder="How to reach this spot" />
            </div>
            <Button onClick={handleCreateSpot} className="w-full" disabled={loading || !spotName}>
              {loading ? 'Saving...' : 'Add Spot'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default SpotMap;
