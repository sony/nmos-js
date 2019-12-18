# An NMOS Client in JavaScript [![Build Status](https://travis-ci.org/sony/nmos-js.svg?branch=master)](https://travis-ci.org/sony/nmos-js)

## Introduction

This repository contains an implementation of a small part of the [AMWA Networked Media Open Specifications](https://github.com/AMWA-TV/nmos) in JavaScript, [licensed](LICENSE) under the terms of the Apache License 2.0.

- [NMOS Discovery and Registration Specification](https://github.com/AMWA-TV/nmos-discovery-registration) (IS-04)
- [NMOS Connection Management Specification](https://github.com/AMWA-TV/nmos-device-connection-management) (IS-05)

For more information about AMWA, NMOS and the Networked Media Incubator, please refer to http://amwa.tv/.

The [repository structure](Documents/Repository-Structure.md), and the [external dependencies](Documents/Dependencies.md), are outlined in the documentation.

### Getting Started

After setting up the dependencies, follow these [instructions](Documents/Getting-Started.md) to build and deploy the nmos-js client itself.

The client can be used standalone in a web browser, directly from a local filesystem.

The web application can also be embedded in the nmos-cpp-registry application. Copy the contents of the nmos-js build directory into the admin directory next to the nmos-cpp-registry executable.

## Active Development

The implementation is functional and works as both an NMOS Registry browser, using the IS-04 Query API, and provides connection management, using the IS-05 Connection API. When used with the nmos-cpp-registry, it also provides access to registry log messages.

### Recent Activity

The implementation is incomplete in some areas. Development is ongoing, tracking the evolution of the NMOS specifications in the AMWA Networked Media Incubator.

Recent activity on the project (newest first):

- Lots of other incremental improvements
- Added support for multi-homed Nodes
- Added connection management support for RTP, WebSocket and MQTT transports
- Added a dark theme
- Switched to [react-admin](https://github.com/marmelab/react-admin) framework from [ng-admin](https://github.com/marmelab/ng-admin)

## Contributing

We welcome bug reports and feature requests for the implementation. These should be submitted as Issues on GitHub:

- [Sign up](https://github.com/join) for GitHub if you haven't already done so.
- Check whether someone has already submitted a similar Issue.
- If necessary, submit a new Issue.

Good bug reports will include a clear title and description, as much relevant information as possible, and preferably a code sample or an executable test case demonstrating the expected behavior that is not occurring.

Thank you for your interest!

![This project was formerly known as sea-lion.](Documents/images/sea-lion.png?raw=true)
