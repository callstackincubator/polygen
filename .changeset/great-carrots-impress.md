---
"@callstack/polygen-config": minor
"@callstack/polygen-metro-config": minor
"@callstack/polygen-cli": minor
"@callstack/polygen-codegen": minor
"@callstack/polygen": minor
---

- Added new JS based, type safe configuration file system
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
