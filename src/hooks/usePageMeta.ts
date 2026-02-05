import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description: string;
}

const DEFAULT_TITLE = 'Mapprr - Create Beautiful Visual Site Maps';
const TITLE_SUFFIX = ' | Mapprr';

export const usePageMeta = ({ title, description }: PageMetaOptions) => {
  useEffect(() => {
    // Set document title
    const fullTitle = title === DEFAULT_TITLE ? title : `${title}${TITLE_SUFFIX}`;
    document.title = fullTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update OG title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', fullTitle);

    // Update OG description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', description);

    // Cleanup - restore defaults on unmount
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description]);
};
