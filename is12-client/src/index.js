import ReactDOM from 'react-dom/client';
import {createContext, useState} from 'react';
import {CookiesProvider} from "react-cookie";
import './index.css';
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import DeviceConnect from "./client/DeviceConnect";
import NCAController from "./client/NCAController";
import DevApp from "./client/DevApp";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import getDevices from "./backend/DeviceProvider";

export const DeviceContext = createContext({}); // Device list from registry

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

function Index(props) {
    const {config} = props;
    const [devices, setDevices] = useState([])

    let showClassManager = false
    if ("showClassManager" in config) {
        showClassManager = config.showClassManager
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
            <ThemeProvider theme={darkTheme}>
                <CookiesProvider>
                    <DeviceContext.Provider value={{devices, setDevices}}>
                        {devices.length > 0 ? <NCAController devices={devices} debug={config.debug} showClassManager={showClassManager}/> : <></>}
                    </DeviceContext.Provider>
                </CookiesProvider>
            </ThemeProvider>
        )

    } else {

        return (
            <ThemeProvider theme={darkTheme}>
                <CookiesProvider>
                    <DeviceContext.Provider value={{devices, setDevices}}>
                        <BrowserRouter>
                            <Routes>
                                {/* ROUTER FOR NAVIGATION */}
                                <Route index element={<DeviceConnect useApp={config.useApp}/>}/>
                                <Route path="/main-app"
                                       element={devices.length > 0 ?
                                           <NCAController devices={devices} debug={config.debug} showClassManager={showClassManager}/> :
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


