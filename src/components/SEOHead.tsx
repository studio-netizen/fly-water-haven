import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

const SEOHead = ({
  title = 'Flywaters — La community italiana per la pesca a mosca',
  description = 'Scopri i migliori spot di pesca in Italia, condividi le tue catture e connettiti con altri pescatori a mosca.',
  canonical,
  ogImage = 'https://flywaters.app/og-image.jpg',
  ogType = 'website',
}: SEOHeadProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {canonical && <link rel="canonical" href={canonical} />}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:type" content={ogType} />
    {canonical && <meta property="og:url" content={canonical} />}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
  </Helmet>
);

export default SEOHead;
