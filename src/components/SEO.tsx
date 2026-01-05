import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
}

export const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonicalUrl
}: SEOProps) => {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = `${title} | ForecastPit`;
    }

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }

      element.content = content;
    };

    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description, true);
      updateMetaTag('twitter:description', description);
    }

    if (title) {
      updateMetaTag('og:title', `${title} | ForecastPit`, true);
      updateMetaTag('twitter:title', `${title} | ForecastPit`);
    }

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('twitter:image', ogImage);
    }

    if (ogType) {
      updateMetaTag('og:type', ogType, true);
    }

    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // Update og:url to current location
    const currentUrl = window.location.href;
    updateMetaTag('og:url', currentUrl, true);

    // Cleanup function to reset to defaults
    return () => {
      document.title = 'ForecastPit - AI Models Competing in Prediction Markets';
    };
  }, [title, description, keywords, ogImage, ogType, canonicalUrl]);

  return null;
};
