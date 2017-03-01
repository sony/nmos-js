/* Steps to add new endpoint to admin
1. Create entity: var x = nga.entity('xs').readOnly();
2. Create list view with fields/labels/listActions/filters
3. Create show view with title/fields/labels/listActions/references
4. Add entity to admin: admin.addEntity(x);
5. Add menu child: .addChild(nga.menu(x).icon('<span class="glyphicon glyphicon-list"></span>')) */

"use strict";
console.log('Test');
var myApp = angular.module('myApp', ['ng-admin']);
myApp.config(['NgAdminConfigurationProvider', function (nga) {
  // create an admin application
  var admin = nga.application('sea-lion') // string is the title
     .baseApiUrl('http://localhost:3211/x-nmos/query/v1.0/');  // main API endpoint
  // create a node entity
  // the API endpoint for this entity will be 'http://localhost:3211/x-nmos/query/v1.0/nodes/:id'

  // Entities
  var node = nga.entity('nodes').readOnly();
  var device = nga.entity('devices').readOnly();
  var source = nga.entity('sources').readOnly();
  var flow = nga.entity('flows').readOnly();
  var sender = nga.entity('senders').readOnly();
  var receiver = nga.entity('receivers').readOnly();

  // Templates
  const FILTER_TEMPLATE = '<div class="input-group"><input type="text" ng-model="value" placeholder="{{field._name.substr(0,1).toUpperCase() + field._name.substr(1)}}" class="form-control"></input><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>';

  // Node entity
  // set the fields of the node entity list view
  node.listView().fields([
    nga.field('label').label('Label').isDetailLink(true).sortable(false),
    nga.field('hostname').sortable(false)
  ])
  .listActions(['show'])  // allows showView button action in list
  .actions(['filter'])  // allows filter button to show above list
  .filters([
    nga.field('label')
       .label('')
       .pinned(true)
       .template(FILTER_TEMPLATE),
    nga.field('hostname')
       .label('Hostname') // must have a label if not pinned as this text is displayed in drop down filter selection
       .pinned(false)
       .template(FILTER_TEMPLATE)
  ]);
  // add the showView to node list view
  node.showView().title('Node: {{entry.values.label}}').fields([
    nga.field('label').label('Label'),
    nga.field('id').isDetailLink(false).label('ID'),
    nga.field('hostname'),
    nga.field('href').template('<a href="{{value}}">{{value}}</a>').label('Address'),
    nga.field('version'),
    nga.field('devices', 'referenced_list') // display list of related devices
       .sortable(false) // doesn't work in showView with lists
       .targetEntity(device)
       .targetReferenceField('node_id')
       .targetFields([
         nga.field('label').isDetailLink(true)
       ])
  ]);
  // add node entity to admin application
  admin.addEntity(node);

  // Devices entity
  // list view
  device.listView().fields([
    nga.field('label').label('Label').isDetailLink(true).sortable(false),
    nga.field('type', 'choice').sortable(false).choices([
      { value: 'urn:x-nmos:device:generic', label: 'Generic'}, // TODO: add else print string function with choiceS
    ])
  ])
  .listActions(['show'])
  .actions(['filter'])
  .filters([
    nga.field('label')
       .label('Label')
       .pinned(true)
       .template(FILTER_TEMPLATE),
    nga.field('type')
       .label('Type') // must have a label if not pinned as this text is displayed in drop down filter selection
       .pinned(false)
       .template(FILTER_TEMPLATE)
  ]);
  // show view
  device.showView().title('Device: {{entry.values.label}}').fields([
    nga.field('label').label('Label'),
    nga.field('id').isDetailLink(false).label('ID'),
    nga.field('node_id', 'reference').sortable(false)
       .targetEntity(node)
       .targetField(nga.field('label'))
       .label('Node'),
    //  nga.field('receivers', 'reference_many')  // soon-to-be deprecated method
    //     .targetEntity(receiver)
    //     .targetField(nga.field('label'))
    //     .label('Receivers'),
    nga.field('receivers', 'referenced_list')
       .targetEntity(receiver)
       .targetReferenceField('device_id')
       .targetFields([nga.field('label').isDetailLink(true)]),
    //  nga.field('senders', 'reference_many')
    //     .targetEntity(sender)
    //     .targetField(nga.field('label'))
    //     .label('Senders'),
    nga.field('type', 'choice').sortable(false).choices([
      { value: 'urn:x-nmos:device:generic', label: 'Generic'},
    ]),
    nga.field('version')
  ]);
  admin.addEntity(device);

  // Sources entity
  // list view
  source.listView().fields([
    nga.field('label').label('Label').isDetailLink(true).sortable(false),
    nga.field('format', 'choice').sortable(false).choices([
      { value: 'urn:x-nmos:format:video', label: 'Video'},
      { value: 'urn:x-nmos:format:audio', label: 'Audio'},
      { value: 'urn:x-nmos:format:data', label: 'Data'}
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
       .label('Format') // must have a label if not pinned as this text is displayed in drop down filter selection
       .pinned(false)
       .template(FILTER_TEMPLATE)
  ]);
  // show view
  source.showView().title('Source: {{entry.values.label}}').fields([
    nga.field('label').label('Label'),
    nga.field('id').isDetailLink(false).label('ID'),
    nga.field('device_id', 'reference')
       .targetEntity(device)
       .targetField(nga.field('label'))
       .label('Device'),
    nga.field('caps', 'json').label('Capabilities'),
    nga.field('description'),
    nga.field('format', 'choice').choices([
      { value: 'urn:x-nmos:format:video', label: 'Video'},
      { value: 'urn:x-nmos:format:audio', label: 'Audio'},
      { value: 'urn:x-nmos:format:data', label: 'Data'}
    ]),
    nga.field('parents'),
    nga.field('tags', 'json'),
    nga.field('version')
  ]);
  admin.addEntity(source);

  // Flows entity
  // list view
  flow.listView().fields([
    nga.field('label').label('Label').isDetailLink(true).sortable(false),
    nga.field('format', 'choice').sortable(false).choices([
      { value: 'urn:x-nmos:format:video', label: 'Video'},
      { value: 'urn:x-nmos:format:audio', label: 'Audio'},
      { value: 'urn:x-nmos:format:data', label: 'Data'}
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
       .label('Format') // must have a label if not pinned as this text is displayed in drop down filter selection
       .pinned(false)
       .template(FILTER_TEMPLATE)
  ]);
  // show view
  flow.showView().title('Flow: {{entry.values.label}}').fields([
    nga.field('label').label('Label'),
    nga.field('id').isDetailLink(false).label('ID'),
    nga.field('source_id'),
    nga.field('description'),
    nga.field('format', 'choice').choices([
      { value: 'urn:x-nmos:format:video', label: 'Video'},
      { value: 'urn:x-nmos:format:audio', label: 'Audio'},
      { value: 'urn:x-nmos:format:data', label: 'Data'}
    ]),
    nga.field('parents'),
    nga.field('tags', 'json'),
    nga.field('version')
  ]);
  admin.addEntity(flow);

  // Senders entity
  // list view
  sender.listView().fields([
    nga.field('label').label('Label').isDetailLink(true).sortable(false),
    nga.field('transport', 'choice').sortable(false).choices([
      { value: 'urn:x-nmos:transport:rtp', label: 'Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:rtp.ucast', label: 'Unicast Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:rtp.mcast', label: 'Multicast Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:dash', label: 'Dynamic Adaptive Streaming over HTTP Protocol'}
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
       .label('Transport') // must have a label if not pinned as this text is displayed in drop down filter selection
       .pinned(false)
       .template(FILTER_TEMPLATE)
  ]);
  // show view
  sender.showView().title('Sender: {{entry.values.label}}').fields([
    nga.field('label').label('Label'),
    nga.field('id').isDetailLink(false).label('ID'),
    nga.field('device_id'),
    nga.field('flow_id'),
    nga.field('description'),
    nga.field('transport', 'choice').choices([
      { value: 'urn:x-nmos:transport:rtp', label: 'Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:rtp.ucast', label: 'Unicast Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:rtp.mcast', label: 'Multicast Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:dash', label: 'Dynamic Adaptive Streaming over HTTP Protocol'}
    ]),
    nga.field('manifest_href').template('<a href="{{value}}">{{value}}</a>').label('Manifest Address'),
    nga.field('version')
  ]);
  admin.addEntity(sender);

  // Receiver entity
  // list view
  receiver.listView().fields([
    nga.field('label').label('Label').isDetailLink(true).sortable(false),
    nga.field('format', 'choice').sortable(false).choices([
      { value: 'urn:x-nmos:format:video', label: 'Video'},
      { value: 'urn:x-nmos:format:audio', label: 'Audio'},
      { value: 'urn:x-nmos:format:data', label: 'Data'}
    ]),
    nga.field('transport', 'choice').sortable(false).choices([
      { value: 'urn:x-nmos:transport:rtp', label: 'Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:rtp.ucast', label: 'Unicast Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:rtp.mcast', label: 'Multicast Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:dash', label: 'Dynamic Adaptive Streaming over HTTP Protocol'}
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
       .label('Format') // must have a label if not pinned as this text is displayed in drop down filter selection
       .pinned(false)
       .template(FILTER_TEMPLATE),
    nga.field('transport')
       .label('Transport') // must have a label if not pinned as this text is displayed in drop down filter selection
       .pinned(false)
       .template(FILTER_TEMPLATE)
  ]);
  // show view
  receiver.showView().title('Receiver: {{entry.values.label}}').fields([
    nga.field('label').label('Label'),
    nga.field('id').isDetailLink(false).label('ID'),
    nga.field('device_id', 'reference')
       .targetEntity(device)
       .targetField(nga.field('label'))
       .label('Device'),
    nga.field('subscription.sender_id'), // TODO: add ref ==> 'subscription.sender'
    nga.field('tags', 'json'),
    nga.field('description'),
    nga.field('caps', 'json').label('Capabilities'),
    nga.field('format', 'choice').choices([
      { value: 'urn:x-nmos:format:video', label: 'Video'},
      { value: 'urn:x-nmos:format:audio', label: 'Audio'},
      { value: 'urn:x-nmos:format:data', label: 'Data'}
    ]),
    nga.field('transport', 'choice').choices([
      { value: 'urn:x-nmos:transport:rtp', label: 'Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:rtp.ucast', label: 'Unicast Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:rtp.mcast', label: 'Multicast Real-time Transport Protocol'},
      { value: 'urn:x-nmos:transport:dash', label: 'Dynamic Adaptive Streaming over HTTP Protocol'}
    ]),
    nga.field('version')
  ]);
  admin.addEntity(receiver);

  // customise menu
  admin.menu(nga.menu()
    .addChild(nga.menu(node).icon('<span class="glyphicon glyphicon-list"></span>')) // replace HTML with custom images e.g. <img src="./images/sonyBlack.jpg" style="height:10px; width:20px;"/>
    .addChild(nga.menu(device).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(source).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(flow).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(sender).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(receiver).icon('<span class="glyphicon glyphicon-list"></span>'))
  );

  // attach the admin application to the DOM and execute it
  nga.configure(admin);
}]);

// Configure JSONPlaceholder REST Flavor with ng-admin REST flavor
myApp.config(['RestangularProvider', function (RestangularProvider) {
  RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
    if (operation == "getList") {
      // custom pagination params
      // if (params._page) {
      //     params._start = (params._page - 1) * params._perPage;
      //     params._end = params._page * params._perPage;
      // }
      delete params._page;
      delete params._perPage;
      // custom sort params
      // if (params._sortField) {
      //     params._sort = params._sortField;
      //     params._order = params._sortDir;
          delete params._sortField;
          delete params._sortDir;
      // }
      // custom filters
      if (params._filters) {
          params['query.match_type'] = 'substr';  // allows partial search functionality
          for (var filter in params._filters) {
              params[filter] = params._filters[filter];
          }
          delete params._filters;
      }
    }
    return { params: params };
  });
}]);
