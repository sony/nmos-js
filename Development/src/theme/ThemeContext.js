import React from 'react';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
import { blue, lightBlue } from '@material-ui/core/colors';

export const ThemeContext = React.createContext({
    theme: 'light',
    toggleTheme: () => {},
});

export const AppThemeProvider = ({ children }) => {
    const [themeState, setThemeState] = React.useState({
        mode: window.localStorage.getItem('theme') || 'light',
    });

    const theme = responsiveFontSizes(
        createMuiTheme({
            palette: {
                primary: lightBlue,
                secondary: blue,
                type: themeState.mode,
            },
            sidebar: {
                width: 240,
                closedWidth: 72,
            },
        })
    );

    const toggleTheme = () => {
        const mode = themeState.mode === 'light' ? `dark` : `light`;
        window.localStorage.setItem('theme', mode);
        setThemeState({ mode: mode });
    };

    return (
        <ThemeContext.Provider
            value={{ theme: themeState.mode, toggleTheme: toggleTheme }}
        >
            <ThemeProvider theme={theme}>
                {React.cloneElement(children, { theme: theme })}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
