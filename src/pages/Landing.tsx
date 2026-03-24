import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AuthModal from '@/components/AuthModal';
import logoWhite from '@/assets/flywaters-logo-white.png';
import logoDark from '@/assets/flywaters-logo-dark.png';
import heroImg from '@/assets/landing-hero.jpg';
import editorialImg from '@/assets/landing-editorial.jpg';
import spotLake from '@/assets/spot-lake.jpg';
import spotRiver from '@/assets/spot-river.jpg';
import spotStream from '@/assets/spot-stream.jpg';

const slow = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] as const },
  },
});

const values = [
  { label: 'SCOPRI', text: 'Trova spot nascosti in tutta Italia' },
  { label: 'CONDIVIDI', text: 'Pubblica le tue catture e la tua attrezzatura' },
  { label: 'CONNETTI', text: 'Scrivi ad altri pescatori' },
];

const spots = [
  { img: spotLake, region: 'TRENTINO-ALTO ADIGE', name: 'Lago di Tovel' },
  { img: spotRiver, region: 'FRIULI VENEZIA GIULIA', name: 'Torrente Natisone' },
  { img: spotStream, region: 'LOMBARDIA', name: 'Torrente Mella' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  // Fetch profile for avatar
  const [profile, setProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);
  import { useEffect } from 'react'; // hoisted

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>

      {/* ─── STICKY NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src={logoWhite} alt="Flywaters" className="h-8" />

          {!authLoading && !user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuth('login')}
                className="hidden sm:inline-block px-5 py-2 text-xs tracking-widest uppercase font-medium border border-white/60 text-white hover:bg-white/10 transition-colors"
              >
                Accedi
              </button>
              <button
                onClick={() => openAuth('register')}
                className="px-5 py-2 text-xs tracking-widest uppercase font-medium bg-[#242242] text-[#f5f0e8] hover:bg-[#242242]/85 transition-colors sm:inline-block"
              >
                <span className="sm:hidden">Accedi</span>
                <span className="hidden sm:inline">Registrati</span>
              </button>
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8 border border-white/30">
                    <AvatarImage src={''} />
                    <AvatarFallback className="bg-white/20 text-white text-sm">
                      {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => navigate('/profile')}>Profilo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/')}>Feed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>Esci</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />

      {/* ─── HERO ─── */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="Pescatore a mosca in un fiume di montagna"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-[#242242]/50" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-8"
          >
            <img src={logoWhite} alt="Flywaters" className="h-10 sm:h-12 mx-auto" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight font-serif"
          >
            Ogni fiume racconta<br />una storia. Trova la tua.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-10"
          >
            <button
              onClick={() => navigate('/map')}
              className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-medium bg-[#242242] text-[#f5f0e8] hover:bg-[#242242]/85 transition-colors"
            >
              Esplora gli spot
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' as const }}
          >
            <ArrowDown className="w-5 h-5 text-white/50" strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── EDITORIAL ─── */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div
            variants={slow(0)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="overflow-hidden"
          >
            <img
              src={editorialImg}
              alt="Pescatore in un torrente di montagna in autunno"
              className="w-full h-[500px] md:h-[600px] object-cover"
              loading="lazy"
              width={1280}
              height={1600}
            />
          </motion.div>

          <motion.div
            variants={slow(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-md"
          >
            <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-4">La nostra missione</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-6">
              Creato dai pescatori<br />a mosca, per i pescatori a mosca
            </h2>
            <p className="text-base leading-relaxed text-[#8c8c7a] mb-8">
              Crediamo che le migliori storie di pesca inizino con lo spot giusto.
              Flywaters è una community dove i pescatori italiani condividono le proprie conoscenze,
              documentano le catture e proteggono le acque che amano.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-medium tracking-wide text-[#242242] hover:text-[#4a7c59] transition-colors inline-flex items-center gap-2 group"
            >
              Unisciti alla community
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── VALUES STRIP ─── */}
      <section className="border-t border-b border-[#242242]/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#242242]/10">
          {values.map((v, i) => (
            <motion.div
              key={v.label}
              variants={slow(i * 0.15)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="px-8 py-10 md:py-14"
            >
              <p className="text-xs tracking-[0.35em] uppercase text-[#4a7c59] font-medium mb-3">
                {v.label}
              </p>
              <p className="text-base text-[#8c8c7a] leading-relaxed">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FEATURED SPOTS ─── */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.p
            variants={slow(0)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-4"
          >
            In evidenza
          </motion.p>
          <motion.h2
            variants={slow(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold font-serif mb-14"
          >
            Spot che valgono il viaggio
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {spots.map((s, i) => (
              <motion.button
                key={s.name}
                variants={slow(i * 0.15)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                onClick={() => navigate('/map')}
                className="text-left group"
              >
                <div className="overflow-hidden mb-4">
                  <img
                    src={s.img}
                    alt={s.name}
                    className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    width={1200}
                    height={800}
                  />
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c8c7a] mb-1">{s.region}</p>
                <p className="text-lg font-semibold font-serif">{s.name}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#242242] text-[#f5f0e8]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoWhite} alt="Flywaters" className="h-6" />
          <p className="text-xs tracking-[0.2em] uppercase text-[#f5f0e8]/50">
            Lancia. Connetti. Ripeti.
          </p>
          <div className="flex gap-8 text-xs tracking-wide text-[#f5f0e8]/60">
            <a href="#" className="hover:text-[#f5f0e8] transition-colors">Chi siamo</a>
            <a href="#" className="hover:text-[#f5f0e8] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#f5f0e8] transition-colors">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
