# An NMOS Client in JavaScript

## Introduction

This repository contains an implementation of a small part of the [AMWA Networked Media Open Specifications](https://github.com/AMWA-TV/nmos) in JavaScript, [licensed](LICENSE) under the terms of the Apache License 2.0.

- [NMOS Discovery and Registration Specification](https://github.com/AMWA-TV/nmos-discovery-registration) (IS-04)
- [NMOS Connection Management Specification](https://github.com/AMWA-TV/nmos-device-connection-management) (IS-05)

This software is a **work in progress**, tracking the ongoing development of the NMOS specifications in the AMWA Networked Media Incubator. For more information about AMWA, NMOS and the Networked Media Incubator, please refer to http://amwa.tv/.

The [repository structure](Documents/Repository-Structure.md), and the [external dependencies](Documents/Dependencies.md), are outlined in the documentation.

### Getting Started

After setting up the dependencies, follow these [instructions](Documents/Getting-Started.md) to build and deploy the nmos-js client itself.

The client can be used standalone in a web browser, directly from a local filesystem.

The web application can also be embedded in the nmos-cpp-registry application. Copy the contents of the nmos-js build directory into the admin directory next to the nmos-cpp-registry executable.

## Work In Progress

The **master** branch has recently been switched to a [react-admin](https://github.com/marmelab/react-admin)-based implementation, which functions as an NMOS Registry browser, using the IS-04 Query API.
Connection management support, using the IS-05 Connection API, is currently being developed for this implementation.
The earlier [ng-admin](https://github.com/marmelab/ng-admin)-based implementation that included connection management is available on the **ng-admin** branch, but is not being developed further.

### Active Development

The software will continue to be updated to track the ongoing development of the NMOS specifications, and the work of the Networked Media Incubator.

## Contributing

We welcome bug reports and feature requests for the implementation. These should be submitted as Issues on GitHub:

- [Sign up](https://github.com/join) for GitHub if you haven't already done so.
- Check whether someone has already submitted a similar Issue.
- If necessary, submit a new Issue.

Thank you for your interest!

![This project was formerly known as sea-lion.](Documents/images/sea-lion.png?raw=true)
