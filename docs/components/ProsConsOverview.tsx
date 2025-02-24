import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { twMerge as cn } from 'tailwind-merge';

export type ProsConsOverviewProps = HTMLAttributes<HTMLElement> & {
  pros: string[];
  cons: string[];
};

export function ProsConsOverview(props: ProsConsOverviewProps) {
  const { pros, cons } = props;

  return (
    <div className={cn('flex flex-col gap-4')}>
      <div className={cn('flex flex-row gap-4 items-start')}>
        <ThumbsUp size={36} className={cn('text-green-400 my-4')} />
        <div className={cn('flex flex-col gap0')}>
          <strong>Pros</strong>
          <ul
            className={cn(
              'not-prose list-disc list-inside text-sm text-fd-muted-foreground'
            )}
          >
            {pros.map((pro) => (
              <li key={pro}>{pro}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cn('flex flex-row gap-4 items-start')}>
        <ThumbsDown size={36} className={cn('text-red-400 my-4')} />
        <div className={cn('flex flex-col gap0')}>
          <strong>Cons</strong>
          <ul
            className={cn(
              'not-prose list-disc list-inside text-sm text-fd-muted-foreground'
            )}
          >
            {cons.map((con) => (
              <li key={con}>{con}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
