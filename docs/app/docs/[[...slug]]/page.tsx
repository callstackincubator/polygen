import { PageHeader } from '@/components/PageHeader';
import { PrettyCard } from '@/components/PrettyCard';
import { source } from '@/lib/source';
import { createTypeTable } from 'fumadocs-typescript/ui';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { DocsBody, DocsPage } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

const { AutoTypeTable } = createTypeTable();

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  const MDX = page.data.body;
  const documentContent = (
    <MDX
      components={{
        ...defaultMdxComponents,
        Tab,
        Tabs,
        PrettyCard,
        AutoTypeTable,
      }}
    />
  );

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      lastUpdate={page.data.lastModified}
      tableOfContent={{
        style: 'clerk',
        single: false,
      }}
      editOnGithub={{
        repo: 'polygen',
        owner: 'callstackincubator',
        sha: 'master',
        path: 'docs',
      }}
      article={{
        className: 'max-sm:pb-16',
      }}
    >
      <PageHeader title={page.data.title} description={page.data.description} />
      <DocsBody>{documentContent}</DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
