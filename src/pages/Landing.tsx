import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Camera, MessageCircle, Fish, UserPlus, MapPin, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import heroImg from '@/assets/landing-hero.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const features = [
  {
    icon: Map,
    title: 'Discover spots',
    description: 'Find and review the best fishing spots in Italy',
  },
  {
    icon: Camera,
    title: 'Share your catches',
    description: 'Post photos and connect with other anglers',
  },
  {
    icon: MessageCircle,
    title: 'Connect with anglers',
    description: 'Message and follow fellow fly fishing enthusiasts',
  },
];

const steps = [
  { icon: UserPlus, label: 'Sign up', description: 'Create your free account in seconds' },
  { icon: MapPin, label: 'Find a spot', description: 'Explore the interactive map of Italian waters' },
  { icon: Share2, label: 'Share your catch', description: 'Post photos and connect with the community' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="Fly fisherman casting in a mountain river at sunset"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-[#242242]/60" />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Fish className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold font-serif text-white">Flywaters</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-white mb-4 font-serif leading-tight"
          >
            Find your perfect fishing spot
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-lg md:text-xl text-white/85 mb-10 max-w-xl mx-auto"
          >
            The Italian community for fly fishing enthusiasts — share spots, photos and reviews
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-[#242242] hover:bg-[#242242]/90 text-white px-8 py-6 text-base rounded-xl"
            >
              Join for free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/map')}
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-base rounded-xl"
            >
              Explore the map
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 bg-white/60 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            custom={0}
            className="text-3xl md:text-4xl font-bold text-center mb-4 font-serif text-foreground"
          >
            Everything you need
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            custom={1}
            className="text-muted-foreground text-center mb-14 max-w-md mx-auto"
          >
            From discovering spots to sharing your best catches
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                custom={i + 2}
              >
                <Card className="h-full border-border/50 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#4a7c59]/10 flex items-center justify-center mx-auto mb-5">
                      <f.icon className="w-7 h-7 text-[#4a7c59]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            custom={0}
            className="text-3xl md:text-4xl font-bold text-center mb-4 font-serif text-foreground"
          >
            How it works
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            custom={1}
            className="text-muted-foreground text-center mb-14 max-w-sm mx-auto"
          >
            Three simple steps to get started
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                custom={i + 2}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-full bg-[#242242] flex items-center justify-center">
                    <s.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#4a7c59] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">{s.label}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-4 bg-[#242242] text-white">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Ready to cast your line?</h2>
          <p className="text-white/70 mb-8">Join thousands of Italian anglers sharing their passion</p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-[#4a7c59] hover:bg-[#4a7c59]/90 text-white px-10 py-6 text-base rounded-xl"
          >
            Get started — it's free
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border bg-background">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-[#4a7c59]" />
            <span className="font-bold font-serif text-foreground">Flywaters</span>
            <span className="text-muted-foreground text-sm ml-2">Cast. Connect. Repeat.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">About</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
