import React from 'react';
import { Layout } from 'react-admin';
import NestedList from './pages/menu';
import AppBar from './pages/appbar';

const MyLayout = props => (
    <Layout {...props} menu={NestedList} appBar={AppBar} />
);

export default MyLayout;
