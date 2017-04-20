// Steps to add new endpoint to admin
// 1. Create entity: var x = nga.entity('xs').readOnly();
// 2. Create list view with fields/labels/listActions/filters
// 3. Create show view with title/fields/labels/listActions/references
// 4. Add entity to admin: admin.addEntity(x);
// 5. Add menu child: .addChild(nga.menu(x).icon('<span class="glyphicon glyphicon-list"></span>'))
// 6. (optional) Add dashboard collection: .addCollection(nga.collection(x).fields(x.listView().fields()))

"use strict";

var myApp = angular.module('myApp', ['ng-admin', 'angularUserSettings']);

myApp.config(['NgAdminConfigurationProvider', function (nga) {

  // Application, mostly just using the Query API on the same host as this Admin UI

  var adminHost = window.location.hostname;
  var queryPort = 3211;
  var loggingPort = 5106;

  var admin = nga.application('sea-lion')
    .baseApiUrl('http://' + adminHost + ':' + queryPort + '/x-nmos/query/v1.0/');

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
  var logs = nga.entity('events').label('Logs').baseApiUrl('http://' + adminHost + ':' + loggingPort + '/log/').readOnly();

  // Templates and common definitions

  const LIST_VIEW_ACTIONS = [
    'filter',
    '<ma-reload-button label="Reload"/>'
  ];

  const LIST_ENTRY_ACTIONS = [
    'show'
  ];

  const SHOW_VIEW_ACTIONS = [
    'list',
    '<ma-reload-button label="Reload"/>'
  ];
  
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
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
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
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(nodes);

  // Devices list view

  devices.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('type', 'choice').sortable(false).choices(TYPE_CHOICES)
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
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
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(devices);

  // Sources list view

  sources.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices()
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
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
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(sources);

  // Flows list view

  flows.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices(FORMAT_CHOICES)
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
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
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(flows);

  // Senders list view

  senders.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('transport', 'choice').sortable(false).choices(TRANSPORT_CHOICES)
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
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
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(senders);

  // Receiver list view

  receivers.listView()
    .fields([
      nga.field('label').isDetailLink(true).sortable(false),
      nga.field('format', 'choice').sortable(false).choices(FORMAT_CHOICES),
      nga.field('transport', 'choice').sortable(false).choices(TRANSPORT_CHOICES),
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
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
      // would like to have an ma-reference-field which is what is used for the editionView
      // but I haven't been able to work out how to populate the choices in the showView :-(
      //'<ma-reference-field entry="entry" field="::field" value="value" datastore="::datastore"/>' +
      '<ma-connect-field entry="entry" field="::field" value="value" datastore="::datastore"/>' +
      '<span class="input-group-btn" style="padding-left: 12px"><ma-connect-button entry="entry" value="value" datastore="::datastore" label-connect="Connect" label-disconnect="Disconnect"/></span>' +
    '</div>';

  // duplicate entity required due to ng-admin bug, e.g. https://github.com/marmelab/ng-admin/issues/1207
  var targets = nga.entity('senders').readOnly();

  receivers.showView()
    .prepare(['entry', 'Restangular', 'datastore', function(entry, Restangular, datastore) {
      // make sure we're using the right base URL (receivers, senders, flows, devices, and nodes shouldn't all have different baseApiUrl() so just use admin, the app)
      var adminRestangular = Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl(admin.baseApiUrl());
      });
      // have to perform a kind of 'join' to find Senders that have both a transport matching this Receiver and a Flow with a matching format
      adminRestangular.all('senders').getList({ _filters: { transport: entry.values.transport } }).then((senders) => {
        senders.data.map(sender => {
          adminRestangular.one('flows', sender.flow_id).get().then((flow) => {
            if (flow.data.format.startsWith(entry.values.format)) {
              datastore.addEntry('targets', sender);
              datastore.addEntry(targets.uniqueId + '_choices', { value: sender.id, label: sender.label });
            }
          });
        });
      });
      adminRestangular.one('devices', entry.values.device_id).get().then((device) => {
        adminRestangular.one('nodes', device.data.node_id).get().then((node) => {
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
        .label('Sender')
        .template('<span ng-if="null == value">Disconnected</span><ma-reference-link-column ng-if="null != value" entry="::entry" field="::field" value="::value" datastore="::datastore" class="ng-scope ng-isolate-scope"/>'),
      nga.field('subscription.sender_id.target', 'reference')
        .targetEntity(targets)
        .targetField(nga.field('label'))
        .label('')
        .remoteComplete(true, { refreshDelay: 300 })
        .attributes({ placeholder: 'Select a Sender to connect...' })
        .template(CONNECT_TEMPLATE),
      nga.field('tags', 'json'),
      nga.field('description'),
      nga.field('caps', 'json').label('Capabilities'),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('transport', 'choice').choices(TRANSPORT_CHOICES),
      nga.field('version')
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(receivers);

  // Subscriptions list view

  subscriptions.listView()
    .fields([
      nga.field('resource_path').isDetailLink(true).sortable(false),
      nga.field('persist', 'boolean').sortable(false),
      nga.field('max_update_rate_ms', 'number').label('Max Update Rate (ms)').sortable(false),
    ])
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
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
    ])
    .actions(SHOW_VIEW_ACTIONS);

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
    .listActions(LIST_ENTRY_ACTIONS)
    .actions(LIST_VIEW_ACTIONS)
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
    ])
    .actions(SHOW_VIEW_ACTIONS);

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
    .addChild(nga.menu()
      .icon('<span class="glyphicon glyphicon-cog"></span>')
      .title('Settings')
      .link('/settings')
      .active(function(path) {
        return path.indexOf('/settings') === 0;
      }))
  );

  // attach the admin application to the DOM and execute it
  nga.configure(admin);
}]);

// Custom 'Settings' page (and initial run-time configuration)

myApp.run(['NgAdminConfiguration', '$userSettings', function (NgAdminConfiguration, $userSettings) {
  var queryUrl = $userSettings.get('queryUrl');
  if (queryUrl) {
    NgAdminConfiguration().baseApiUrl(queryUrl);
  }
}]);

function settingsController($scope, NgAdminConfiguration, $stateParams, notification, $userSettings) {
    // notification is the service used to display notifications on the top of the screen
    this.config = NgAdminConfiguration;
    this.address = this.config().baseApiUrl();
    this.notification = notification;
    this.userSettings = $userSettings;
};
settingsController.prototype.save = function() {
    this.notification.log('Saving settings');
    this.config().baseApiUrl(this.address);
    this.userSettings.set('queryUrl', this.address);
};
settingsController.inject = ['NgAdminConfiguration', '$stateParams', 'notification', '$userSettings'];

var settingsControllerTemplate =
    '<div class="row"><div class="col-lg-12"><div class="page-header">' +
        '<ma-view-actions><ma-back-button></ma-back-button></ma-view-actions>' +
        '<h1>Settings</h1>' +
    '</div></div></div>' +

    '<form class="form-horizontal" ng-submit="controller.save()">' +

        '<div>' +
            '<div class="form-field form-group">' +
                '<label class="col-sm-2 control-label">Query API</label>' +
                '<div class="ng-admin-type-string col-sm-10 col-md-8 col-lg-7">' +
                    '<input type="text" ng-model="controller.address" class="form-control"/>' +
                '</div>' +
            '</div>' +
        '</div>' +

        '<div class="form-group"><div class="col-sm-offset-2 col-sm-10"><ma-submit-button label="SAVE_CHANGES" class="ng-isolate-scope"><button type="submit" class="btn btn-primary"><span class="glyphicon glyphicon-ok"></span>&nbsp;<span class="hidden-xs ng-scope" translate="SAVE_CHANGES">Save changes</span></button></ma-submit-button></div></div>' +

    '</form>';

myApp.config(function ($stateProvider) {
    $stateProvider.state('settings', {
        parent: 'ng-admin',
        url: '/settings',
        params: { id: null },
        controller: settingsController,
        controllerAs: 'controller',
        template: settingsControllerTemplate
    });
});

// Custom directives to select and connect a Receiver to a Sender

// relies on field misusing 'reference' type and remoteComplete('true') so that the choice field actually refreshes...
myApp.directive('maConnectField', [function () {
  return {
    restrict: 'E',
    scope: {
      entry: '=?',
      field: '&',
      value: '=',
      datastore: '&?'
    },
    link: function (scope, element, attrs) {
      var field = scope.field();
      var initialChoices = scope.datastore().getEntries(field.targetEntity().uniqueId + '_choices');
      scope.$broadcast('choices:update', { choices: initialChoices });
      scope.refresh = function refresh() {
        var refreshedChoices = scope.datastore().getEntries(field.targetEntity().uniqueId + '_choices');
        scope.$broadcast('choices:update', { choices: refreshedChoices });
      };
    },
    template: '<ma-choice-field field="::field()" value="value" datastore="datastore()" refresh="refresh()"/>'
  };
}]);

// relies on 'target_href' and 'targets' being in the datastore
// could potentially use Restangular to make the request? and use the ng-admin HttpErrorService?
myApp.directive('maConnectButton', ['$http', '$state', 'notification', function ($http, $state, notification) {
  return {
    restrict: 'E',
    scope: {
      entry: '&',
      value: '=',
      datastore: '&',
      size: '@',
      labelConnect: '@',
      labelDisconnect: '@'
    },
    link: function (scope, element, attrs) {
      scope.labelConnect = scope.labelConnect || 'CONNECT';
      scope.labelDisconnect = scope.labelDisconnect || 'DISCONNECT';
      scope.connect = function () {
        var target_href = scope.datastore().getFirstEntry('target_href');
        var sender = scope.datastore().getEntries('targets').find(sender => { return sender.id === scope.value; }) || {};
        $http.put(scope.datastore().getFirstEntry('target_href'), sender)
          .then(
            () => { $state.reload(); },
            (error) => { notification.log(error.data.error, { addnCls: 'humane-flatty-error' }); }
          );
      };
    },
    template:
      '<a class="btn btn-default" ng-class="size ? \'btn-\' + size : \'\'" ng-click="connect()">' +
        '<span class="glyphicon {{0 < value.length ? \'glyphicon-ok\' : \'glyphicon-remove\'}}" aria-hidden="true"></span>' +
        '&nbsp;' +
        '<span class="hidden-xs" translate="{{0 < value.length ? labelConnect : labelDisconnect}}"></span>' +
      '</a>'
  };
}]);

// Custom reload button

myApp.directive('maReloadButton', ['$state', function ($state) {
  return {
    restrict: 'E',
    scope: {
      size: '@',
      label: '@'
    },
    link: function (scope, element, attrs) {
      scope.label = scope.label || 'RELOAD';
      scope.reload = function () {
        $state.reload();
      };
    },
    template:
      '<a class="btn btn-default" ng-class="size ? \'btn-\' + size : \'\'" ng-click="reload()">' +
        '<span class="glyphicon glyphicon-repeat" aria-hidden="true"></span>' +
        '&nbsp;' +
        '<span class="hidden-xs" translate="{{label}}"></span>' +
      '</a>'
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
