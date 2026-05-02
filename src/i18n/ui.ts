export const languages: Record<'en', { name: string; flag: string }> = {
  en: { name: 'English', flag: 'us' },
} as const;

export const defaultLanguage = 'en';

export type LanguageCode = keyof typeof languages;

export const ui = {
  en: {
    site: {
      title: 'Paulo Albuquerque — Notes on AI workflows',
      name: 'Paulo Albuquerque',
      description:
        'Senior engineer based in Dublin. Notes on AI workflows, automation, and reducing friction in everyday work.',
    },
    nav: {
      home: 'Home',
      blog: 'Blog',
      about: 'About',
    },
    footer: {
      rights: 'All rights reserved.',
      copyright: '© 2026 Paulo Albuquerque',
    },
    homePage: {
      pageTitle: 'Paulo Albuquerque — Notes on AI workflows',
      pageDescription:
        'Senior engineer based in Dublin. Notes on AI workflows, automation, and reducing friction in everyday work.',
      heroGreeting: "Hi, I'm Paulo",
      heroTagline:
        "Senior engineer based in Dublin. I write about AI workflows, automation, and how small businesses can reduce friction in everyday work. Notes from what I'm exploring end up below.",
      recentPostsTitle: 'Recent posts',
      readMore: 'Read post',
      seeAllPosts: 'See all posts',
    },
    blogPage: {
      pageTitle: 'Blog',
      pageDescription:
        "Notes on AI workflows, automation, and what I'm exploring.",
      title: 'Posts',
      description:
        "Notes on AI workflows, automation, and what I'm exploring.",
      comingSoon: 'No posts yet.',
      heroImageAlt: 'Hero image for article: ',
      publishedOn: 'Published on: ',
      readMore: 'Read post',
      readingTimeSuffix: 'min read',
      searchPlaceholder: 'Search posts...',
      filterByTagButtonLabel: 'Filter by tag',
      noTagFound: 'No tag found.',
      selectTagCommandPlaceholder: 'Search tag...',
      allTagsLabel: 'All tags',
      noPostsFound: 'No posts found.',
    },
    blogPost: {
      publishedOn: 'Published on: ',
      updatedOn: 'Updated on: ',
      heroImageAlt: 'Hero image for article: ',
      backToList: 'Back to blog',
      readingTimeSuffix: 'min read',
      relatedPostsTitle: 'Continue reading',
      readMore: 'Read post',
    },
    toc: {
      title: 'Table of Contents',
    },
    notFoundPage: {
      pageTitle: 'Page Not Found',
      title: 'Page not found',
      message: "Sorry, that page doesn't exist.",
      homeLink: 'Back to home',
    },
    zodErrors: {
      invalid_type: 'Invalid type.',
      invalid_type_received_undefined: 'This field is required.',
      required_field_custom: 'The {fieldName} field is required.',
      too_small_string_minimum: 'Must be at least {minimum} characters long.',
      too_big_string_maximum: 'Must be no more than {maximum} characters long.',
      invalid_string_email: 'Invalid email address.',
      invalid_string_url: 'Invalid URL.',
      invalid_string_uuid: 'Invalid UUID.',
    },
  },
} as const;

export const getLanguageName = (lang: LanguageCode) => languages[lang];

export type UISchema = typeof ui;
export type FeatureType = keyof UISchema[typeof defaultLanguage];

export function useTranslations<F extends FeatureType>(
  lang: LanguageCode | undefined,
  feature: F
) {
  const currentLanguage = lang || defaultLanguage;
  type AvailableKeys = keyof UISchema[typeof defaultLanguage][F];
  return function t(key: AvailableKeys): string {
    const featureTranslations = ui[currentLanguage]?.[feature];
    if (featureTranslations && key in featureTranslations) {
      return featureTranslations[
        key as keyof typeof featureTranslations
      ] as string;
    }
    return ui[defaultLanguage][feature][
      key as keyof (typeof ui)[typeof defaultLanguage][F]
    ] as string;
  };
}
