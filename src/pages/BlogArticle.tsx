import { useParams, Link, Navigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { blogArticles } from '@/lib/blog-data';
import { Clock, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import logoDark from '@/assets/flywaters-logo-dark.png';
import logoWhite from '@/assets/flywaters-logo-white.png';

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const article = blogArticles.find((a) => a.slug === slug);
  if (!article) return <Navigate to="/blog" replace />;

  const related = blogArticles.filter((a) => a.slug !== slug);

  const shareUrl = `https://flywaters.app/blog/${article.slug}`;
  const shareText = article.title;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
      <SEOHead
        title={article.titleTag}
        description={article.metaDescription}
        canonical={shareUrl}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 px-6 py-5 bg-[#f5f0e8]/95 backdrop-blur-sm border-b border-[#242242]/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoDark} alt="Flywaters — La community italiana per la pesca a mosca" className="h-5" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/blog" className="font-medium text-[#242242]">Blog</Link>
            <Link to="/map" className="text-[#8c8c7a] hover:text-[#242242] transition-colors">Mappa</Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="px-6 pt-8">
        <div className="max-w-[780px] mx-auto text-xs text-[#8c8c7a] flex items-center gap-2">
          <Link to="/" className="hover:text-[#242242] transition-colors">Home</Link>
          <span>›</span>
          <Link to="/blog" className="hover:text-[#242242] transition-colors">Blog</Link>
          <span>›</span>
          <span className="text-[#242242]/60 truncate max-w-[200px]">{article.title}</span>
        </div>
      </div>

      {/* Hero image */}
      <div className="px-6 pt-6">
        <div className="max-w-[780px] mx-auto">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full aspect-[16/9] object-cover"
            style={{ filter: 'saturate(0.8) contrast(1.05)' }}
          />
        </div>
      </div>

      {/* Article */}
      <article className="px-6 pt-10 pb-20">
        <div className="max-w-[780px] mx-auto">
          {/* Meta */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-9 h-9 rounded-full bg-[#242242] flex items-center justify-center overflow-hidden">
              <img src={logoDark} alt="Team Flywaters" className="h-4 invert" />
            </div>
            <div>
              <p className="text-sm font-medium">Team Flywaters</p>
              <div className="flex items-center gap-2 text-xs text-[#8c8c7a]">
                <Clock className="w-3 h-3" />
                <span>{article.readingTime} di lettura</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-10">
            {article.h1}
          </h1>

          {/* Sections */}
          <div className="space-y-10" style={{ fontSize: '18px', lineHeight: '1.8' }}>
            {article.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-xl md:text-2xl font-bold font-serif mb-4">{section.heading}</h2>
                <p className="text-[#242242]/80">{section.body}</p>
              </div>
            ))}
          </div>

          {/* Share buttons */}
          <div className="mt-14 pt-8 border-t border-[#242242]/10">
            <p className="text-sm font-medium mb-4">Condividi questo articolo</p>
            <div className="flex items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium tracking-wide bg-[#25D366] text-white hover:opacity-90 transition-opacity"
              >
                WhatsApp
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium tracking-wide bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
              >
                Facebook
              </a>
              <button
                onClick={copyLink}
                className="px-4 py-2 text-xs font-medium tracking-wide border border-[#242242]/20 text-[#242242] hover:bg-[#242242]/5 transition-colors inline-flex items-center gap-2"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiato!' : 'Copia link'}
              </button>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-14 bg-[#242242] text-[#f5f0e8] p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold font-serif mb-3">Scopri gli spot su Flywaters</h3>
            <p className="text-sm text-[#f5f0e8]/70 mb-6">Esplora la mappa, condividi le tue catture e connettiti con la community.</p>
            <Link
              to="/auth"
              className="inline-block px-8 py-3 text-sm tracking-widest uppercase font-medium border border-[#f5f0e8]/60 text-[#f5f0e8] hover:bg-[#f5f0e8]/10 transition-colors"
            >
              Registrati gratis
            </Link>
          </div>

          {/* Related articles */}
          <div className="mt-16">
            <h3 className="text-xl font-bold font-serif mb-8">Articoli correlati</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                  <div className="overflow-hidden mb-3">
                    <img
                      src={r.coverImage}
                      alt={r.title}
                      className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ filter: 'saturate(0.8) contrast(1.05)' }}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8c8c7a] mb-1">
                    <Clock className="w-3 h-3" />
                    <span>{r.readingTime}</span>
                  </div>
                  <h4 className="text-base font-semibold font-serif group-hover:text-[#4a7c59] transition-colors leading-snug">
                    {r.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-[#242242] text-[#f5f0e8]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoWhite} alt="Flywaters — La community italiana per la pesca a mosca" className="h-6" />
          <div className="flex gap-8 text-xs tracking-wide text-[#f5f0e8]/60">
            <Link to="/blog" className="hover:text-[#f5f0e8] transition-colors">Blog</Link>
            <Link to="/contatti" className="hover:text-[#f5f0e8] transition-colors">Contatti</Link>
            <a href="https://www.iubenda.com/privacy-policy/53958448" className="hover:text-[#f5f0e8] transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogArticle;
