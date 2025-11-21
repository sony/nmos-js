# IS-12 Device Model Browser

*A prototype controller for use with IS-12 capable NMOS Nodes*

## Overview

The program is a controller for IS-12 capable NMOS Nodes such as the [NMOS Device Control Mock](https://github.com/AMWA-TV/nmos-device-control-mock).

<!-- SETUP -->

## Installation

```bash
yarn [install]
```

## Requirements

***
- Node.js (install with chocolaty to get all dependencies)
- Python 3.10+

<!-- USAGE -->

## Usage

***
- On launch there is an edit box where the URL of the control protocol endpoint can be set. 
- For example, `ws://127.0.0.1:7002/x-nmos/ncp/v1.0`
- Click the `CONNECT` button to connect to the control protocol endpoint.

### Running:

- With program recompiling every time you save changes

```bash
yarn start
```

- Alternatively, to simply build and run without effect from changes:

```bash
yarn build-and-start
```

