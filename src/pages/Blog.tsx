import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { blogArticles } from '@/lib/blog-data';
import { Clock } from 'lucide-react';
import logoWhite from '@/assets/flywaters-logo-white.png';
import logoDark from '@/assets/flywaters-logo-dark.png';
import { useNavigate } from 'react-router-dom';

const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
      <SEOHead
        title="Blog — Pesca a Mosca in Italia | Flywaters"
        description="Guide, consigli e spot per la pesca a mosca in Italia. Il blog della community Flywaters."
        canonical="https://flywaters.app/blog"
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
            <Link to="/contatti" className="text-[#8c8c7a] hover:text-[#242242] transition-colors">Contatti</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="px-6 pt-16 pb-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-3">Il Blog</p>
          <h1 className="text-4xl md:text-5xl font-bold font-serif">
            Pesca a Mosca in Italia
          </h1>
        </div>
      </header>

      {/* Article Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {blogArticles.map((article) => (
            <Link
              key={article.slug}
              to={`/blog/${article.slug}`}
              className="group"
            >
              <div className="overflow-hidden rounded-xl mb-4">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: 'saturate(0.85)' }}
                  loading="lazy"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8c8c7a] mb-2">
                <Clock className="w-3 h-3" />
                <span>{article.readingTime} di lettura</span>
              </div>
              <h2 className="text-lg font-semibold font-serif group-hover:text-[#4a7c59] transition-colors leading-snug mb-2">
                {article.title}
              </h2>
              <p className="text-sm text-[#8c8c7a] leading-relaxed">
                {article.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#242242] text-[#f5f0e8]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoWhite} alt="Flywaters" className="h-6" />
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

export default Blog;
