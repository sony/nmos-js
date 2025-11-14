/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * Device Connect:
 *  Web Page used for connecting the user to the registry and fetching registry devices
 */

import React, {useContext, useEffect, useState} from 'react';
import {useCookies} from 'react-cookie';
import {DeviceContext} from '../index.js'
import './DeviceConnect.css';
import Button from '@mui/material/Button';
import getDevices from '../backend/DeviceProvider';
import {useNavigate} from 'react-router-dom';


//region defaults
const address = {
    address: '',
    port: 0
}
//endregion

export default function DeviceConnect(props) {
    //region Hooks
    const useApp = props.useApp;
    const {setDevices} = useContext(DeviceContext);
    const navigate = useNavigate();
    const [cookies, setCookie, removeCookie] = useCookies();
    const [registryAddress, setRegistryAddress] = React.useState(address);
    const [tempRegistryAddress, setTempRegistryAddress] = React.useState({address: cookies.ip, port: cookies.port});
    const [checkbox, setCheckbox] = useState(false);
    //endregion


    //region Custom Hooks
    //Custom Hook for debouncing to optimise calls (will prevent bouncing aka constant updating when typing
    const useDebounce = (value, delay) => {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            const timeout = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => clearTimeout(timeout);
        }, [delay, value]);
        return debouncedValue
    }
    //endregion

    //region Constants
    //const connectionURL = `${registryAddress.address}:${registryAddress.port}`;
    const connectionURL = `${registryAddress.address}`;
    const debouncedValue = useDebounce(tempRegistryAddress, 300)
    //endregion

    //region Reactions
    React.useEffect(() => {
        //removeCookie('agreement') // FOR RESETTING COOKIES
        if (cookies.agreement !== 'true') {
            for (let cookiesKey in cookies) {
                if (cookiesKey !== 'agreement')
                    removeCookie(cookiesKey);
            }
            setTempRegistryAddress({address: 'localhost', port: '10000'})
            return;
        }

        if (!cookies.ip) setCookie('ip', 'localhost', {path: '/'})
        if (!cookies.port) setCookie('port', '10000', {path: '/'})
        setTempRegistryAddress({address: cookies.ip, port: cookies.port})

    }, [cookies, removeCookie, setCookie]) // TODO deps might cause bug...

    React.useEffect(() => { // Debouncing registry address
        setRegistryAddress(debouncedValue)
    }, [debouncedValue])

    //#endregion

    //region Function
    const setRegistryCookies = () => {
        if (cookies.agreement === 'true') {
            setCookie('ip', registryAddress.address, {path: '/'});
            setCookie('port', registryAddress.port, {path: '/'});
        }
    };
    //endregion

    //region REACTIVE COMPONENTS
    const HandleCookies = () => {
        if (cookies.agreement !== undefined)
            return (<></>);

        return (
            <div className='cookies'>
                Keep cookies?
                <input
                    type='checkbox'
                    onChange={e => {
                        setCheckbox(e.target.checked)
                    }}
                />
                <Button
                    onClick={() => {
                        setCookie('agreement', checkbox, {path: '/'});
                    }}
                > Submit </Button>
            </div>
        )

    }
    //endregion

    //region REACTIVE COMPONENT

    // TODO: Bug - sometimes default port becomes 0
    return (
        <>
            {HandleCookies()}
            <div className={'basic'}>
                Control Protocol Websocket URL:
                <input
                    type='text'
                    size='80'
                    style={{height: '2rem', width: '100%', fontSize: '1.5rem'}}
                    defaultValue={tempRegistryAddress.address ?? 'ws://localhost'}
                    onChange={e => setTempRegistryAddress({
                        address: e.target.value,
                        port: tempRegistryAddress.port
                    })}
                />
                <Button
                    onClick={() => {
                        setRegistryCookies()
                        getDevices(connectionURL).then((deviceList) => {
                            if (deviceList.length > 0) {
                                setDevices(deviceList);
                                if (useApp === "mainApp")
                                    navigate('/main-app');
                                else if (useApp === "devApp")
                                    navigate('/dev-app');
                                else
                                    throw Error("No app selected in config!")
                            } else {
                                alert('Connected to registry but no devices found...')
                            }
                        }).catch((err) => {
                            alert(`Could not connect to ${connectionURL}`);
                            console.error('Problem encountered: ', err);
                        });
                    }}
                > Connect </Button>
            </div>
        </>
    )
    //endregion
}
