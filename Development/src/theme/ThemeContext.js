import React from 'react';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import { lightBlue } from '@material-ui/core/colors';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

const ThemeToggleContext = React.createContext('light');
export const useTheme = () => React.useContext(ThemeToggleContext);

export const AppThemeProvider = ({ children }) => {
    const [themeState, setThemeState] = React.useState({
        mode: cookies.get('theme'),
    });
    if (themeState.mode === undefined) setThemeState({ mode: 'light' });

    const theme = createMuiTheme({
        palette: {
            primary: lightBlue,
            secondary: lightBlue,
            type: themeState.mode,
        },
    });

    const toggleTheme = () => {
        const mode = themeState.mode === 'light' ? `dark` : `light`;
        cookies.set('theme', mode);
        setThemeState({ mode: mode });
    };

    return (
        <ThemeToggleContext.Provider value={{ toggle: toggleTheme }}>
            <ThemeProvider theme={theme}>
                {React.cloneElement(children, { theme: theme })}
            </ThemeProvider>
        </ThemeToggleContext.Provider>
    );
};

export default AppThemeProvider;
