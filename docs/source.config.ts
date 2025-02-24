import { remarkMermaid } from '@theguild/remark-mermaid';
import { remarkAdmonition } from 'fumadocs-core/mdx-plugins';
import { remarkInstall } from 'fumadocs-docgen';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    remarkPlugins: [
      remarkAdmonition,
      [remarkInstall, { persist: { id: 'package-manager' } }],
      remarkMermaid,
    ],
    // MDX options
  },
});
