import ReactDOM from 'react-dom/client';
import {createContext, useEffect, useState} from 'react';
import {CookiesProvider} from "react-cookie";
import './index.css';
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import DeviceConnect from "./client/DeviceConnect";
import NCAController from "./client/NCAController";
import DevApp from "./client/DevApp";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import getDevices from "./backend/DeviceProvider";

export const DeviceContext = createContext({}); // Device list from registry

// Mirrors the nmos-js react-admin palette (Development/src/config.json) so the
// IS-12 browser reads as the same product when launched from the main app.
const appTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: 'rgb(45,117,199)',
            contrastText: '#fff',
        },
        secondary: {
            main: 'rgb(0,47,103)',
            contrastText: '#fff',
        },
        background: {
            default: '#fafafa',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    },
    components: {
        // react-admin renders its app bar with the secondary colour by default.
        MuiAppBar: {
            defaultProps: {
                color: 'secondary',
            },
        },
        MuiCard: {
            defaultProps: {
                variant: 'outlined',
            },
        },
    },
});

function Index(props) {
    const {config} = props;
    const [devices, setDevices] = useState([])

    const deviceLabelFromUrl = new URLSearchParams(window.location.search).get('label');
    const deviceLabel = deviceLabelFromUrl ? decodeURIComponent(deviceLabelFromUrl) : null;

    let showClassManager = false
    if ("showClassManager" in config) {
        showClassManager = config.showClassManager
    }

    const controlInterfaceUriFromUrl = new URLSearchParams(window.location.search).get('uri');
    const controlInterfaceUri = controlInterfaceUriFromUrl ? decodeURIComponent(controlInterfaceUriFromUrl) : null;

    useEffect(() => {
        if (!controlInterfaceUri || devices.length > 0) return;

        getDevices(controlInterfaceUri)
            .then((deviceList) => {
                if (deviceList.length > 0) {
                    setDevices(deviceList);
                } else {
                    alert('Invalid control interface URI...');
                }
            })
            .catch((err) => {
                alert(`Could not connect to ${controlInterfaceUri}`);
                console.error('Problem encountered: ', err);
            });
    }, [controlInterfaceUri, devices.length]);

    if (controlInterfaceUri) {
        return (
            <ThemeProvider theme={appTheme}>
                <CookiesProvider>
                    <DeviceContext.Provider value={{devices, setDevices}}>
                        {devices.length > 0 ? <NCAController devices={devices} debug={config.debug} showClassManager={showClassManager} deviceLabel={deviceLabel}/> : <></>}
                    </DeviceContext.Provider>
                </CookiesProvider>
            </ThemeProvider>
        )
    }

    if (config.address !== undefined && config.port !== undefined) {
        const connectionURL = `${config.address}:${config.port}`;

        if (devices.length === 0) {

            /* Get devices from registry */
            getDevices(connectionURL)
                .then((deviceList) => {

                    if (deviceList.length > 0) {
                        setDevices(deviceList);

                    } else {
                        alert('Connected to registry but no devices found...')

                    }

                }).catch((err) => {

                alert(`Could not connect to ${connectionURL}`);
                console.error('Problem encountered: ', err);

            });
        }

        return (
            <ThemeProvider theme={appTheme}>
                <CookiesProvider>
                    <DeviceContext.Provider value={{devices, setDevices}}>
                        {devices.length > 0 ? <NCAController devices={devices} debug={config.debug} showClassManager={showClassManager} deviceLabel={deviceLabel}/> : <></>}
                    </DeviceContext.Provider>
                </CookiesProvider>
            </ThemeProvider>
        )

    } else {

        return (
            <ThemeProvider theme={appTheme}>
                <CookiesProvider>
                    <DeviceContext.Provider value={{devices, setDevices}}>
                        <BrowserRouter>
                            <Routes>
                                {/* ROUTER FOR NAVIGATION */}
                                <Route index element={<DeviceConnect useApp={config.useApp}/>}/>
                                <Route path="/main-app"
                                       element={devices.length > 0 ?
                                           <NCAController devices={devices} debug={config.debug} showClassManager={showClassManager} deviceLabel={deviceLabel}/> :
                                           <Navigate to={"/"}/>}/>
                                <Route path="/dev-app" element={devices.length > 0 ? <DevApp/> : <Navigate to={"/"}/>}/>
                            </Routes>
                        </BrowserRouter>
                    </DeviceContext.Provider>
                </CookiesProvider>
            </ThemeProvider>
        )
    }
}


/* Needs to fetch config like this to automatically re-load doc when config changes */
const getConfig = async () => {
    return await fetch('./config.json')
        .then((response) => {

            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }

            return response.json()

        })
}

/* Fetching the config.json file and then rendering the Index component with the config as a prop. */
getConfig().then((config) => {

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<Index config={config}/>);

})


