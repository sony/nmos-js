function template(
    { template },
    opts,
    { imports, componentName, props, jsx, exports }
) {
    jsx.openingElement.name.name = 'SvgIcon';
    jsx.closingElement.name.name = 'SvgIcon';
    jsx.openingElement.attributes.push({
        type: 'JSXSpreadAttribute',
        argument: {
            type: 'Identifier',
            name: 'props',
        },
    });
    return template.ast`
    ${imports}
    import { SvgIcon } from '@material-ui/core';
    const ${componentName} = (${props}) => ${jsx}
    ${exports}
  `;
}
module.exports = template;
