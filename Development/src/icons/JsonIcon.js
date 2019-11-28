let _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
    value: true,
});
exports.default = void 0;

const _react = _interopRequireDefault(require('react'));

const _createSvgIcon = _interopRequireDefault(
    require('@material-ui/icons/utils/createSvgIcon')
);

const _default = (0, _createSvgIcon.default)(
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
