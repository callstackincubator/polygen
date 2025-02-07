# @callstack/polygen-metro-config

## 0.2.0

### Minor Changes

- [#113](https://github.com/callstackincubator/polygen/pull/113) [`ef4322b`](https://github.com/callstackincubator/polygen/commit/ef4322b8030181b75154ad209153fb9c484587a1) Thanks [@robik](https://github.com/robik)! - - Added new JS based, type safe configuration file system

  - Added helper methods for defining configuration file
  - Added new `polygen scan` scan command that searches for any WebAssembly module changes
  - Added `pod install` reminder in `polygen generate` output
  - Added CLI proxy in `polygen` package pointing to `polygen-cli`
  - Changed `polygen generate` no longer generates code for all found modules (see `scan` command)
  - Changed `polygen init` command now generates new configuration file
  - Changed `polygen init` command now adds dependencies to your projects if desired
  - Fixed `polygen` commands now properly handle specific errors
  - Removed `--force-number-coercion` flag, it is enabled for all modules
  - Replaced `core-build` package with `polygen-config` package

- [#117](https://github.com/callstackincubator/polygen/pull/117) [`7d88263`](https://github.com/callstackincubator/polygen/commit/7d882631f11242109edae11cb3617096d46aec84) Thanks [@robik](https://github.com/robik)! - - Add support for importing external package modules
  - Remove TS dep from polygen package
  - Updated generated files header
  - Updated example app styling
  - Extracted `polygen-project` package

### Patch Changes

- Updated dependencies [[`7d88263`](https://github.com/callstackincubator/polygen/commit/7d882631f11242109edae11cb3617096d46aec84)]:
  - @callstack/polygen-project@0.2.0
