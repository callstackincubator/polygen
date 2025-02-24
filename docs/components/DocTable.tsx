import fs from 'node:fs/promises';
import {
  FunctionSymbolDocumentation,
  generateDocumentation,
} from '@/lib/ts-documentation';
import { cva } from 'class-variance-authority';
import { PrerenderScript, useShiki } from 'fumadocs-core/utils/use-shiki';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Heading } from 'fumadocs-ui/components/heading';
import { type Jsx, toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useId } from 'react';
import * as runtime from 'react/jsx-runtime';
import { codeToHast } from 'shiki';
import { twMerge as cn } from 'tailwind-merge';

export interface DocTableProps {
  path: string;
  name: string;
}

const field = cva('inline-flex flex-row items-center gap-1');
const code = cva(
  'rounded-md bg-fd-secondary p-1 text-fd-secondary-foreground',
  {
    variants: {
      color: { primary: 'bg-fd-primary/10 text-fd-primary' },
    },
  }
);

async function FuncDocTable(props: { func: FunctionSymbolDocumentation }) {
  const { func } = props;

  const scriptKey = useId();
  const params = func.jsdocTags
    .filter((tag) => tag.name === 'param')
    .map((tag) => tag.text)
    .map((text) => ({
      name: text[0].text,
      description: text
        .slice(2)
        .map((t) => t.text)
        .join(' '),
    }));

  return (
    <>
      <Heading as="h3">
        Function <code>{func.name}</code>
      </Heading>
      <p>{func.description}</p>

      <h4>Signature</h4>
      <DynamicCodeBlock lang="ts" code={func.signature} options={{}} />

      {/*<h4>Description</h4>*/}

      <h4>Parameters</h4>
      <table className="whitespace-nowrap text-sm text-fd-muted-foreground">
        <thead>
          <tr>
            <th className="w-[20%]">Name</th>
            <th className="w-[30%]">Type</th>
            <th className="w-[40%]">Description</th>
            <th className="w-1/4">Default</th>
          </tr>
        </thead>
        <tbody>
          {params.map(({ name, description }, i) => (
            <tr key={name}>
              <td>
                <div className={field()}>
                  <code className={cn(code({ color: 'primary' }))}>{name}</code>
                </div>
              </td>
              <td>
                <div className={field()}>
                  {func.parameterTypes[i]}
                  {/*<PrerenderScript scriptKey={scriptKey} code={func.parameterTypes[i]}/>*/}
                  {/*{codeToHtml(func.parameterTypes[i], { lang: 'ts', theme: 'default' })}*/}
                </div>
              </td>
              <td>
                <div className={field()}>{description}</div>
              </td>
              <td>
                {/*{value.default ? (
                <code className={code()}>{value.default}</code>
              ) : (
                <span>-</span>
              )}*/}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <pre>{JSON.stringify(func.jsdocTags, undefined, 2)}</pre>
    </>
  );
}

export async function DocTable(props: DocTableProps) {
  const { path, name } = props;
  const content = (await fs.readFile(path)).toString();

  const output = await generateDocumentation(path ?? 'temp.ts', name, content);

  if (!output) {
    throw new Error(`Could not generate documentation for ${name} in ${path}`);
  }

  if (output.kind === 'FunctionDeclaration') {
    return <FuncDocTable func={output as FunctionSymbolDocumentation} />;
  } else {
    throw new Error(`Unsupported kind: ${output.kind}`);
  }
}
