import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Fish, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MapAuthGate = () => {
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      {/* Backdrop blur over the map + sidebar */}
      <div
        className="fixed inset-0 z-[1500] bg-background/40 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Centered modal card */}
      {!dismissed && (
        <div
          className="fixed inset-0 z-[1600] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-gate-title"
        >
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-7 sm:p-9 animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-forest-accent/10 flex items-center justify-center">
                <Fish className="w-7 h-7 text-forest-accent" strokeWidth={1.5} />
              </div>
            </div>

            <h2
              id="map-gate-title"
              className="display-lg text-center text-foreground mb-3 text-2xl sm:text-3xl"
            >
              Esplora i migliori spot d'Italia
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed mb-6">
              Per proteggere i nostri fiumi e condividere le coordinate precise,
              Flywaters è una community riservata. Registrati gratuitamente per
              sbloccare la mappa completa, i consigli sulle mosche e i dati
              idrometrici.
            </p>

            <div className="space-y-3">
              <Button asChild size="lg" className="w-full rounded-full">
                <Link to="/auth">Unisciti alla Community (Gratis)</Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Hai già un account?{' '}
                <Link
                  to="/auth"
                  className="text-forest-accent font-semibold hover:underline"
                >
                  Accedi qui
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MapAuthGate;
