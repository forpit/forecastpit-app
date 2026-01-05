// Google Analytics utility functions

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

// Track page view
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-PGXPGXGTSB', {
      page_path: url,
    });
  }
};

// Track custom event
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Track clicks on external links
export const trackExternalLink = (url: string, label?: string) => {
  trackEvent('external_link_click', {
    url: url,
    label: label || url,
  });
};

// Track game views
export const trackGameView = (gameName: string, gameSlug: string) => {
  trackEvent('view_game', {
    game_name: gameName,
    game_slug: gameSlug,
  });
};

// Track news article views
export const trackNewsView = (articleTitle: string, articleId: string) => {
  trackEvent('view_news_article', {
    article_title: articleTitle,
    article_id: articleId,
  });
};

// Track genre filter usage
export const trackGenreFilter = (genre: string) => {
  trackEvent('filter_by_genre', {
    genre: genre,
  });
};

// Track search
export const trackSearch = (searchTerm: string) => {
  trackEvent('search', {
    search_term: searchTerm,
  });
};
