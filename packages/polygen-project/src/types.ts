import type {
  PolygenExternalModuleConfig,
  PolygenLocalModuleConfig,
  PolygenModuleConfig,
} from '@callstack/polygen-config';

export interface ModuleResolutionInfo {
  resolvedPath: string;
}

export type ResolvedLocalModule = PolygenLocalModuleConfig &
  ModuleResolutionInfo;
export type ResolvedExternalModule = PolygenExternalModuleConfig &
  ModuleResolutionInfo;
export type ResolvedModule = ResolvedLocalModule | ResolvedExternalModule;
