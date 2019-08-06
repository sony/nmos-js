var _interopRequireDefault = require('../../node_modules/@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
    value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _createSvgIcon = _interopRequireDefault(
    require('../../node_modules/@material-ui/icons/utils/createSvgIcon')
);

var _default = (0, _createSvgIcon.default)(
    _react.default.createElement(
        'g',
        null,
        _react.default.createElement(
            'style',
            null,
            '.txt { font-size: 14px; font-family: monospace; }'
        ),
        _react.default.createElement(
            'text',
            {
                x: 0,
                y: 15,
                className: 'txt',
            },
            '{\u2026}'
        )
    ),
    'json'
);

exports.default = _default;
