import omit from 'lodash/omit';

const sanitizeRestProps = props =>
    omit(props, [
        'addLabel',
        'allowEmpty',
        'basePath',
        'cellClassName',
        'className',
        'formClassName',
        'headerClassName',
        'helperText',
        'label',
        'linkType',
        'link',
        'locale',
        'record',
        'resource',
        'sortable',
        'sortBy',
        'source',
        'textAlign',
        'translateChoice',
    ]);

export default sanitizeRestProps;
