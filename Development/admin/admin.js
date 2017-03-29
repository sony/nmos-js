// Steps to add new endpoint to admin
// 1. Create entity: var x = nga.entity('xs').readOnly();
// 2. Create list view with fields/labels/listActions/filters
// 3. Create show view with title/fields/labels/listActions/references
// 4. Add entity to admin: admin.addEntity(x);
// 5. Add menu child: .addChild(nga.menu(x).icon('<span class="glyphicon glyphicon-list"></span>'))
// 6. (optional) Add dashboard collection: .addCollection(nga.collection(x).fields(x.listView().fields()))

"use strict";

var myApp = angular.module('myApp', ['ng-admin']);

myApp.config(['NgAdminConfigurationProvider', function (nga) {

  // Application, mostly just using the Query API on the same host

  var admin = nga.application('sea-lion')
    .baseApiUrl('http://' + window.location.hostname + ':3211/x-nmos/query/v1.0/');

  // my modern CSS voodoo is sorely lacking
  admin.header(
    '<div class="navbar-header ng-scope">' +
      '<img src="./images/sonyLogo.png" style="height:50px" alt="Sony Logo"/><img src="./images/seaLion.png" style="height:50px" alt="sea-lion"/>' +
      '<a class="navbar-brand" style="float:none" href="#" ng-click="appController.displayHome()">' +
        'sea-lion' +
      '</a>' +
    '</div>'
    );

  // Entities

  var nodes = nga.entity('nodes').readOnly();
  var devices = nga.entity('devices').readOnly();
  var sources = nga.entity('sources').readOnly();
  var flows = nga.entity('flows').readOnly();
  var senders = nga.entity('senders').readOnly();
  var receivers = nga.entity('receivers').readOnly();
  var subscriptions = nga.entity('subscriptions').readOnly();
  // Logging API is on a different port on the same host
  var logs = nga.entity('events').label('Logs').baseApiUrl('http://' + window.location.hostname + ':5106/log/').readOnly();

  // Templates and common definitions

  const FORMAT_CHOICES = [
    { value: 'urn:x-nmos:format:video', label: 'Video' },
    { value: 'urn:x-nmos:format:audio', label: 'Audio' },
    { value: 'urn:x-nmos:format:data', label: 'Data' },
    { value: 'urn:x-nmos:format:mux', label: 'Mux' }
  ];

  const TRANSPORT_CHOICES = [
    { value: 'urn:x-nmos:transport:rtp', label: 'RTP (Real-time Transport Protocol)' },
    { value: 'urn:x-nmos:transport:rtp.mcast', label: 'RTP.mcast (Multicast Real-time Transport Protocol)' },
    { value: 'urn:x-nmos:transport:rtp.ucast', label: 'RTP.ucast (Unicast Real-time Transport Protocol)' },
    { value: 'urn:x-nmos:transport:dash', label: 'DASH (Dynamic Adaptive Streaming over HTTP)' }
  ];

  const TYPE_CHOICES = [
    { value: 'urn:x-nmos:device:generic', label: 'Generic' },
    { value: 'urn:x-nmos:device:pipeline', label: 'Pipeline' }
  ];

  const FILTER_TEMPLATE =
    '<div class="input-group">' +
      '<input type="text" ng-model="value" placeholder="{{field._label == null ? field._name.substr(0,1).toUpperCase() + field._name.substr(1) : field._label}}" class="form-control"></input>' +
      '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>' +
    '</div>';

  // Nodes list view

  nodes.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('hostname').sortable(false),
      nga.field('api.versions', 'string').label('Node API Versions').map((versions) => { return versions instanceof Array ? versions.toString() : null; }).sortable(false)
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('hostname')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('api.versions', 'json').label('Node API Versions')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Node show view

  nodes.showView()
    .title('Node: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('hostname'),
      nga.field('href').template('<a href="{{value}}">{{value}}</a>').label('Address'),
      nga.field('api.versions', 'json').label('Node API Versions'),
      nga.field('api.endpoints', 'json').label('Node API Address Fragments'),
      nga.field('services', 'json'),
      nga.field('clocks', 'json'),
      nga.field('interfaces', 'json'),
      nga.field('version'),
      nga.field('devices', 'referenced_list') // display list of related devices
        .targetEntity(devices)
        .targetReferenceField('node_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ])
    ]);

  admin.addEntity(nodes);

  // Devices list view

  devices.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('type', 'choice').sortable(false).choices(TYPE_CHOICES)
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('type')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Devices show view

  devices.showView()
    .title('Device: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('node_id', 'reference')
        .targetEntity(nodes)
        .targetField(nga.field('label'))
        .label('Node'),
      nga.field('receivers', 'referenced_list')
        .targetEntity(receivers)
        .targetReferenceField('device_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('senders', 'referenced_list')
        .targetEntity(senders)
        .targetReferenceField('device_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('sources', 'referenced_list')
        .targetEntity(sources)
        .targetReferenceField('device_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('type', 'choice').choices(TYPE_CHOICES),
      nga.field('version')
    ]);

  admin.addEntity(devices);

  // Sources list view

  sources.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices()
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('description')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Source show view

  sources.showView()
    .title('Source: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(nga.field('label'))
        .label('Device'),
      nga.field('caps', 'json').label('Capabilities'),
      nga.field('description'),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('parents', 'reference_many') // TODO: format this like a 'referenced_list'
        .targetEntity(sources)
        .targetField(nga.field('label'))
        .label('Parents'),
      nga.field('flows', 'referenced_list')
        .targetEntity(flows)
        .targetReferenceField('source_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('tags', 'json'),
      nga.field('version')
    ]);

  admin.addEntity(sources);

  // Flows list view

  flows.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices(FORMAT_CHOICES)
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('description')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Flow show view

  flows.showView()
    .title('Flow: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('source_id', 'reference')
        .targetEntity(sources)
        .targetField(nga.field('label'))
        .label('Source'),
      nga.field('description'),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('parents', 'reference_many')
        .targetEntity(flows)
        .targetField(nga.field('label'))
        .label('Parents'),
      nga.field('senders', 'referenced_list')
        .targetEntity(senders)
        .targetReferenceField('flow_id')
        .targetFields([
          nga.field('label').isDetailLink(true).sortable(false)
        ]),
      nga.field('tags', 'json'),
      nga.field('version')
    ]);

  admin.addEntity(flows);

  // Senders list view

  senders.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('transport', 'choice').sortable(false).choices(TRANSPORT_CHOICES)
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('transport')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('description')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Sender show view

  senders.showView()
    .title('Sender: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(nga.field('label'))
        .label('Device'),
      nga.field('flow_id', 'reference')
        .targetEntity(flows)
        .targetField(nga.field('label'))
        .label('Flow'),
      nga.field('description'),
      nga.field('transport', 'choice').choices(TRANSPORT_CHOICES),
      nga.field('manifest_href').template('<a href="{{value}}">{{value}}</a>').label('Manifest Address'),
      nga.field('version')
    ]);

  admin.addEntity(senders);

  // Receiver list view

  receivers.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices(FORMAT_CHOICES),
      nga.field('transport', 'choice').sortable(false).choices(TRANSPORT_CHOICES),
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('label')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('format')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('transport')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('description')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Receiver show view

  const CONNECT_TEMPLATE =
    '<div class="input-group">' +
      '<ma-input-field field="::field" value="value"/>' +
      '<span class="input-group-btn" style="padding-left: 12px"><ma-connect-button entry="entry" value="value" datastore="datastore" label="Connect"/></span>' +
    '</div>';

  receivers.showView()
    .prepare(['entry', 'Restangular', 'datastore', function(entry, Restangular, datastore) {
      Restangular.all('senders').getList().then((senders) => {
        datastore.setEntries('senders', senders.data);
      });
      Restangular.one('devices', entry.values.device_id).get().then((device) => {
        Restangular.one('nodes', device.data.node_id).get().then((node) => {
          // should use the node api version here
          datastore.addEntry('target_href', node.data.href + ('/' === node.data.href.substr(-1) ? '' : '/') + 'x-nmos/node/v1.0/receivers/' + entry.values.id + '/target');
        });
      });
    }])
    .title('Receiver: {{entry.values.label}}')
    .fields([
      nga.field('label'),
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(nga.field('label'))
        .label('Device'),
      nga.field('subscription.sender_id', 'reference')
        .targetEntity(senders)
        .targetField(nga.field('label'))
        .label('Sender'),
      nga.field('subscription.sender_id.connect').attributes({ placeholder: 'Enter an appropriate Sender ID...' })
        .label('')
        .template(CONNECT_TEMPLATE),
      nga.field('tags', 'json'),
      nga.field('description'),
      nga.field('caps', 'json').label('Capabilities'),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('transport', 'choice').choices(TRANSPORT_CHOICES),
      nga.field('version')
    ]);

  admin.addEntity(receivers);

  // Subscriptions list view

  subscriptions.listView()
    .fields([
      nga.field('resource_path').isDetailLink(true).sortable(false),
      nga.field('persist', 'boolean').sortable(false),
      nga.field('max_update_rate_ms', 'number').label('Max Update Rate (ms)').sortable(false),
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('resource_path').label('Resource Path')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('persist', 'boolean')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('max_update_rate_ms', 'number').label('Max Update Rate (ms)')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Subscription show view

  subscriptions.showView()
    .title('Subscription: {{entry.values.resource_path}}')
    .fields([
      nga.field('resource_path'),
      nga.field('persist', 'boolean'),
      nga.field('max_update_rate_ms', 'number').label('Max Update Rate (ms)'),
      nga.field('params', 'json'),
      nga.field('ws_href').template('<a href="{{value}}">{{value}}</a>').label('WebSocket Address'),
      nga.field('id').isDetailLink(false).label('ID'),
    ]);

  admin.addEntity(subscriptions);

  // Logs list view

  function levelCssClasses(entry) {
    if (entry) {
      return entry.values.level > 10 ? 'level-error' : entry.values.level > 0 ? 'level-warning' : entry.values.level < 0 ? 'level-verbose' : '';
    }
    return '';
  };

  logs.listView()
    .fields([
      nga.field('timestamp', 'datetime').isDetailLink(true).sortable(false),
      nga.field('level_name').label('Level').isDetailLink(true).sortable(false)
        .cssClasses(levelCssClasses),
      nga.field('message').sortable(false).map(function truncate(value) {
        if (!value) return '';
        return value.length > 80 ? value.substr(0, 80) + '...' : value;
      }),
      nga.field('route_parameters.api').label('API').sortable(false)
    ])
    .listActions(['show'])
    .actions(['filter'])
    .filters([
      nga.field('timestamp')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('level_name')
        .label('Level')
        .pinned(true)
        .template(FILTER_TEMPLATE),
      nga.field('message')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('route_parameters.api')
        .label('API')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('route_parameters.resourceType')
        .label('Resource Type')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Log show view

  logs.showView()
    .title('Log: {{entry.values.level_name}} @ {{entry.values.timestamp}}')
    .fields([
      nga.field('timestamp', 'datetime'),
      nga.field('level_name').label('Level')
        .cssClasses(function(entry) {
          return 'col-sm-10 col-md-8 col-lg-7 ' + levelCssClasses(entry);
        }),
      nga.field('message'),
      nga.field('route_parameters.api').label('API'),
      nga.field('route_parameters.resourceType').label('Resource Type'),
      nga.field('route_parameters.resourceId').label('Resource ID'),
      nga.field('http_method').label('HTTP Method'),
      nga.field('request_uri').label('Request URI'),
      nga.field('source_location', 'json'),
      nga.field('thread_id').label('Thread ID'),
      nga.field('id').isDetailLink(false).label('ID')
    ]);

  admin.addEntity(logs);

  // Dashboard

  admin.dashboard(nga.dashboard()
    .addCollection(nga.collection(nodes).fields(nodes.listView().fields()))
    .addCollection(nga.collection(devices).fields(devices.listView().fields()))
    .addCollection(nga.collection(sources).fields(sources.listView().fields()))
    .addCollection(nga.collection(flows).fields(flows.listView().fields()))
    .addCollection(nga.collection(senders).fields(senders.listView().fields()))
    .addCollection(nga.collection(receivers).fields(receivers.listView().fields()))
    .addCollection(nga.collection(subscriptions).fields(subscriptions.listView().fields()))
    //.addCollection(nga.collection(logs).fields(logs.listView().fields()).perPage(10))
  );

  // Side-bar menu

  admin.menu(nga.menu()
    .addChild(nga.menu(nodes).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(devices).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(sources).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(flows).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(senders).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(receivers).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(subscriptions).icon('<span class="glyphicon glyphicon-list"></span>'))
    .addChild(nga.menu(logs).icon('<span class="glyphicon glyphicon-list"></span>'))
  );

  // attach the admin application to the DOM and execute it
  nga.configure(admin);
}]);

// Custom directive to connect a Receiver to a Sender

myApp.directive('maConnectButton', ['$http', '$location', function ($http, $location) {
    return {
        restrict: 'E',
        scope: {
            entry: '&',
            value: '&',
            datastore: '&',
            size: '@',
            label: '@'
        },
        link: function (scope, element, attrs) {
            scope.label = scope.label || 'CONNECT';
            scope.connect = function () {
                var target_href = scope.datastore().getFirstEntry('target_href');
                var sender = scope.datastore().getEntries('senders').find(sender => { return sender['id'] === scope.value(); }) || {};
                console.log(target_href);
                console.log(sender);
                $http.put(scope.datastore().getFirstEntry('target_href'), sender);
            };
        },
        template: '<a class="btn btn-default" ng-class="size ? \'btn-\' + size : \'\'" ng-click="connect()">{{label}}</a>'
    };
}]);

// Intercept ng-admin REST flavour and adapt for NMOS flavour

myApp.config(['RestangularProvider', function (RestangularProvider) {
  RestangularProvider.addFullRequestInterceptor(function (element, operation, what, url, headers, params) {
    if (operation === 'getList') {
      // Pagination
      if (what === 'events') {
        params['paging.offset'] = (params._page - 1) * params._perPage;
        params['paging.limit'] = params._perPage;
      }
      delete params._page;
      delete params._perPage;
      // Sorting
      delete params._sortField;
      delete params._sortDir;
      // Query parameters
      if (params._filters) {
        if (what != 'events') params['query.match_type'] = 'substr,icase';  // sea-lion private parameter to allow partial match functionality
        for (var filter in params._filters) {
          params[filter] = params._filters[filter];
        }
        delete params._filters;
      }
    }
    return { params: params };
  });
}]);

// Use NMOS error response body

const HttpErrorDecorator = ($delegate, $translate, notification) => {
    $delegate.errorMessage = error => {
        return {
            message: undefined === error.data ? '' :
                error.data.error + ' (' + error.data.code + ')'
                + (error.data.debug ? '<br/>' + error.data.debug : '')
        };
    };

    $delegate.handle403Error = error => {
        $translate('STATE_FORBIDDEN_ERROR', $delegate.errorMessage(error)).then($delegate.displayError);
        throw error;
    };

    $delegate.handleDefaultError = error => {
        $translate('STATE_CHANGE_ERROR', $delegate.errorMessage(error)).then($delegate.displayError);
        throw error;
    };

	  return $delegate;
}

HttpErrorDecorator.$inject = ['$delegate', '$translate', 'notification'];
myApp.decorator('HttpErrorService', HttpErrorDecorator);
