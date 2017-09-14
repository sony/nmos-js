# An NMOS Client in JavaScript

## Introduction

This repository contains an implementation of a small part of the [AMWA Networked Media Open Specifications](https://github.com/AMWA-TV/nmos) in JavaScript, [licensed](LICENSE) under the terms of the Apache License 2.0.

- [NMOS Discovery and Registration Specification](https://github.com/AMWA-TV/nmos-discovery-registration) (IS-04)
- [NMOS Connection Management Specification](https://github.com/AMWA-TV/nmos-device-connection-management) (IS-05)

This software is a **work in progress**, tracking the ongoing development of the NMOS specifications in the AMWA Networked Media Incubator. For more information about AMWA, NMOS and the Networked Media Incubator, please refer to http://amwa.tv/.

- The [admin module](Development/admin) includes an implementation of an NMOS Client as a web application, utilising the NMOS Node, Registration and Query APIs, and the NMOS Connection API.
- This web application has a few additional features utilising the extensions provided by the [nmos-cpp](https://github.com/sony/nmos-cpp) implementation of an NMOS Registration & Discovery System (RDS).

The [repository structure](Documents/Repository-Structure.md), and the [external dependencies](Documents/Dependencies.md), are outlined in the documentation.

### Getting Started

The client can be used standalone, by opening [admin/index.html](Development/admin/index.html) in a web browser, directly from a local filesystem.

The web application can also be embedded in the nmos-cpp-registry application. Simply clone both repositories so that the nmos-cpp and nmos-js directories are at the same level and rebuild the nmos-cpp-registry application.

## Work In Progress

The implementation is functional and has been used successfully in several Networked Media Incubator workshop "plug-fests", interoperating with other NMOS implementations.

The implementation is incomplete in some areas. Development is ongoing! The NMOS specifications are being continuously developed, as enhancements are proposed and prototyped by the Incubator participants.

### Active Development

The software will continue to be updated to track the ongoing development of the NMOS specifications, and the work of the Networked Media Incubator.

## Contributing

We welcome bug reports and feature requests for the implementation. These should be submitted as Issues on GitHub:

- [Sign up](https://github.com/join) for GitHub if you haven't already done so.
- Check whether someone has already submitted a similar Issue.
- If necessary, submit a new Issue.

Thank you for your interest!

![This project was formerly known as sea-lion.](Documents/images/sea-lion.png?raw=true)
