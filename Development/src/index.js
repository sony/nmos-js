import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { AppThemeProvider } from './theme/ThemeContext';

ReactDOM.render(
    <AppThemeProvider>
        <App />
    </AppThemeProvider>,
    document.getElementById('root')
);
registerServiceWorker();
