import React from 'react';
import CustomNamesContext from './CustomNamesContext';

export const CustomNamesContextProvider = props => (
    <CustomNamesContext.Provider {...props} />
);
export default CustomNamesContextProvider;
