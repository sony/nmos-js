import React from 'react';
import { ThemeProvider } from '@material-ui/styles';
import {
    createMuiTheme,
    fade,
    responsiveFontSizes,
} from '@material-ui/core/styles';
import { decomposeColor } from '@material-ui/core/styles/colorManipulator';
import { get } from 'lodash';
import CONFIG from '../config.json';
import { disabledSetting, useJSONSetting } from '../settings';

const alphaOf = color => {
    const { type, values } = decomposeColor(color);
    return type === 'rgba' || type === 'hsla' ? values[3] : 1;
};

export const ThemeContext = React.createContext({
    theme: 'light',
    toggleTheme: () => {},
});

export const AppThemeProvider = ({ children }) => {
    const themePalette = get(CONFIG, 'palette', {
        primary: {
            main: 'rgb(45,117,199)',
            contrastText: '#fff',
        },
        secondary: {
            main: 'rgb(0,47,103)',
            contrastText: '#fff',
        },
    });
    const [themeState, setThemeState] = useJSONSetting('theme', {
        type: 'light',
    });

    const paletteInput = {
        info: { main: get(themePalette, 'primary.main') },
        ...themePalette,
        type: themeState.type,
    };
    const { palette } = createMuiTheme({ palette: paletteInput });
    const isDark = palette.type === 'dark';
    const infoInk = isDark ? palette.info.light : palette.info.dark;
    const theme = responsiveFontSizes(
        createMuiTheme({
            palette: paletteInput,
            sidebar: {
                width: 240,
                closedWidth: 72,
            },
            overrides: {
                MuiAlert: {
                    // Lab's standardInfo uses darken(info, 0.9) fill in dark
                    // mode and darken(info, 0.6) text in light mode. Follow
                    // the palette instead: selected-action alpha for the
                    // wash, info.light / info.dark for the ink.
                    standardInfo: {
                        backgroundColor: fade(
                            palette.info.main,
                            alphaOf(palette.action.selected)
                        ),
                        color: infoInk,
                        '& $icon': {
                            color: isDark ? infoInk : palette.info.main,
                        },
                    },
                },
                MuiTableCell: {
                    sizeSmall: {
                        '&:last-child': {
                            paddingRight: null,
                        },
                    },
                },
                RaReferenceField: {
                    link: {
                        color: null,
                        textDecoration: null,
                    },
                },
            },
        })
    );

    const toggleTheme = () => {
        if (disabledSetting('theme')) return;
        const toggledType = themeState.type === 'light' ? 'dark' : 'light';
        setThemeState({ type: toggledType });
    };

    return (
        <ThemeContext.Provider value={{ theme: themeState.type, toggleTheme }}>
            <ThemeProvider theme={theme}>
                {React.cloneElement(children, { theme })}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
