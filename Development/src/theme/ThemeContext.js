import React from 'react';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import { blue, lightBlue } from '@material-ui/core/colors';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

export const ThemeContext = React.createContext({
    theme: 'light',
    toggleTheme: () => {},
});

export const AppThemeProvider = ({ children }) => {
    const [themeState, setThemeState] = React.useState({
        mode: cookies.get('theme'),
    });
    if (themeState.mode === undefined) setThemeState({ mode: 'light' });

    const theme = createMuiTheme({
        palette: {
            primary: lightBlue,
            secondary: blue,
            type: themeState.mode,
        },
    });

    const toggleTheme = () => {
        const mode = themeState.mode === 'light' ? `dark` : `light`;
        cookies.set('theme', mode);
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
