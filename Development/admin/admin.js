"use strict";

// See https://github.com/marmelab/admin-config/blob/master/src/Utils/stringUtils.js
function camelCase(text) {
  if (!text) {
    return text;
  }

  let f = text.charAt(0).toUpperCase();
  text = f + text.substr(1);

  return text.replace(/[-_.\s](.)/g, function (match, group1) {
    return ' ' + group1.toUpperCase();
  });
}

// Construct a URL for the Query API from its mDNS record
function getQueryUrl(values) {
  // address may be null if the host wasn't resolved
  if (!values.address) {
    return '';
  }
  // just picks out the last api_ver
  return values['txt.api_proto'] + '://' + (values.address.indexOf(':') == -1 ? values.address : '[' + values.address + ']') + ':' + values.port + '/x-nmos/query/' + values['txt.api_ver'].substr(-4) + '/';
};

var myApp = angular.module('myApp', ['ng-admin', 'angularUserSettings']);

myApp.config(['NgAdminConfigurationProvider', function (nga) {

  // Application, mostly just using the Query API (by default, on the same host as this Admin UI, but loaded from $userSettings at run-time)
  // Logging API is on a different port on the same host

  var adminHost = window.location.hostname || "localhost";
  var mdnsPort = 3214;
  var queryPort = 3211;
  var loggingPort = 5106;

  var mdnsUrl = 'http://' + adminHost + ':' + mdnsPort + '/x-mdns/';
  var queryUrl = 'http://' + adminHost + ':' + queryPort + '/x-nmos/query/v1.2/';
  var loggingUrl = 'http://' + adminHost + ':' + loggingPort + '/log/';

  var admin = nga.application('sea-lion').baseApiUrl(queryUrl);

  // my modern CSS voodoo is sorely lacking
  admin.header(
    '<div class="navbar-header ng-scope">' +
      '<img src="./images/sea-lion.png" style="height:50px" alt="This project was formerly known as sea-lion."/>' +
      '<a class="navbar-brand" style="float:none" href="#" ng-click="appController.displayHome()">' +
        'An NMOS Client in JavaScript' +
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
  var logs = nga.entity('events').label('Logs').baseApiUrl(loggingUrl).readOnly();
  var queryApis = nga.entity('_nmos-query._tcp').label('Query APIs').baseApiUrl(mdnsUrl).readOnly();

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

  const INTERLACE_MODE_CHOICES = [
    { value: 'progressive', label: 'Progressive' },
    { value: 'interlaced_tff', label: 'Interlaced, top field first' },
    { value: 'interlaced_bff', label: 'Interlaced, bottom field first' },
    { value: 'interlaced_psf', label: 'Progressive segmented frame' }
  ];

  const COLORSPACE_CHOICES = [
    { value: 'BT601', label: 'ITU-R Recommendation BT.601 (SD)' },
    { value: 'BT709', label: 'ITU-R Recommendation BT.709 (HD)' },
    { value: 'BT2020', label: 'ITU-R Recommendation BT.2020 (UHD)' },
    { value: 'BT2100', label: 'ITU-R Recommendation BT.2100 (HDR)' }
  ];

  const TRANSFER_CHARACTERISTIC_CHOICES = [
    { value: 'SDR', label: 'SDR (Standard Dynamic Range)' },
    { value: 'HLG', label: 'HLG (Hybrid Log-Gamma)' },
    { value: 'PQ', label: 'PQ (Perceptual Quantizer)' }
  ];

  const FILTER_TEMPLATE =
    `<div class="input-group">
      <input type="text" ng-model="value" placeholder="{{field._label == null ? field._name.substr(0,1).toUpperCase() + field._name.substr(1) : field._label}}" class="form-control"></input>
      <span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>
    </div>`;

  const RESOURCE_TITLE_EXPRESSION = 
    "entry.values.label != '' ? entry.values.label : entry.values.id + '(unlabelled)'";

  const RESOURCE_TITLE_TEMPLATE =
    `{{${RESOURCE_TITLE_EXPRESSION}}}`;

  // This should be done by creating a custom field view and overriding 'json' type
  // See https://github.com/marmelab/ng-admin/blob/master/doc/Custom-types.md#overriding-existing-types
  const PRETTY_JSON_TEMPLATE =
    `<ma-pretty-json-column value="::value"></ma-pretty-json-column>`;

  const URL_VALUE_TEMPLATE =
    '<a href="{{value}}">{{value}}</a>';

  const RATIONAL_VALUE_EXPRESSION =
    'value.numerator + \':\' + value.denominator';

  const RATIONAL_VALUE_TEMPLATE =
    `<span ng-if="value">{{${RATIONAL_VALUE_EXPRESSION}}}</span>`;

  function horizontalRuleField() {
    return nga.field('').template('<div class="col-lg-12 form-group"><hr/></div>', true);
  }

  function resourceCoreFields() {
    return [
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('version').template('{{value}} ({{sn = value.split(":", 2); (1e3 * sn[0] + sn[1] / 1e6) | date: "yyyy-MM-dd HH:mm:ss.sss"}})'),
      nga.field('label'),
      nga.field('description'),
      nga.field('tags', 'json').template(PRETTY_JSON_TEMPLATE),
      horizontalRuleField()
    ];
  }

  const RESOURCE_TARGET_FIELD =
    nga.field('label').isDetailLink(true).sortable(false).template(
      `<a ui-sref="{{detailState}}(detailStateParams)">
        <ma-string-column value="${RESOURCE_TITLE_EXPRESSION}"></ma-string-column>
      </a>`
    );

  function resourceTitleTemplate(resourceType) {
    return resourceType + ": " + RESOURCE_TITLE_TEMPLATE;
  }

  function spanIf(format, mediaType, content) {
    const span =
      '<span ' +
        'ng-if="' +
          'entry.values.format == \'' + format + '\'' +
          (mediaType !== undefined ? ' && entry.values.media_type == \'' + mediaType + '\'' : '') +
        '">' +
        content +
      '</span>';
    return span;
  }

  function showItemTemplate(format, mediaType) {
    return spanIf(
      format,
      mediaType,
      '<ma-show-item field="::field" entry="::entry" entity="::showController.entity" datastore="::showController.dataStore"></ma-show-item>'
    );
  }

  function showPrettyJsonItemTemplate(format, mediaType) {
    return spanIf(
      format,
      mediaType,
      // expand ma-show-item with ma-pretty-json-column of expression
      `<div class="col-lg-12 form-group">
          <label class="col-sm-2 control-label">{{ field.label() | translate }}</label>
          <div class="show-value" ng-class="(field.getCssClasses(entry) || 'col-sm-10 col-md-8 col-lg-7')">
              <div ng-class="::'ng-admin-field-' + field.name() + ' ' + 'ng-admin-type-json'">
                  <ma-pretty-json-column value="entry.values[field.name()]"></ma-pretty-json-column>
              </div>
          </div>
      </div>`
    );
  }

  function showStringItemTemplate(expression, format, mediaType) {
    return spanIf(
      format,
      mediaType,
      // expand ma-show-item with ma-string-column of expression
      `<div class="col-lg-12 form-group">
          <label class="col-sm-2 control-label">{{ field.label() | translate }}</label>
          <div class="show-value" ng-class="(field.getCssClasses(entry) || 'col-sm-10 col-md-8 col-lg-7')">
              <div ng-class="::'ng-admin-field-' + field.name() + ' ' + 'ng-admin-type-string'">
                  <ma-string-column value="value = entry.values[field.name()]; ${expression}"></ma-string-column>
              </div>
          </div>
      </div>`
    );
  }

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
      nga.field('api.versions', 'json').template(PRETTY_JSON_TEMPLATE).label('Node API Versions')
        .pinned(false)
        .template(FILTER_TEMPLATE),
      nga.field('id').label('ID')
        .pinned(false)
        .template(FILTER_TEMPLATE)
    ]);

  // Node show view

  nodes.showView()
    .title(resourceTitleTemplate('Node'))
    .fields([
      resourceCoreFields(),
      nga.field('href').template(URL_VALUE_TEMPLATE).label('Address'),
      nga.field('hostname'),
      nga.field('api.versions', 'json').template(PRETTY_JSON_TEMPLATE).label('Node API Versions'),
      nga.field('api.endpoints', 'json').template(PRETTY_JSON_TEMPLATE).label('Node API Address Fragments'),
      nga.field('caps', 'json').template(PRETTY_JSON_TEMPLATE).label('Capabilities'), // (not yet defined)
      nga.field('services', 'json').template(PRETTY_JSON_TEMPLATE),
      nga.field('clocks', 'json').template(PRETTY_JSON_TEMPLATE),
      nga.field('interfaces', 'json').template(PRETTY_JSON_TEMPLATE),
      horizontalRuleField(),
      nga.field('devices', 'referenced_list')
        .targetEntity(devices)
        .targetReferenceField('node_id')
        .targetFields([RESOURCE_TARGET_FIELD])
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
    .title(resourceTitleTemplate('Device'))
    .fields([
      resourceCoreFields(),
      nga.field('type', 'choice').choices(TYPE_CHOICES),
      nga.field('node_id', 'reference')
        .targetEntity(nodes)
        .targetField(nga.field('label'))
        .label('Node'),
      // 'senders' and 'receivers' are being deprecated in v1.2, and easily replaced by the equivalent 'refererenced_list' fields below
      //nga.field('senders', 'reference_many')
      //  .targetEntity(senders)
      //  .targetField(RESOURCE_TARGET_FIELD),
      //nga.field('receivers', 'reference_many')
      //  .targetEntity(receivers)
      //  .targetField(RESOURCE_TARGET_FIELD),
      nga.field('controls', 'json').template(PRETTY_JSON_TEMPLATE),
      horizontalRuleField(),
      nga.field('sources', 'referenced_list')
        .targetEntity(sources)
        .targetReferenceField('device_id')
        .targetFields([RESOURCE_TARGET_FIELD]),
      nga.field('senders', 'referenced_list')
        .targetEntity(senders)
        .targetReferenceField('device_id')
        .targetFields([RESOURCE_TARGET_FIELD]),
      nga.field('receivers', 'referenced_list')
        .targetEntity(receivers)
        .targetReferenceField('device_id')
        .targetFields([RESOURCE_TARGET_FIELD])
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
    .title(resourceTitleTemplate('Source'))
    .fields([
      resourceCoreFields(),
      nga.field('grain_rate', 'json').template(RATIONAL_VALUE_TEMPLATE),
      nga.field('caps', 'json').template(PRETTY_JSON_TEMPLATE).label('Capabilities'), // (not yet defined)
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Device'),
      nga.field('parents', 'reference_many') // TODO: format this like a 'referenced_list'
        .targetEntity(sources)
        .targetField(RESOURCE_TARGET_FIELD),
      nga.field('clock_name'),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('channels', 'json').template(showPrettyJsonItemTemplate('urn:x-nmos:format:audio'), true),
      horizontalRuleField(),
      nga.field('flows', 'referenced_list')
        .targetEntity(flows)
        .targetReferenceField('source_id')
        .targetFields([RESOURCE_TARGET_FIELD])
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
    .title(resourceTitleTemplate('Flow'))
    .fields([
      resourceCoreFields(),
      nga.field('grain_rate', 'json').template(RATIONAL_VALUE_TEMPLATE),
      nga.field('source_id', 'reference')
        .targetEntity(sources)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Source'),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Device'),
      nga.field('parents', 'reference_many')
        .targetEntity(flows)
        .targetField(RESOURCE_TARGET_FIELD),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('media_type'),
      // flow_audio.json
      nga.field('sample_rate', 'json').template(showStringItemTemplate(RATIONAL_VALUE_EXPRESSION, 'urn:x-nmos:format:audio'), true),
      // flow_audio_raw.json
      nga.field('bit_depth').template(showItemTemplate('urn:x-nmos:format:audio'), true),
      // flow_sdianc_data.json
      nga.field('DID_SDID', 'json').template(showPrettyJsonItemTemplate('urn:x-nmos:format:data', 'video/smpte291'), true),
      // flow_video.json
      nga.field('frame_width').template(showItemTemplate('urn:x-nmos:format:video'), true),
      nga.field('frame_height').template(showItemTemplate('urn:x-nmos:format:video'), true),
      nga.field('interlace_mode', 'choice').choices(INTERLACE_MODE_CHOICES).template(showItemTemplate('urn:x-nmos:format:video'), true),
      nga.field('colorspace', 'choice').choices(COLORSPACE_CHOICES).template(showItemTemplate('urn:x-nmos:format:video'), true),
      nga.field('transfer_characteristic', 'choice').choices(TRANSFER_CHARACTERISTIC_CHOICES).template(showItemTemplate('urn:x-nmos:format:video'), true),
      // flow_video_raw.json
      nga.field('components', 'json').template(showPrettyJsonItemTemplate('urn:x-nmos:format:video', 'video/raw'), true),
      horizontalRuleField(),
      nga.field('senders', 'referenced_list')
        .targetEntity(senders)
        .targetReferenceField('flow_id')
        .targetFields([RESOURCE_TARGET_FIELD])
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
    .title(resourceTitleTemplate('Sender'))
    .fields([
      resourceCoreFields(),
      nga.field('caps', 'json').template(PRETTY_JSON_TEMPLATE).label('Capabilities'), // being added in v1.2
      nga.field('flow_id', 'reference')
        .targetEntity(flows)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Flow'),
      nga.field('transport', 'choice').choices(TRANSPORT_CHOICES),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Device'),
      nga.field('manifest_href').template(URL_VALUE_TEMPLATE).label('Manifest Address'),
      nga.field('interface_bindings', 'json').template(PRETTY_JSON_TEMPLATE), // being added in v1.2
      nga.field('subscription.receiver_id', 'reference') // being added in v1.2
        .targetEntity(receivers)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Receiver')
        .template('<span ng-if="null == value">Disconnected, or multicast mode</span><ma-reference-link-column ng-if="null != value" entry="::entry" field="::field" value="::value" datastore="::datastore" class="ng-scope ng-isolate-scope"/>'),
      nga.field('subscription.active', 'boolean') // being added in v1.2
        .label('Active')
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

  // Would like to have an ma-reference-field which is what is used for the editionView
  // but I haven't been able to work out how to populate the choices in the showView :-(
  // <ma-reference-field entry="entry" field="::field" value="value" datastore="::datastore"/>
  const CONNECT_TEMPLATE =
    `<div class="input-group">
      <ma-connect-field entry="entry" field="::field" value="value" datastore="::datastore"/>
      <span class="input-group-btn" style="padding-left: 12px"><ma-connect-button entry="entry" value="value" datastore="::datastore" label-connect="Connect" label-disconnect="Disconnect"/></span>
    </div>`;

  // duplicate entity required due to ng-admin bug, e.g. https://github.com/marmelab/ng-admin/issues/1207
  var targets = nga.entity('senders').readOnly();

  receivers.showView()
    .prepare(['entry', 'Restangular', 'datastore', function(entry, Restangular, datastore) {
      // make sure we're using the right base URL (receivers, senders, flows, devices, and nodes shouldn't all have different baseApiUrl() so just use admin, the app)
      var adminRestangular = Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl(admin.baseApiUrl());
      });
      // perform a kind of 'join' to find Senders that have both a transport matching this Receiver and a Flow with a matching format and media_type
      // but first, if transport is "urn:x-nmos:transport:rtp", need to get and merge Senders with the ".mcast" and ".ucast" variants
      datastore.setEntries('targets', []);
      datastore.setEntries(targets.uniqueId + '_choices', []);
      var getSenders = adminRestangular.all('senders').getList({ _filters: { transport: entry.values.transport } });
      if (entry.values.transport === 'urn:x-nmos:transport:rtp') {
        getSenders = getSenders.then((senders) => {
          return adminRestangular.all('senders').getList({ _filters: { transport: 'urn:x-nmos:transport:rtp.mcast' } }).then((mcast) => {
            senders.data.push(...mcast.data);
            return senders;
          });
        }).then((senders) => {
          return adminRestangular.all('senders').getList({ _filters: { transport: 'urn:x-nmos:transport:rtp.ucast' } }).then((ucast) => {
            senders.data.push(...ucast.data);
            return senders;
          });
        });
      }
      getSenders.then((senders) => {
        senders.data.map(sender => {
          adminRestangular.one('flows', sender.flow_id).get().then((flow) => {
            if (flow.data.format.startsWith(entry.values.format)) {
              // caps.media_types property was introduced in v1.1
              if (undefined === entry.values.caps.media_types || entry.values.caps.media_types.indexOf(flow.data.media_type) != -1) {
                datastore.addEntry('targets', sender);
                datastore.addEntry(targets.uniqueId + '_choices', { value: sender.id, label: sender.label });
              }
            }
          });
        });
      });
      adminRestangular.one('devices', entry.values.device_id).get().then((device) => {
        adminRestangular.one('nodes', device.data.node_id).get().then((node) => {
          // should use the node api version here
          datastore.addEntry('target_href', node.data.href + ('/' === node.data.href.substr(-1) ? '' : '/') + 'x-nmos/node/v1.0/receivers/' + entry.values.id + '/target');

          // device controls property was introduced in v1.1
          if (undefined !== device.data.controls) {
            var conman = device.data.controls.find((control) => { return "urn:x-nmos:control:sr-ctrl/v1.0" === control.type; });
            if (undefined !== conman) {
              datastore.addEntry('conman_href', conman.href + ('/' === conman.href.substr(-1) ? '' : '/') + 'single/receivers/' + entry.values.id + '/');
            }
          }
        });
      });
    }])
    .title(resourceTitleTemplate('Receiver'))
    .fields([
      resourceCoreFields(),
      nga.field('device_id', 'reference')
        .targetEntity(devices)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Device'),
      nga.field('transport', 'choice').choices(TRANSPORT_CHOICES),
      nga.field('interface_bindings', 'json').template(PRETTY_JSON_TEMPLATE), // being added in v1.2
      nga.field('subscription.sender_id', 'reference')
        .targetEntity(senders)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('Sender')
        .template('<span ng-if="null == value">Disconnected</span><ma-reference-link-column ng-if="null != value" entry="::entry" field="::field" value="::value" datastore="::datastore" class="ng-scope ng-isolate-scope"/>'),
      nga.field('subscription.active', 'boolean') // being added in v1.2
        .label('Active'),
      nga.field('subscription.sender_id.target', 'reference')
        .targetEntity(targets)
        .targetField(RESOURCE_TARGET_FIELD)
        .label('')
        .remoteComplete(true, { refreshDelay: 300 })
        .attributes({ placeholder: 'Select a Sender to connect...' })
        .template(CONNECT_TEMPLATE),
      nga.field('format', 'choice').choices(FORMAT_CHOICES),
      nga.field('caps', 'json').template(PRETTY_JSON_TEMPLATE).label('Capabilities')
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
      nga.field('id').isDetailLink(false).label('ID'),
      nga.field('ws_href').template(URL_VALUE_TEMPLATE).label('WebSocket Address'),
      nga.field('max_update_rate_ms', 'number').label('Max Update Rate (ms)'),
      nga.field('persist', 'boolean'),
      nga.field('secure', 'boolean'), // added in v1.1
      nga.field('resource_path'),
      nga.field('params', 'json').template(PRETTY_JSON_TEMPLATE)
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
      nga.field('route_parameters.version').label('Version'),
      nga.field('route_parameters.resourceType').label('Resource Type'),
      nga.field('route_parameters.resourceId').label('Resource ID'),
      nga.field('http_method').label('HTTP Method'),
      nga.field('request_uri').label('Request URI'),
      nga.field('source_location', 'json').template(PRETTY_JSON_TEMPLATE),
      nga.field('thread_id').label('Thread ID'),
      nga.field('id').isDetailLink(false).label('ID')
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(logs);

  // Query APIs list view

  // there's no "id" field but the name should be unique?
  queryApis.identifier(nga.field('name'));

  queryApis.listView()
    .title('Query APIs List')
    .fields([
      nga.field('name').isDetailLink(true).sortable(false),
      nga.field('address').label('Host Address').sortable(false),
      nga.field('port').sortable(false),
      nga.field('txt.api_proto').label('Protocol').sortable(false),
      nga.field('txt.api_ver').label('API Versions').sortable(false),
      nga.field('txt.pri', 'number').label('Priority').sortable(false)
    ])
    .listActions(['<ma-connect-query-api-button label="Connect" entry="::entry" size="xs"/>'])
    .actions(['<ma-reload-button label="Reload"/>']);

  // Query APIs show view

  queryApis.showView()
    .title('Query API: {{entry.values.name}}')
    .fields([
      nga.field('name'),
      nga.field('address').label('Host Address'),
      nga.field('port'),
      nga.field('txt.api_proto').label('Protocol'),
      nga.field('txt.api_ver').label('API Versions'),
      nga.field('txt.pri', 'number').label('Priority'),
      horizontalRuleField(),
      nga.field('href').template(URL_VALUE_TEMPLATE + ' <ma-connect-query-api-button label="Connect" entry="::entry" size="small"/>').label('Address').map((value, values) => { return getQueryUrl(values); })
    ])
    .actions(SHOW_VIEW_ACTIONS);

  admin.addEntity(queryApis);

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
      .addChild(nga.menu(queryApis).icon('<span class="glyphicon glyphicon-cog"></span>'))
      .addChild(nga.menu()
        .icon('<span class="glyphicon glyphicon-cog"></span>')
        .title('Miscellaneous')
        .link('/settings')
        .active(function(path) {
          return path.indexOf('/settings') === 0;
        })
      )
    )
  );

  // attach the admin application to the DOM and execute it
  nga.configure(admin);
}]);

// Custom button to connect to a Query API

myApp.directive('maConnectQueryApiButton', ['NgAdminConfiguration', '$userSettings', 'Restangular', '$location', '$state', '$translate', 'notification', function (NgAdminConfiguration, $userSettings, Restangular, $location, $state, $translate, notification) {
  return {
    restrict: 'E',
    scope: {
      entry: '=?',
      size: '@',
      label: '@'
    },
    link: function (scope, element, attrs) {
      scope.label = scope.label || 'APPLY';
      scope.connect = function () {
        var address = getQueryUrl(scope.entry.values);
        NgAdminConfiguration().baseApiUrl(address);
        $userSettings.set('queryUrl', address);

        var adminRestangular = Restangular.withConfig(function(RestangularConfigurer) {
          RestangularConfigurer.setBaseUrl(address);
        });
        adminRestangular.all('subscriptions').post({
          max_update_rate_ms: 1000,
          resource_path: "/receivers",
          params: {},
          persist: false,
          secure: false
        }).then((subscription) => {
          var querySocket = new WebSocket(subscription.data.ws_href);
          querySocket.onmessage = (event) => {
            // why is $state.includes("receivers") undefined?
            if ($location.path().startsWith("/receivers")) {
              $state.reload();
            }
          }
        });
      };
    },
    template:
      `<a class="btn btn-default" ng-class="size ? 'btn-' + size : ''" ng-click="connect()">
        <span class="glyphicon glyphicon-transfer" aria-hidden="true"></span>
        &nbsp;
        <span class="hidden-xs" translate="{{label}}"></span>
      </a>`
  };
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
  $scope.$watch('userSettings', function(newValue, oldValue) {
    console.log($scope.userSettings);
  });
};
settingsController.prototype.save = function() {
  this.notification.log('Saving settings');
  this.config().baseApiUrl(this.address);
  this.userSettings.set('queryUrl', this.address);
};
settingsController.inject = ['NgAdminConfiguration', '$stateParams', 'notification', '$userSettings'];

var settingsControllerTemplate =
  `<div class="row"><div class="col-lg-12"><div class="page-header">
    <ma-view-actions><ma-back-button></ma-back-button></ma-view-actions>
    <h1>Settings</h1>
  </div></div></div>

  <form class="form-horizontal" ng-submit="controller.save()">

    <div>
      <div class="form-field form-group">
        <label class="col-sm-2 control-label">Query API</label>
        <div class="ng-admin-type-string col-sm-10 col-md-8 col-lg-7">
          <input type="text" ng-model="controller.address" class="form-control"/>
        </div>
      </div>
    </div>

    <div class="form-group">
      <div class="col-sm-offset-2 col-sm-10">
        <ma-submit-button label="SAVE_CHANGES" class="ng-isolate-scope">
          <button type="submit" class="btn btn-primary"><span class="glyphicon glyphicon-ok"></span>&nbsp;<span class="hidden-xs ng-scope" translate="SAVE_CHANGES">Save changes</span></button>
        </ma-submit-button>
      </div>
    </div>

  </form>`;

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
myApp.directive('maConnectButton', ['$http', '$state', '$translate', 'notification', function ($http, $state, $translate, notification) {
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
        var conman_href = scope.datastore().getFirstEntry('conman_href');
        var target_href = scope.datastore().getFirstEntry('target_href');
        var sender = scope.datastore().getEntries('targets').find(sender => { return sender.id === scope.value; });

        var connect;

        if (null == conman_href) {
          console.log("Using Node API /target");
          connect = $http.put(target_href, null == sender ? {} : sender);
        }
        else {
          console.log("Using Connection Management API");
          if (null == sender) {
            // disconnect
            connect = $http.patch(conman_href + 'staged', {
                //sender_id: null,
                master_enable: false,
                activation: {
                  mode: "activate_immediate"
                }
              });
          }
          else {
            // connect
            connect = $http.get(sender.manifest_href).then((response) => {
              return $http.patch(conman_href + 'staged', {
                sender_id: sender.id,
                master_enable: true,
                activation: {
                  mode: "activate_immediate"
                },
                transport_file: {
                  type: "application/sdp",
                  data: response.data
                }
              });
            });
          }
        }

        connect.then(
//          () => { $state.reload(); },
          () => {},
          (error) => { $translate('STATE_CHANGE_ERROR',
            null == error.data ? '' :
              error.data.error + ' (' + error.data.code + ')'
              + (error.data.debug ? '<br/>' + error.data.debug : ''))
            .then((message) => notification.log(message, { addnCls: 'humane-flatty-error' })); }
          );
      };
    },
    template:
      `<a class="btn btn-default" ng-class="size ? 'btn-' + size : ''" ng-click="connect()">
        <span class="glyphicon {{0 < value.length ? 'glyphicon-ok' : 'glyphicon-remove'}}" aria-hidden="true"></span>
        &nbsp;
        <span class="hidden-xs" translate="{{0 < value.length ? labelConnect : labelDisconnect}}"></span>
      </a>`
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
      `<a class="btn btn-default" ng-class="size ? 'btn-' + size : ''" ng-click="reload()">
        <span class="glyphicon glyphicon-repeat" aria-hidden="true"></span>
        &nbsp;
        <span class="hidden-xs" translate="{{label}}"></span>
      </a>`
  };
}]);

// Custom pretty JSON column

myApp.directive('maPrettyJsonColumn', function ($compile) {
  return {
    restrict: 'E',
    scope: {
      value: '&',
    },
    link: function(scope, element) {
      scope.guessType = function(obj) {
        var type = Object.prototype.toString.call(obj);

        if (type === "[object Object]") {
          return "Object";
        }

        if (type === "[object Array]") {
          return "Array";
        }

        return "Literal";
      };

      // Haven't been able to work out how best to use 'global' utility functions like camelCase in templates (implement a service?)
      // nor to allow these templates to be passed in, with these defaults, and then pass them on recursively :-(
      scope.camelCase = camelCase;
      scope.keyTemplate = '{{camelCase(key)}}';
      scope.literalTemplate = '{{val}}';
      // So for now, 'override' here
      scope.keyTemplate = `{{key === 'gmid' ? 'GMID' : key === 'href' ? 'Address' : camelCase(key)}}`;
      scope.literalTemplate = `<a ng-if="val.startsWith('http:') || val.startsWith('https:')" href="{{val}}">{{val}}</a><span ng-if="!(val.startsWith('http:') || val.startsWith('https:'))">{{val}}</span>`;

      var template =
        `<span ng-switch="guessType(value())">
          <table class="table table-condensed" ng-switch-when="Array">
            <tbody>
              <tr ng-repeat="val in value() track by $index">
                <td ng-switch="guessType(val)">
                  <ma-pretty-json-column ng-switch-when="Object" value="::val"></ma-pretty-json-column>
                  <ma-pretty-json-column ng-switch-when="Array" value="::val"></ma-pretty-json-column>
                  <span ng-switch-when="Literal">${scope.literalTemplate}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <table class="table table-condensed table-bordered" ng-switch-when="Object">
            <tbody>
              <tr ng-repeat="(key, val) in value() track by key">
                <th class="active">${scope.keyTemplate}</th>
                <td ng-switch="guessType(val)">
                  <ma-pretty-json-column ng-switch-when="Object" value="::val"></ma-pretty-json-column>
                  <ma-pretty-json-column ng-switch-when="Array" value="::val"></ma-pretty-json-column>
                  <span ng-switch-when="Literal">${scope.literalTemplate}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </span>`;

      var newElement = angular.element(template);
      $compile(newElement)(scope);
      element.replaceWith(newElement);
    }
  }
});

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
      // Simple relationship queries using 'id' properties can be achieved without using RQL
      for (var filter in params._filters) {
        if ((filter === 'id' || filter.endsWith('_id')) && params._filters[filter].length == 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.length) {
          params[filter] = params._filters[filter];
          delete params._filters[filter];
        }
      }
    }
    return { params: params };
  });
}]);

// Restangular will URI-encode each of the params, so we need to modify the request url directly.
// However, "Restangular doesn't allow to modify the URL of an outgoing request, so in order
// to achieve that you must use an interceptor on the $http Angular service."
// See https://github.com/marmelab/ng-admin/blob/master/doc/API-mapping.md#nested-relationships-urls
myApp.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push(function() {
        return {
            request: function(config) {
                // Query parameters
                if (config.params && config.params._filters) {
                  var rql = Object.entries(config.params._filters).filter(([key, value]) => {
                    return undefined !== value;
                  }).map(([key, value]) => {
                    // for other implementations besides nmos-cpp we'd have to use "eq" or "contains" as appropriate
                    // and accept exact matching
                    return 'matches(' + encodeURIComponent(key) + ',string:' + encodeURIComponent(value) + ',i)';
                  }).join(',');
                  if (rql) {
                    config.url += '?query.rql=and(' + rql + ')';
                  }
                  delete config.params._filters;
                }
                return config;
            },
        };
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
