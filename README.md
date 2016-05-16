# Cloud9IDE as an application

This project wraps Cloud9IDE's [SDK](https://github.com/c9/core) in an [Electron](https://github.com/electron/electron) shell.

The project is only configured to build an `x86` OSX (`darwin`) binary.

## Installation

```bash
git clone https://github.com/ggoodman/c9-electron.git
cd c9-electron
npm install
```

An _unsigned_ binary will be built in `./build/Cloud9IDE-darwin-x64`.

## First use

Since the generated binary is not signed, you will need to locate the created binary in `Finder`, then **right click** `Cloud9IDE.app` and select `Open`. Confirm that you are willing to run this file.