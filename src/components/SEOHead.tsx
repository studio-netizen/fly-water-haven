import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
}

const SEOHead = ({
  title = 'Flywaters — La community italiana per la pesca a mosca',
  description = 'Scopri i migliori spot di pesca in Italia, condividi le tue catture e connettiti con altri pescatori a mosca.',
  canonical,
}: SEOHeadProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {canonical && <link rel="canonical" href={canonical} />}
  </Helmet>
);

export default SEOHead;
