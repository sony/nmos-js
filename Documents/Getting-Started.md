# Getting Started

The following instructions describe how to build and deploy this software.

## Preparation

Set up the [external dependencies](Dependencies.md#preparation) before proceeding.

Once packages are installed, run `yarn start` to launch the client on a development server at http://localhost:3000.

To build for release, simply run `yarn build`. The output will be written to a build directory. Instructions on how to serve the build will be provided at this point.

ESLint and Prettier can be run using `yarn lint`. If you wish to list the warnings without writing changes `yarn lint-check` can be used instead.
