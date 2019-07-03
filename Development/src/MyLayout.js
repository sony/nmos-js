import React from 'react';
import { Layout } from 'react-admin';
import NestedList from './pages/menu';

const MyLayout = props => <Layout {...props} menu={NestedList} />;

export default MyLayout;
