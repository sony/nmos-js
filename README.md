# An NMOS Client in JavaScript [![Build Status](https://github.com/sony/nmos-js/workflows/build-test/badge.svg)][build-test]
[build-test]: https://github.com/sony/nmos-js/actions?query=workflow%3Abuild-test

## Introduction

This repository contains a client implementation of the [AMWA Networked Media Open Specifications](https://github.com/AMWA-TV/nmos) in JavaScript, [licensed](LICENSE) under the terms of the Apache License 2.0.

- [AMWA IS-04 NMOS Discovery and Registration Specification](https://amwa-tv.github.io/nmos-discovery-registration)
- [AMWA IS-05 NMOS Device Connection Management Specification](https://amwa-tv.github.io/nmos-device-connection-management)

For more information about AMWA, NMOS and the Networked Media Incubator, please refer to http://amwa.tv/.

The [repository structure](Documents/Repository-Structure.md), and the [external dependencies](Documents/Dependencies.md), are outlined in the documentation.

### Getting Started With NMOS

The [Easy-NMOS](https://github.com/rhastie/easy-nmos) starter kit allows the user to launch a simple NMOS setup with minimal installation steps.
It relies on nmos-js to provide an NMOS Client that works with an NMOS Registry and a virtual NMOS Node in a Docker Compose network, along with the AMWA NMOS Testing Tool and supporting services.

### Getting Started For Developers

Easy-NMOS is also a great first way to explore the relationship between NMOS services.

The nmos-js codebase is intended to work with any NMOS Registry, but can take advantage of the features of the [nmos-cpp](https://github.com/sony/nmos-cpp) implementation.

After setting up the dependencies, follow these [instructions](Documents/Getting-Started.md) to build and deploy the nmos-js client itself.

The web application can also be packaged and deployed with the [nmos-cpp-registry application](https://github.com/sony/nmos-cpp).
Copy the contents of the nmos-js build directory into the admin directory next to the nmos-cpp-registry executable.

## Agile Development

[<img alt="JT-NM Tested 03/20 NMOS & TR-1001-1 Controller" src="Documents/images/jt-nm-tested-03-20-controller.png?raw=true" height="135" align="right"/>](https://jt-nm.org/jt-nm_tested/)

The nmos-js client, like the NMOS Specifications, is intended to be always ready, but steadily developing.
The nmos-js client works as both an NMOS Registry browser, using the IS-04 Query API, and provides connection management, using the IS-05 Connection API.
When used with the nmos-cpp-registry, it also provides access to registry log messages.
It has been successfully tested in many AMWA Networked Media Incubator workshops, and in the [JT-NM Tested](https://jt-nm.org/jt-nm_tested/) programme.

### Recent Activity

The implementation is designed to be extended. Development is ongoing, following the evolution of the NMOS specifications in the AMWA Networked Media Incubator.

Recent activity on the project (newest first):

- Prototype implementation of BCP-004-01 Receiver Capabilities
- JT-NM Tested 03/20 badge (packaged and deployed on a Mellanox SN2010 Switch)
- Improved and simplified connection management
- Periodic refresh
- Lots of other incremental improvements
- Added support for multi-homed Nodes
- Added connection management support for RTP, WebSocket and MQTT transports
- Added a dark theme
- Switched to [react-admin](https://github.com/marmelab/react-admin) framework from [ng-admin](https://github.com/marmelab/ng-admin)

## Contributing

We welcome bug reports, feature requests and contributions to the implementation and documentation.
Please have a look at the simple [Contribution Guidelines](CONTRIBUTING.md).

Thank you for your interest!

![This project was formerly known as sea-lion.](Documents/images/sea-lion.png?raw=true)
