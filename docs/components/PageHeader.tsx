import { DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { twMerge as cn } from 'tailwind-merge';

export interface PageHeaderProps {
  title: string;
  icon?: string;
  description?: string;
}

export function PageHeader(props: PageHeaderProps) {
  const { title, description } = props;

  return (
    <div className={cn('flex flex-col gap-4')}>
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
    </div>
  );
}
