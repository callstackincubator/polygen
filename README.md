# Polygen

Polygen is a library for React Native that allows you to run WebAssembly modules in your apps, statically, without interpreting.

## Getting started

> [!WARNING]
> This library is still under active development. Feel free to hack around, but use at your own risk.

## How it works?

Instead of interpreting the WebAssembly modules, or doing Just-in-Time compilation, Polygen instead leverages the Ahead-of-Time compilation.
This solution can be used in iOS applications and other Apple devices, where JIT compilation is not allowed,
without impacting performance.

It uses the wonderful [`wasm2c`](https://github.com/WebAssembly/wabt/tree/main/wasm2c) tool to generate C code from every `WebAssembly` module.
Then, additional React Native/JSI glue native code is generated that allows to call the generated C code from JavaScript.

This gives us the ability to run WebAssembly modules in a statically compiled way, without the need for JIT compilation.

## Features

| Feature              | Status   |
|----------------------|----------|
| WebAssembly 2.0      | 🟩       |
| - Exceptions         | 🟥       |
| - Threads            | 🟥       |
| - Garbage Collection | 🟥       |
| - Multiple Memories  | 🟨       |
| - Mutable Globals    | 🟨       |
| WebAPI               | 🟨       |
| - Fetch              | 🟩       |
| Native               | 🟨       |
| - Metro              | 🟨       |
| - Re.Pack            | 🟥       |


## Requirements

- React Native 0.75+

## Prerequisites

Because Polygen Codegen depends on [`wasm2c`](https://github.com/WebAssembly/wabt) tool, you need to have it installed on your machine.
You can install it by either:

1. Downloading precompiled binaries from the [releases page](https://github.com/WebAssembly/wabt/releases) of wabt project.
2. Building it from the source:

   ```sh
   $ git clone --recursive https://github.com/WebAssembly/wabt
   $ cd wabt
   $ git submodule update --init
   $ cmake -B build -S .
   $ cmake --build build
   ```

Then, you need to make binaries visible to polygen tool. You can do this in two ways:

- Set the `WABT_PATH` environment variable to the directory with binaries (`wabt/build` if you built it from source):

  ```sh
  # assumes build from source path
  $ export WABT_PATH=$(pwd)/build
  ```

- Append the `PATH` environment variable to the directory with binaries (`wabt/build` if you built it from source):

  ```sh
  # assumes build from source path
  $ export PATH="$PATH:$(pwd)/build"
  ```

## Installation

```sh
npm i -g @callstack/polygen
```

## Usage

In your application folder run:

```sh
polygen init
polygen update
```

Run `polygen update` after any of the WebAssembly module changed.

To use WebAssembly API, import `@callstack/polygen/polyfill` in your application (before any other imports):

```js
import '@callstack/polygen/polyfill';
```

### Metro

Polygen has a Metro plugin that allows you to import WebAssembly modules in your application.

> [!WARNING]
> Currently, only modules from the current package are supported. This will be implemented in the next version.

Add `@callstack/polygen-metro-config` dependency to your project:

```sh
yarn add -D @callstack/polygen-metro-config
```

Then, in your `metro.config.js` file, add the following:

```js
const { withPolygenConfig } = require('@callstack/polygen-metro-config');
```

And wrap your Metro configuration with `withPolygenConfig` call:

```js
const config = {
  // ...
};

module.exports = withPolygenConfig(
  mergeConfig(getDefaultConfig(__dirname), config)
);
```

Then, you should be able to import module buffers in your application:

```js
import example from '../table_test.wasm';

const instance = new WebAssembly.Instance(new WebAssembly.Module(example));
```

## Examples

See `apps` directory for usage examples.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.


## Made with ❤️ at Callstack

Polygen is an open source project and will always remain free to use. If you think it's cool, please star it 🌟. [Callstack](https://callstack.com) is a group of React and React Native geeks, contact us at [hello@callstack.com](mailto:hello@callstack.com) if you need any help with these or just want to say hi!

Like the project? ⚛️ [Join the team](https://callstack.com/careers/?utm_campaign=Senior_RN&utm_source=github&utm_medium=readme) who does amazing stuff for clients and drives React Native Open Source! 🔥
