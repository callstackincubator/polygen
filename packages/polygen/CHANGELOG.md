# @callstack/polygen

## 0.2.0

### Minor Changes

- [#113](https://github.com/callstackincubator/polygen/pull/113) [`e4b1bf8`](https://github.com/callstackincubator/polygen/commit/e4b1bf886f988c23dc292b40be345eebf662bd01) Thanks [@robik](https://github.com/robik)! - - Added support for importing memories

  - Added basic support for importing tables
  - Added basic support for exporting tables
  - Added support for WASM multiple return values functions
  - Added basic support for handling of WebAssembly traps
  - Fixed various codegen issues
  - Fixed number coercion in JSI bridge
  - Fixed not attaching native state properly when wrapping native objects into WebAPI
  - Fixed WASM exported functions refer to wrong context in JSI bridge
  - Fixed invalid order of imported modules in codegen when creating module bridge
  - Removed `console.log` statements

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

- [#115](https://github.com/callstackincubator/polygen/pull/115) [`95522ee`](https://github.com/callstackincubator/polygen/commit/95522ee5ae3e9767cc62a1c1aec5cbf2f4e84935) Thanks [@robik](https://github.com/robik)! - - Disabled `bob` for `polygen` package

  - Fixed `yarn dev` not updating `polygen` package
  - Added more diagnostic messages when working with NativeState
  - Fixed Table Import example app
  - Added missing export of `WebAssembly.Table`
  - Fixed wrong type of `WebAssembly.Global` constructor descriptor

- [#117](https://github.com/callstackincubator/polygen/pull/117) [`7d88263`](https://github.com/callstackincubator/polygen/commit/7d882631f11242109edae11cb3617096d46aec84) Thanks [@robik](https://github.com/robik)! - - Add support for importing external package modules
  - Remove TS dep from polygen package
  - Updated generated files header
  - Updated example app styling
  - Extracted `polygen-project` package
