export interface GlobalProjectOptions {
  project?: string;
  config?: string;
}

export interface GlobalOptions extends GlobalProjectOptions {
  verbose?: boolean;
}
