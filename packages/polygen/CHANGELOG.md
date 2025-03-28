# @callstack/polygen

## 0.2.1

### Patch Changes

- Fixed init command when running using npx [28f5c55]
  - @callstack/polygen-cli@0.2.1

## 0.2.0

### Minor Changes

- Added support for importing memories [e4b1bf8]
- Added basic support for importing tables [e4b1bf8]
- Added basic support for exporting tables [e4b1bf8]
- Added support for WASM multiple return values functions [e4b1bf8]
- Added basic support for handling of WebAssembly traps [e4b1bf8]
- Fixed various codegen issues [e4b1bf8]
- Fixed number coercion in JSI bridge [e4b1bf8]
- Fixed not attaching native state properly when wrapping native objects into WebAPI [e4b1bf8]
- Fixed WASM exported functions refer to wrong context in JSI bridge [e4b1bf8]
- Fixed invalid order of imported modules in codegen when creating module bridge [e4b1bf8]
- Removed `console.log` statements [e4b1bf8]
- Added new JS based, type safe configuration file system [ef4322b]
- Added helper methods for defining configuration file [ef4322b]
- Added new `polygen scan` scan command that searches for any WebAssembly module changes [ef4322b]
- Added `pod install` reminder in `polygen generate` output [ef4322b]
- Added CLI proxy in `polygen` package pointing to `polygen-cli` [ef4322b]
- Changed `polygen generate` no longer generates code for all found modules (see `scan` command) [ef4322b]
- Changed `polygen init` command now generates new configuration file [ef4322b]
- Changed `polygen init` command now adds dependencies to your projects if desired [ef4322b]
- Fixed `polygen` commands now properly handle specific errors [ef4322b]
- Removed `--force-number-coercion` flag, it is enabled for all modules [ef4322b]
- Replaced `core-build` package with `polygen-config` package [ef4322b]
- Disabled `bob` for `polygen` package [95522ee]
- Fixed `yarn dev` not updating `polygen` package [95522ee]
- Added more diagnostic messages when working with NativeState [95522ee]
- Fixed Table Import example app [95522ee]
- Added missing export of `WebAssembly.Table` [95522ee]
- Fixed wrong type of `WebAssembly.Global` constructor descriptor [95522ee]
- Add support for importing external package modules [7d88263]
- Remove TS dep from polygen package [7d88263]
- Updated generated files header [7d88263]
- Updated example app styling [7d88263]
- Extracted `polygen-project` package [7d88263]
