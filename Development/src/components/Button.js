Object.defineProperty(exports, '__esModule', {
    value: true,
});

const _defineProperty2 = require('babel-runtime/helpers/defineProperty');

const _defineProperty3 = _interopRequireDefault(_defineProperty2);

const _extends2 = require('babel-runtime/helpers/extends');

const _extends3 = _interopRequireDefault(_extends2);

const _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

const _objectWithoutProperties3 = _interopRequireDefault(
    _objectWithoutProperties2
);

const _react = require('react');

const _react2 = _interopRequireDefault(_react);

const _propTypes = require('prop-types');

const _propTypes2 = _interopRequireDefault(_propTypes);

const _compose = require('recompose/compose');

const _compose2 = _interopRequireDefault(_compose);

const _Button = require('@material-ui/core/Button');

const _Button2 = _interopRequireDefault(_Button);

const _Tooltip = require('@material-ui/core/Tooltip');

const _Tooltip2 = _interopRequireDefault(_Tooltip);

const _IconButton = require('@material-ui/core/IconButton');

const _IconButton2 = _interopRequireDefault(_IconButton);

const _styles = require('@material-ui/core/styles');

const _classnames2 = require('classnames');

const _classnames3 = _interopRequireDefault(_classnames2);

const _raCore = require('ra-core');

const _Responsive = require('ra-ui-materialui/esm/layout/Responsive');

const _Responsive2 = _interopRequireDefault(_Responsive);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const styles = {
    button: {
        display: 'inline-flex',
        alignItems: 'center',
    },
    label: {
        paddingLeft: '0.5em',
    },
    labelRightIcon: {
        paddingRight: '0.5em',
    },
    smallIcon: {
        fontSize: 20,
    },
    mediumIcon: {
        fontSize: 22,
    },
    largeIcon: {
        fontSize: 24,
    },
};

const Button = function Button(_ref) {
    let _classnames;

    const _ref$alignIcon = _ref.alignIcon,
        alignIcon = _ref$alignIcon === undefined ? 'left' : _ref$alignIcon,
        children = _ref.children,
        _ref$classes = _ref.classes,
        classes = _ref$classes === undefined ? {} : _ref$classes,
        className = _ref.className,
        _ref$color = _ref.color,
        color = _ref$color === undefined ? 'primary' : _ref$color,
        label = _ref.label,
        _ref$size = _ref.size,
        size = _ref$size === undefined ? 'small' : _ref$size,
        translate = _ref.translate,
        rest = (0, _objectWithoutProperties3.default)(_ref, [
            'alignIcon',
            'children',
            'classes',
            'className',
            'color',
            'label',
            'size',
            'translate',
        ]);
    return _react2.default.createElement(_Responsive2.default, {
        small: _react2.default.createElement(
            _Tooltip2.default,
            { title: label && translate(label, { _: label }) },
            _react2.default.createElement(
                _IconButton2.default,
                (0, _extends3.default)(
                    {
                        'arial-label': label && translate(label, { _: label }),
                        className: className,
                        color: color,
                    },
                    rest
                ),
                children
            )
        ),
        medium: _react2.default.createElement(
            _Button2.default,
            (0, _extends3.default)(
                {
                    className: (0, _classnames3.default)(
                        classes.button,
                        className
                    ),
                    color: color,
                    size: size,
                },
                rest
            ),
            alignIcon === 'left' &&
                children &&
                _react2.default.cloneElement(children, {
                    className: classes[size + 'Icon'],
                }),
            _react2.default.createElement(
                'span',
                {
                    className: (0, _classnames3.default)(
                        ((_classnames = {}),
                        (0, _defineProperty3.default)(
                            _classnames,
                            classes.label,
                            alignIcon === 'left'
                        ),
                        (0, _defineProperty3.default)(
                            _classnames,
                            classes.labelRightIcon,
                            alignIcon !== 'left'
                        ),
                        _classnames)
                    ),
                },
                label && translate(label, { _: label })
            ),
            alignIcon === 'right' &&
                children &&
                _react2.default.cloneElement(children, {
                    className: classes[size + 'Icon'],
                })
        ),
    });
};

Button.propTypes = {
    alignIcon: _propTypes2.default.string,
    children: _propTypes2.default.element,
    classes: _propTypes2.default.object,
    className: _propTypes2.default.string,
    color: _propTypes2.default.string,
    label: _propTypes2.default.string,
    size: _propTypes2.default.string,
    translate: _propTypes2.default.func.isRequired,
};

let enhance = (0, _compose2.default)(
    (0, _styles.withStyles)(styles),
    _raCore.translate
);

exports.default = enhance(Button);
module.exports = exports['default'];
