import Link from 'fumadocs-core/link';
import type { HTMLAttributes } from 'react';
import { twMerge as cn } from 'tailwind-merge';

export type PrettyCardProps = HTMLAttributes<HTMLElement> & {
  title: string;
  description: string;
  icon: string;
  image: string;
  href: string;
};

export function PrettyCard(props: PrettyCardProps) {
  const { icon, image, title, description, children, ...extraProps } = props;
  const El = props.href ? Link : 'div';

  if (image && icon) {
    console.error('Either image or icon should be provided, not both');
  }

  return (
    <El
      {...extraProps}
      data-card
      className={cn(
        'flex flex-row items-center rounded-lg border p-4 bg-fd-cardshadow-md transition-colors',
        props.href && 'hover:bg-fd-accent/80',
        props.className
      )}
    >
      {icon ? (
        <div className="not-prose w-fit bg-fd-muted p-1.5 text-fd-muted-foreground [&_svg]:size-8">
          {icon}
        </div>
      ) : null}
      {image ? (
        <img
          src={`${process.env.DOCS_BASE_PATH ?? ''}/${image}`}
          alt="image"
          width={36}
          className={cn('not-prose my-2')}
        />
      ) : null}

      <div className={cn('flex flex-col px-4 text-fd-card-foreground ')}>
        <h3 className="not-prose text-md font-medium">{title}</h3>
        {description ? (
          <p className="not-prose text-md leading-6 text-fd-muted-foreground">
            {description}
          </p>
        ) : null}
        {children ? (
          <div className="text-md text-fd-muted-foreground prose-no-margin">
            {children}
          </div>
        ) : null}
      </div>
    </El>
  );
}
