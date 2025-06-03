<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<a href="https://www.callstack.com/open-source" align="center">
  <img src="https://github.com/user-attachments/assets/f7fdd8b3-6220-482c-b8d5-4c3b5ccd2b4b" alt="Polygen" />
</a>
<h3 align="center">WebAssembly Toolkit for React Native</h3>

<!-- SHIELDS -->
<p align="center">
<a href="https://github.com/callstackincubator/polygen/actions/workflows/ci.yml">
  <img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/callstackincubator/polygen/ci.yml?style=flat-square" />
</a>

<a href="https://www.npmjs.com/package/@callstack/polygen">
  <img alt="Version" src="https://img.shields.io/npm/v/@callstack/polygen?style=flat-square" />
</a>

<a href="https://github.com/callstackincubator/polygen/blob/master/LICENSE">
  <img alt="License" src="https://img.shields.io/github/license/callstackincubator/polygen?color=green&style=flat-square" />
</a>

<a href="https://github.com/callstackincubator/polygen/issues">
  <img alt="Issues" src="https://img.shields.io/github/issues/callstackincubator/polygen?color=green&style=flat-square" />
</a>

<a href="https://discord.gg/Q4yr2rTWYF">
  <img alt="Discord" src="https://img.shields.io/discord/426714625279524876.svg?style=flat-square&colorB=758ED3" />
</a>

<a href="https://callstack.com/open-source/">
  <img alt="Callstack Open Source" src="https://callstack.com/images/callstack-badge.svg" />
</a>
</p>

<p align="center">
  Polygen allows you to run WebAssembly Modules in your React Native apps, with near native speed.

  <br />
  <!--
  <a href="https://github.com/callstackincubator/polygen"><strong>Explore the docs »</strong></a>
  <br />
  <br />
  -->
  <a href="https://github.com/callstackincubator/polygen/issues/new?template=bug_report.yml">Report a Bug</a>
  &middot;
  <a href="https://github.com/callstackincubator/polygen/discussions/new?category=ideas">Request Feature</a>
</p>

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
- Only new RN Architecture is supported

## Prerequisites

Because Polygen Codegen depends on [`wasm2c`](https://github.com/WebAssembly/wabt) tool, you need to have it installed on your machine.
You can install it using your package manager:

 ```sh
 # macOS
 brew install wabt

 # linux
 sudo apt install wabt
 ```

<details>
<summary>Other installation options</summary>

If for some reason:

 - you cannot use the package manager method,
 - you are on Windows,
 - or the version there is outdated,

you can still install `wabt` in a few other ways:

**Option 1: Downloading prebuild binaries**

Download precompiled binaries from the [releases page](https://github.com/WebAssembly/wabt/releases) of `wabt` project.
Select correct version for your platform and extract it to the directory of your choice.

**Option 2: Building from source**

You can also build `wabt` from source. To do this, you need to have `cmake` and `git` installed on your machine.

```sh
$ git clone --recursive https://github.com/WebAssembly/wabt
$ cd wabt
$ git submodule update --init
$ cmake -B build -S .
$ cmake --build build
```

**Install binaries**

You need to make binaries visible to Polygen. You can do this by adding the directory with the binaries to your system environment:

```sh
# Using WABT_PATH variable:
$ export WABT_PATH=/path/to/wabt/binaries

# or adding to PATH:
$ export PATH="$PATH:/path/to/wabt/binaries"
```

> If you built WABT from source, the path should point to the `build` directory.

To make those changes persistent, add them to your `.bashrc`/`.zshrc`/`.profile` file.

</details>

## Installation

In your React Native project run:

```sh
npx @callstack/polygen init
# or
yarn dlx @callstack/polygen init
```

## Usage

In your application folder run:

```sh
## npm
npx polygen scan
# apply changes in config
npx polygen generate

## yarn
yarn polygen scan
# apply changes in config
yarn polygen generate
```

Run `polygen scan` to search for changes in found WebModules. All modules must be explictly listed in `polygen.config.[mc]js`
Run `polygen generate` after any of the WebAssembly module changed.

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

### Using Fetch

You can also pass WebAssembly module binary loaded using `fetch`, or any other method:

```js
await WebAssembly.compileStreaming(
  fetch('http://localhost:8000/example.wasm')
)
```

The downloaded module is not actually executed, but a native counterpart is searched based on the module checksum.

This does not require any additional setup, but it has the overhead of fetching the module on runtime, just for it to
be discarded.

For it to work, you need:

 - Place exactly the same WebAssembly Module in `src` directory of your application.
 - The module binary checksums must match

## Examples

See `apps` directory for usage examples.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.


## Made with ❤️ at Callstack

Polygen is an open source project and will always remain free to use. If you think it's cool, please star it 🌟. [Callstack](https://callstack.com) is a group of React and React Native geeks, contact us at [hello@callstack.com](mailto:hello@callstack.com) if you need any help with these or just want to say hi!

Like the project? ⚛️ [Join the team](https://callstack.com/careers/?utm_campaign=Senior_RN&utm_source=github&utm_medium=readme) who does amazing stuff for clients and drives React Native Open Source! 🔥
