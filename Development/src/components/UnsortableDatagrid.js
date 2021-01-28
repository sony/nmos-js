import React from 'react';
import { Datagrid } from 'react-admin';

export const UnsortableDatagrid = ({ children, ...props }) => (
    <Datagrid {...props}>
        {React.Children.map(children, child =>
            React.cloneElement(child, { sortable: false })
        )}
    </Datagrid>
);

export default UnsortableDatagrid;
