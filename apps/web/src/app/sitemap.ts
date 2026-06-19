import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Served at /sitemap.xml. Only the public, indexable pages — app/room pages are
// private and intentionally excluded (and noindexed).
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${siteUrl}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/register`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/login`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
