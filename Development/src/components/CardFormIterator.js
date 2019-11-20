import React, {
    Children,
    Component,
    cloneElement,
    isValidElement,
} from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { Card, CardContent, Grid } from '@material-ui/core';
import { FormInput } from 'react-admin';
// Derived from react-admin component
export class CardFormIterator extends Component {
    constructor(props) {
        super(props);
        // we need a unique id for each field for a proper enter/exit animation
        // but redux-form doesn't provide one (cf https://github.com/erikras/redux-form/issues/2735)
        // so we keep an internal map between the field position and an autoincrement id
        this.nextId = props.fields.length
            ? props.fields.length
            : props.defaultValue
            ? props.defaultValue.length
            : 0;

        // We check whether we have a defaultValue (which must be an array) before checking
        // the fields prop which will always be empty for a new record.
        // Without it, our ids wouldn't match the default value and we would get key warnings
        // on the CssTransition element inside our render method
        this.ids = this.nextId > 0 ? Array.from(Array(this.nextId).keys()) : [];
    }

    render() {
        const {
            basePath,
            children,
            fields,
            record,
            resource,
            source,
        } = this.props;
        const records = get(record, source);
        return fields ? (
            <div>
                <br style={{ lineHeight: 2 }} />
                <Grid container>
                    {fields.map((member, index) => (
                        <div key={index}>
                            <Grid item sm>
                                <Card>
                                    <CardContent>
                                        {Children.map(
                                            children,
                                            (input, index2) =>
                                                isValidElement(input) ? (
                                                    <FormInput
                                                        basePath={
                                                            input.props
                                                                .basePath ||
                                                            basePath
                                                        }
                                                        input={cloneElement(
                                                            input,
                                                            {
                                                                source: input
                                                                    .props
                                                                    .source
                                                                    ? `${member}.${input.props.source}`
                                                                    : member,
                                                                index: input
                                                                    .props
                                                                    .source
                                                                    ? undefined
                                                                    : index2,
                                                                label:
                                                                    input.props
                                                                        .label ||
                                                                    input.props
                                                                        .source,
                                                            }
                                                        )}
                                                        record={
                                                            (records &&
                                                                records[
                                                                    index
                                                                ]) ||
                                                            {}
                                                        }
                                                        resource={resource}
                                                    />
                                                ) : null
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </div>
                    ))}
                </Grid>
            </div>
        ) : null;
    }
}

CardFormIterator.propTypes = {
    defaultValue: PropTypes.any,
    basePath: PropTypes.string,
    children: PropTypes.node,
    classes: PropTypes.object,
    className: PropTypes.string,
    fields: PropTypes.object,
    meta: PropTypes.object,
    record: PropTypes.object,
    source: PropTypes.string,
    resource: PropTypes.string,
};
