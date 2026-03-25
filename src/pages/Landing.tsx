import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AuthModal from '@/components/AuthModal';
import logoWhite from '@/assets/flywaters-logo-white.png';
import logoDark from '@/assets/flywaters-logo-dark.png';
const heroImg = 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=1920&q=80';
import editorialImg from '@/assets/editorial-wideshot.jpg';
import craftImg from '@/assets/craft-anglers.jpg';
import seasonCold from '@/assets/season-winter.jpg';
import seasonTemperate from '@/assets/season-spring.jpg';
import seasonWarm from '@/assets/season-summer.jpg';
import seasonSalt from '@/assets/season-saltwater.jpg';
import spotLake from '@/assets/spot-alpine-lake.jpg';
import spotRiver from '@/assets/spot-mountain-river.jpg';
import spotStream from '@/assets/spot-forest-stream.jpg';

const slow = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] as const },
  },
});

const seasons = [
  { key: 'cold', label: 'Inverno', img: seasonCold, desc: 'Torrenti alpini innevati, trote fario e temoli in acque cristalline. Servono strati caldi e wader robusti.' },
  { key: 'temperate', label: 'Primavera', img: seasonTemperate, desc: 'La stagione delle schiuse. Fiumi in piena, prati verdi e le prime mosche secche dell\'anno.' },
  { key: 'warm', label: 'Estate', img: seasonWarm, desc: 'Laghi dorati al tramonto, sessioni lunghe con attrezzatura leggera. Il momento perfetto per esplorare.' },
  { key: 'salt', label: 'Mare', img: seasonSalt, desc: 'Scogliere mediterranee, spigole e lecce. La pesca a mosca in saltwater è una sfida unica.' },
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
  const [activeSeason, setActiveSeason] = useState(0);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
      <SEOHead title="Flywaters — La community italiana per la pesca a mosca" description="Scopri i migliori spot di pesca in Italia, condividi le tue catture e connettiti con altri pescatori a mosca." canonical="https://flywaters.app/" />

      {/* ─── MINIMAL NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium tracking-wide text-white">Flywaters</span>
          {!authLoading && !user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuth('login')}
                className="hidden sm:inline-block px-5 py-2 text-xs tracking-widest uppercase font-medium text-white hover:opacity-70 transition-opacity"
              >
                Accedi
              </button>
              <button
                onClick={() => openAuth('register')}
                className="px-5 py-2 text-xs tracking-widest uppercase font-medium bg-white text-[#242242] hover:bg-white/90 transition-colors"
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

      {/* ─── HERO: FULL-BLEED IMAGE ─── */}
      <section className="relative">
        <div className="relative w-full h-[85vh]">
          <img
            src={heroImg}
            alt="Pescatore a mosca in un fiume alpino"
           className="w-full h-full object-cover object-center"
            style={{ filter: 'saturate(0.8) contrast(1.05)' }}
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
        </div>

        {/* Title below image — Patagonia style */}
        <div className="px-6 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-5xl sm:text-6xl md:text-8xl font-bold leading-[0.95] tracking-tight font-serif"
            >
              Fly Fishing
            </motion.h1>
          </div>
        </div>
      </section>

      {/* ─── MANIFESTO QUOTE ─── */}
      <section className="px-6 pb-20 md:pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.p
            variants={slow(0)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-xl sm:text-2xl md:text-3xl leading-relaxed font-serif max-w-4xl text-[#242242]/80"
          >
            Non c'è niente sulla terra come il contatto con un pesce selvaggio.
            Inseguire quel feeling — e quei pesci — ci ispira e ispira il nostro gear.
            È il motivo per cui supportiamo e celebriamo i pescatori e i gruppi
            che lottano per proteggere le acque che amiamo.
          </motion.p>
        </div>
      </section>

      {/* ─── GEAR PER STAGIONE — Tab con immagini ─── */}
      <section className="px-6 py-20 md:py-32 border-t border-[#242242]/10">
        <div className="max-w-7xl mx-auto">
          <motion.p
            variants={slow(0)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-3"
          >
            Ogni acqua, ogni stagione
          </motion.p>
          <motion.h2
            variants={slow(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold font-serif mb-10"
          >
            Spot per ogni condizione
          </motion.h2>

          {/* Season tabs */}
          <div className="flex gap-0 border-b border-[#242242]/10 mb-10">
            {seasons.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setActiveSeason(i)}
                className={`px-5 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${
                  activeSeason === i
                    ? 'border-[#242242] text-[#242242]'
                    : 'border-transparent text-[#8c8c7a] hover:text-[#242242]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Active season content */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <motion.div
              key={seasons[activeSeason].key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="overflow-hidden"
            >
              <img
                src={seasons[activeSeason].img}
                alt={seasons[activeSeason].label}
                className="w-full aspect-[4/5] object-cover"
                style={{ filter: 'saturate(0.8) contrast(1.05)' }}
                loading="lazy"
                width={800}
                height={1000}
              />
            </motion.div>
            <motion.div
              key={`text-${seasons[activeSeason].key}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <h3 className="text-2xl md:text-3xl font-bold font-serif mb-4">
                {seasons[activeSeason].label}
              </h3>
              <p className="text-base md:text-lg leading-relaxed text-[#8c8c7a] mb-8">
                {seasons[activeSeason].desc}
              </p>
              <button
                onClick={() => navigate('/map')}
                className="text-sm font-medium tracking-wide text-[#242242] hover:text-[#4a7c59] transition-colors inline-flex items-center gap-2 group"
              >
                Esplora gli spot
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── EDITORIAL: CRAFT BLOCK ─── */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div
            variants={slow(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-lg order-2 md:order-1"
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
              onClick={() => openAuth('register')}
              className="px-8 py-4 text-sm tracking-widest uppercase font-medium bg-[#242242] text-[#f5f0e8] hover:bg-[#242242]/85 transition-colors"
            >
              Unisciti alla community
            </button>
          </motion.div>

          <motion.div
            variants={slow(0)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="overflow-hidden order-1 md:order-2"
          >
            <img
              src={craftImg}
              alt="Costruzione di una mosca artigianale"
              className="w-full h-[500px] md:h-[700px] object-cover"
              loading="lazy"
              width={1080}
              height={1920}
            />
          </motion.div>
        </div>
      </section>

      {/* ─── FULL-WIDTH EDITORIAL IMAGE ─── */}
      <section>
        <motion.div
          variants={slow(0)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <img
            src={editorialImg}
            alt="Pescatore in un torrente di montagna in autunno"
            className="w-full h-[50vh] md:h-[70vh] object-cover"
            loading="lazy"
            width={1280}
            height={1600}
          />
        </motion.div>
      </section>

      {/* ─── FEATURED SPOTS ─── */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
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
            className="text-3xl md:text-5xl font-bold font-serif mb-14"
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

      {/* ─── CTA BANNER ─── */}
      <section className="bg-[#242242] text-[#f5f0e8] py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            variants={slow(0)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold font-serif mb-6"
          >
            Ogni fiume racconta una storia.
            <br />Trova la tua.
          </motion.h2>
          <motion.div
            variants={slow(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <button
              onClick={() => navigate('/map')}
              className="px-8 py-4 text-sm tracking-widest uppercase font-medium border border-[#f5f0e8]/60 text-[#f5f0e8] hover:bg-[#f5f0e8]/10 transition-colors"
            >
              Esplora gli spot
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#242242] text-[#f5f0e8] border-t border-[#f5f0e8]/10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoWhite} alt="Flywaters" className="h-6" />
          <p className="text-xs tracking-[0.2em] uppercase text-[#f5f0e8]/50">
            Lancia. Connetti. Ripeti.
          </p>
          <div className="flex gap-8 text-xs tracking-wide text-[#f5f0e8]/60">
            <a href="#" className="hover:text-[#f5f0e8] transition-colors">Chi siamo</a>
            <a href="https://www.iubenda.com/privacy-policy/53958448" className="iubenda-white iubenda-noiframe iubenda-embed hover:text-[#f5f0e8] transition-colors" title="Privacy Policy">Privacy Policy</a>
            <a href="https://www.iubenda.com/privacy-policy/53958448/cookie-policy" className="iubenda-white iubenda-noiframe iubenda-embed hover:text-[#f5f0e8] transition-colors" title="Cookie Policy">Cookie Policy</a>
            <a href="#" className="hover:text-[#f5f0e8] transition-colors">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
