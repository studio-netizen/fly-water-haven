import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, X, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LocationResult | null;
  onChange: (location: LocationResult | null) => void;
  showMapPreview?: boolean;
  placeholder?: string;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const LocationPicker = ({ value, onChange, showMapPreview = false, placeholder = "Cerca località..." }: LocationPickerProps) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const mapPreviewRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mini map preview
  useEffect(() => {
    if (!showMapPreview || !value || !mapPreviewRef.current) return;

    if (miniMapRef.current) {
      miniMapRef.current.remove();
      miniMapRef.current = null;
    }

    const map = L.map(mapPreviewRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([value.lat, value.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([value.lat, value.lng]).addTo(map);
    miniMapRef.current = map;

    return () => {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
    };
  }, [value, showMapPreview]);

  const searchPlaces = async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { action: 'autocomplete', input },
      });
      if (!error && data?.predictions) {
        setPredictions(data.predictions);
        setShowDropdown(true);
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(val), 300);
  };

  const selectPlace = async (prediction: Prediction) => {
    setShowDropdown(false);
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { action: 'details', placeId: prediction.place_id },
      });
      if (!error && data?.result) {
        const loc: LocationResult = {
          name: data.result.name || prediction.structured_formatting.main_text,
          address: data.result.formatted_address || prediction.description,
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        };
        onChange(loc);
        setQuery('');
        setPredictions([]);
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  const useGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode via Google
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=it&key=PROXY`
          ).catch(() => null);
          // Use edge function for reverse geocode isn't available, so set basic info
          onChange({
            name: 'Posizione attuale',
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            lat: latitude,
            lng: longitude,
          });
        } catch {
          onChange({
            name: 'Posizione attuale',
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            lat: latitude,
            lng: longitude,
          });
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground truncate">{value.address}</p>
          </div>
          <button onClick={() => onChange(null)} className="shrink-0">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        {showMapPreview && (
          <div ref={mapPreviewRef} className="h-32 rounded-lg overflow-hidden border border-border" />
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="space-y-2">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-10"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}

        {showDropdown && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-1 shadow-lg z-50 max-h-48 overflow-y-auto">
            {predictions.map((p) => (
              <button
                key={p.place_id}
                onClick={() => selectPlace(p)}
                className="w-full text-left px-3 py-2.5 hover:bg-muted text-sm flex items-start gap-2 border-b border-border last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{p.structured_formatting.main_text}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.structured_formatting.secondary_text}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={useGPS}
        disabled={gpsLoading}
        className="w-full gap-2"
      >
        {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        Usa la mia posizione attuale
      </Button>
    </div>
  );
};

export default LocationPicker;
