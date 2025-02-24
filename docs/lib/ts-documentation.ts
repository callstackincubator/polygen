import { getProject } from 'fumadocs-typescript';
import * as prettier from 'prettier';
import {
  type ExportedDeclarations,
  FunctionDeclaration,
  type Project,
  ts,
} from 'ts-morph';

export interface JSDocTagText {
  kind: 'parameterName' | 'text' | 'space';
  text: string;
}

export interface JSDocTag {
  name: 'param' | 'see' | 'returns' | 'example' | 'deprecated';
  text: JSDocTagText[];
}

export interface SymbolDocumentation {
  kind: string;
  name: string;
  signature: string;
  description: string;
  jsdocTags: JSDocTag[];
}

export interface FunctionSymbolDocumentation extends SymbolDocumentation {
  kind: 'FunctionDeclaration';
  parameterTypes: string[];
}

export async function generateDocumentation(
  file: string,
  name: string,
  content: string
): Promise<SymbolDocumentation | undefined> {
  const project = getProject();
  const sourceFile = project.createSourceFile(file, content, {
    overwrite: true,
  });

  const exports = sourceFile.getExportedDeclarations();
  const target = exports.get(name)?.[0];
  if (!target) {
    return undefined;
  }

  return generateDeclarationDoc(project, target);
}

async function generateDeclarationDoc(
  program: Project,
  target: ExportedDeclarations
): Promise<SymbolDocumentation | undefined> {
  if (target instanceof FunctionDeclaration) {
    target.removeBody();
  }
  const extra = {};
  const symbol = target.getSymbol();
  if (!symbol) {
    return undefined;
  }

  const comment = symbol.compilerSymbol.getDocumentationComment(
    program.getTypeChecker().compilerObject
  );

  const jsdocTags = symbol.getJsDocTags().map((tag) => ({
    name: tag.getName(),
    text: tag.getText(),
  })) as JSDocTag[];

  if (target instanceof FunctionDeclaration) {
    const extraFunc = extra as FunctionSymbolDocumentation;
    extraFunc.parameterTypes = target
      .getParameters()
      .map((param) => param.getType().getText(target, ts.TypeFormatFlags.None));
  }

  const signature = (
    await prettier.format(target.print({ removeComments: true }), {
      parser: 'typescript',
      printWidth: 60,
    })
  ).trimEnd();

  return {
    kind: target.getKindName(),
    name: symbol.getName(),
    description: comment ? ts.displayPartsToString(comment) : '',
    signature,
    jsdocTags,
    ...extra,
  };
}
