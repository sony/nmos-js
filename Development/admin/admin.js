// Steps to add new endpoint to admin
// 1. Create entity: var x = nga.entity('xs').readOnly();
// 2. Create list view with fields/labels/listActions/filters
// 3. Create show view with title/fields/labels/listActions/references
// 4. Add entity to admin: admin.addEntity(x);
// 5. Add menu child: .addChild(nga.menu(x).icon('<span class="glyphicon glyphicon-list"></span>'))

"use strict";

var myApp = angular.module('myApp', ['ng-admin']);

myApp.config(['NgAdminConfigurationProvider', function (nga) {

  // Application, using the Query API on the same host

  var admin = nga.application('sea-lion')
    .baseApiUrl('http://' + window.location.hostname + ':3211/x-nmos/query/v1.0/');

  // my modern CSS voodoo is sorely lacking
  admin.header(
    '<div class="navbar-header ng-scope">' +
      '<img src="./images/sonyLogo.png" style="height:50px"/><img src="./images/seaLion.png" style="height:50px"/>' +
      '<a class="navbar-brand" style="float:none" href="#" ng-click="appController.displayHome()">' +
        'sea-lion' +
      '</a>' +
    '</div>'
    );

  // Entities

  var node = nga.entity('nodes').readOnly();
  var device = nga.entity('devices').readOnly();
  var source = nga.entity('sources').readOnly();
  var flow = nga.entity('flows').readOnly();
  var sender = nga.entity('senders').readOnly();
  var receiver = nga.entity('receivers').readOnly();

  // Templates

  const FILTER_TEMPLATE = '<div class="input-group"><input type="text" ng-model="value" placeholder="{{field._name.substr(0,1).toUpperCase() + field._name.substr(1)}}" class="form-control"></input><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>';

  // Nodes list view

  node.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('hostname').sortable(false)
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .label('') // no label for the pinned filter
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('hostname')
        .label('Hostname') // must have a label if not pinned as this text is displayed in drop-down filter selection
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Node show view

  node.showView()
    .title('Node: {{entry.values.label}}')
    .fields([
      nga.field('label').label('Label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('hostname'),
      nga.field('href').template('<a href="{{value}}">{{value}}</a>').label('Address'),
      nga.field('version'),
      nga.field('devices', 'referenced_list') // display list of related devices
        .targetEntity(device)
        .targetReferenceField('node_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ])
    ]);

  admin.addEntity(node);

  // Devices list view

  device.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('type', 'choice').sortable(false).choices([
        { value: 'urn:x-nmos:device:generic', label: 'Generic' }, // TODO: add else print string function with choiceS - not sure if can be done
      ])
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .label('')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('type')
        .label('Type')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Devices show view

  device.showView()
    .title('Device: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('node_id', 'reference')
        .targetEntity(node)
        .targetField(nga.field('label'))
        .label('Node'),
      nga.field('receivers', 'referenced_list')
        .targetEntity(receiver)
        .targetReferenceField('device_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('senders', 'referenced_list')
        .targetEntity(sender)
        .targetReferenceField('device_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('sources', 'referenced_list')
        .targetEntity(source)
        .targetReferenceField('device_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('type', 'choice').choices([
        { value: 'urn:x-nmos:device:generic', label: 'Generic' },
      ]),
      nga.field('version')
    ]);

  admin.addEntity(device);

  // Sources list view

  source.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices([
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-nmos:format:data', label: 'Data' }
      ])
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .label('')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .label('Format')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Source show view

  source.showView()
    .title('Source: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('device_id', 'reference')
        .targetEntity(device)
        .targetField(nga.field('label'))
        .label('Device'),
      nga.field('caps', 'json').label('Capabilities'),
      nga.field('description'),
      nga.field('format', 'choice').choices([
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-nmos:format:data', label: 'Data' }
      ]),
      nga.field('parents', 'reference_many') // TODO: format this like a 'referenced_list'
        .targetEntity(source)
        .targetField(nga.field('label'))
        .label('Parents'),
      nga.field('flows', 'referenced_list')
        .targetEntity(flow)
        .targetReferenceField('source_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('tags', 'json'),
      nga.field('version')
    ]);

  admin.addEntity(source);

  // Flows list view

  flow.listView()
    .fields([
      nga.field('label').label('Label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices([
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-nmos:format:data', label: 'Data' }
      ])
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .label('')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .label('Format')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Flow show view

  flow.showView()
    .title('Flow: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('source_id', 'reference')
        .targetEntity(source)
        .targetField(nga.field('label'))
        .label('Source'),
      nga.field('description'),
      nga.field('format', 'choice').choices([
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-nmos:format:data', label: 'Data' }
      ]),
      nga.field('parents', 'reference_many')
        .targetEntity(source)
        .targetField(nga.field('label'))
        .label('Parents'),
      nga.field('senders', 'referenced_list')
        .targetEntity(sender)
        .targetReferenceField('flow_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('tags', 'json'),
      nga.field('version')
    ]);

  admin.addEntity(flow);

  // Senders list view

  sender.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('transport', 'choice').sortable(false).choices([
        { value: 'urn:x-nmos:transport:rtp', label: 'Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:rtp.ucast', label: 'Unicast Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:rtp.mcast', label: 'Multicast Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:dash', label: 'Dynamic Adaptive Streaming over HTTP' }
      ])
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .label('')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('transport')
        .label('Transport')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Sender show view

  sender.showView()
    .title('Sender: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('device_id', 'reference')
        .targetEntity(device)
        .targetField(nga.field('label'))
        .label('Device'),
      nga.field('flow_id', 'reference')
        .targetEntity(flow)
        .targetField(nga.field('label'))
        .label('Flow'),
      nga.field('description'),
      nga.field('transport', 'choice').choices([
        { value: 'urn:x-nmos:transport:rtp', label: 'Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:rtp.ucast', label: 'Unicast Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:rtp.mcast', label: 'Multicast Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:dash', label: 'Dynamic Adaptive Streaming over HTTP' }
      ]),
      nga.field('manifest_href').template('<a href="{{value}}">{{value}}</a>').label('Manifest Address'),
      nga.field('version')
    ]);

  admin.addEntity(sender);

  // Receiver list view

  receiver.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices([
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-nmos:format:data', label: 'Data' }
      ]),
      nga.field('transport', 'choice').sortable(false).choices([
        { value: 'urn:x-nmos:transport:rtp', label: 'Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:rtp.ucast', label: 'Unicast Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:rtp.mcast', label: 'Multicast Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:dash', label: 'Dynamic Adaptive Streaming over HTTP' }
      ]),
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .label('')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .label('Format')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('transport')
        .label('Transport')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Receiver show view

  receiver.showView()
    .title('Receiver: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('device_id', 'reference')
        .targetEntity(device)
        .targetField(nga.field('label'))
        .label('Device'),
      nga.field('subscription.sender_id', 'reference')
        .targetEntity(sender)
        .targetField(nga.field('label'))
        .label('Sender'),
      nga.field('tags', 'json'),
      nga.field('description'),
      nga.field('caps', 'json').label('Capabilities'),
      nga.field('format', 'choice').choices([
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-nmos:format:data', label: 'Data' }
      ]),
      nga.field('transport', 'choice').choices([
        { value: 'urn:x-nmos:transport:rtp', label: 'Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:rtp.ucast', label: 'Unicast Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:rtp.mcast', label: 'Multicast Real-time Transport Protocol' },
        { value: 'urn:x-nmos:transport:dash', label: 'Dynamic Adaptive Streaming over HTTP' }
      ]),
      nga.field('version')
    ]);

  admin.addEntity(receiver);

  // Side-bar menu

  admin.menu(nga.menu()
    .addChild(nga.menu(node).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(device).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(source).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(flow).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(sender).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(receiver).icon('<span class="glyphicon glyphicon-list"></span>'))
  );

  // attach the admin application to the DOM and execute it
  nga.configure(admin);
}]);

// Intercept ng-admin REST flavour and adapt for NMOS flavour

myApp.config(['RestangularProvider', function (RestangularProvider) {
  RestangularProvider.addFullRequestInterceptor(function (element, operation, what, url, headers, params) {
    if (operation == "getList") {
      // Pagination
      delete params._page;
      delete params._perPage;
      // Sorting
      delete params._sortField;
      delete params._sortDir;
      // Query parameters
      if (params._filters) {
        params['query.match_type'] = 'substr';  // sea-lion private parameter to allow partial match functionality
        for (var filter in params._filters) {
          params[filter] = params._filters[filter];
        }
        delete params._filters;
      }
    }
    return { params: params };
  });
}]);
