import React, { Children, cloneElement, isValidElement } from 'react';
import { Datagrid } from 'react-admin';

export const UnsortableDatagrid = ({ children, ...props }) => (
    <Datagrid {...props}>
        {Children.map(
            children,
            child =>
                isValidElement(child) &&
                cloneElement(child, { sortable: false })
        )}
    </Datagrid>
);

export default UnsortableDatagrid;
