import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
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
  { label: 'DISCOVER', text: 'Find hidden spots across Italy' },
  { label: 'SHARE', text: 'Post your catches and gear' },
  { label: 'CONNECT', text: 'Message fellow anglers' },
];

const spots = [
  { img: spotLake, region: 'TRENTINO-ALTO ADIGE', name: 'Lago di Tovel' },
  { img: spotRiver, region: 'FRIULI VENEZIA GIULIA', name: 'Torrente Natisone' },
  { img: spotStream, region: 'LOMBARDIA', name: 'Torrente Mella' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>

      {/* ─── HERO ─── */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="Fly fisherman wading in a mountain river"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-[#242242]/50" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-xs tracking-[0.35em] uppercase text-white/70 mb-8"
          >
            Flywaters — Community
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight font-serif"
          >
            Every river tells<br />a story. Find yours.
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
              Explore spots
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
              alt="Angler wading through a mountain stream in autumn"
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
            <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-4">Our mission</p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-6">
              Built for fly fishers,<br />by fly fishers
            </h2>
            <p className="text-base leading-relaxed text-[#8c8c7a] mb-8">
              We believe the best fishing stories start with the right spot.
              Flywaters is a community where Italian anglers share their knowledge,
              document their catches, and protect the waters they love.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-medium tracking-wide text-[#242242] hover:text-[#4a7c59] transition-colors inline-flex items-center gap-2 group"
            >
              Join the community
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
            Featured
          </motion.p>
          <motion.h2
            variants={slow(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold font-serif mb-14"
          >
            Spots worth the drive
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
          <p className="text-sm font-serif font-semibold tracking-wide">Flywaters</p>
          <p className="text-xs tracking-[0.2em] uppercase text-[#f5f0e8]/50">
            Cast. Connect. Repeat.
          </p>
          <div className="flex gap-8 text-xs tracking-wide text-[#f5f0e8]/60">
            <a href="#" className="hover:text-[#f5f0e8] transition-colors">About</a>
            <a href="#" className="hover:text-[#f5f0e8] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#f5f0e8] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
