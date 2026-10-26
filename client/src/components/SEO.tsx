import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  canonical?: string;
}

const defaultTitle = "Cogestione Vian — Liceo Scientifico Statale Ignazio Vian";
const defaultDescription =
  "Piattaforma completa per la Cogestione del Liceo Scientifico Statale Ignazio Vian di Bracciano. Gli studenti propongono corsi, i rappresentanti li approvano, tutti prenotano i posti.";

export default function SEO({
  title,
  description = defaultDescription,
  ogImage,
  ogType = "website",
  canonical,
}: SEOProps) {
  const fullTitle = title ? `${title} — Cogestione Vian` : defaultTitle;
  const url = canonical || window.location.href;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#C9A227" />
    </Helmet>
  );
}
