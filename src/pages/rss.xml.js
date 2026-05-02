import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data, id }) => {
    return data.isDraft !== true && id.startsWith('en/');
  });

  posts.sort(
    (a, b) =>
      new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf()
  );

  return rss({
    title: 'Paulo Albuquerque — Notes on AI workflows',
    description:
      'Senior engineer based in Dublin. Notes on AI workflows, automation, and reducing friction in everyday work.',
    site: context.site,
    items: posts.map((post) => {
      const slug = post.id.replace(/^en\//, '').replace(/\.(md|mdx)$/, '');
      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description ?? post.data.metaDescription ?? '',
        link: `/blog/${slug}/`,
        categories: post.data.tags ?? [],
      };
    }),
  });
}
