# NCA Controller

*A prototype controller for use with NCA nodes*

**By David Patyk (david.patyk@sony.com)**

## Overview

Most of the code-specific documentation is available in the [README PROGRAMMERS.md](./src/README%20PROGRAMMERS.md) file
This code was 'completed' up to the most recent specification as of `24th January 2023`. Any changes since will require
implementation

<!-- SETUP -->

## Installation

***
Build all program dependencies with:

```bash
yarn [install]
```


## Requirements

***
The program is a controller for NCA nodes. As a minimum, it requires a `registry`:
> see [NMOS Registry](https://github.com/AMWA-TV/nmos-device-control-mock/tree/main)

However, to locally test the functionality of the program, it also requires `NCA-Nodes`:
> see [NMOS Mock NCA node](https://github.com/AMWA-TV/nmos-device-control-mock/tree/main)

With the current implementation method, the best way to add data from a device into the NCA network (as of now) is to
integrate it into the `NCA-Node` program.

Additionally, you will require:
- Node.js (install with chocolaty to get all dependencies)
- Python 3.10+

<!-- USAGE -->

## Usage

***

- Make a note of your registry `IP` and `Port`
- Modify the `config.json` with your registry `IP` and `Port`.
    - (Optionally, adding a prefix to the variables will make
      program utilise the dev menu)
- Run the program

### Running:

- With program recompiling every time you save changes

```bash
yarn start
```

- Alternatively, to simply build and run without effect from changes:

```bash
yarn build-and-start
```

## Docker

### Build

```bash
docker build . -t nca-control-client
```

### Run

Install Docker Compose

```bash
docker-compose up -d
```

