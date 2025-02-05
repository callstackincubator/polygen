---
"@callstack/polygen-codegen": minor
"@callstack/polygen": minor
"@callstack/polygen-cli": minor
---

- Added support for importing memories
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
