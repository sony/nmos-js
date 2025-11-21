/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * NCA Controller:
 *  A prototype controller used for viewing data (such as IP50Y statuses) from the NCA nodes
 */

/**
 * DONE Temperature colours?
 * DONE Edit user labels on any prop
 * MBY TODO Mock node saves data
 * DONE Add historical data graph for sensor, fan-speed
 * MBY TODO Alerts when data hits value
 * DONE Enter for input
 * DONE String formatting
 */

import {Component, createContext} from 'react';
import './NCAController.css';
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';

import Tables from "./DataTables";
import DataProvider from "../middleware/DataProvider";


/* Registering the chart.js elements to the chart.js library. */
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler
);

export const _SAMPLER_SIZE = 100;
export let DataProviderContext = createContext(typeof DataProvider)

/**
 * The main program that runs the controller.
 * Has to be created as a class (unlike other components) due to dynamic state generation
 * This class uses DataProvider.ts, Sampler.ts and DataTables.js
 **/
export default class NCAController extends Component {

    //region States
    constructor(props) {
        super();
        // Gets the devices (already fetched from registry in index.js
        this.devices = props.devices;
        this.showClassManager = props.showClassManager

        if (props.debug !== undefined)
            this.debug = props.debug;
        else
            this.debug = false;

        this.wsAddress = '';

        this.state = {
            provider: new DataProvider(
                this.devices[0],
                this.debug,
                (val) => {
                    this.setState({isLoading: val})
                },
                () => {
                    this.setState({providerActive: false})
                },
                this.showClassManager
            ),
            isLoading: 'true',
            providerActive: false,
            structure: {},
        }
    }

    //endregion

    //region Functions

    componentWillUnmount() {
        this.state.provider.stopProvider()
    }

    // Pretty much useEffect
    componentDidUpdate(_prevProps, _prevState, _snapshot) {
        const state = this.state;

        // if provider already started or crashed, skip
        if (state.isLoading !== 'false' || state.providerActive || state.provider.isClosed) return;

        // Copy over provider structure to create table from and generate state functions
        const propertyMap = state.provider.getPropertyMap();

        this.wsAddress = state.provider.getWSAddress();

        let States = {}

        /* Creating a state for each property of each object in the provider. */
        for (let oid in propertyMap) {

            if (propertyMap[oid].Props === null) continue;

            // creates a local state and creates reference to it for DataProvider to use
            for (let prop in propertyMap[oid].ValueHolderMap) {

                const tmp_name = `${oid}.${prop}`;

                this.setState({[tmp_name]: propertyMap[oid].ValueHolderMap[prop].value})

                if (States[oid] === undefined) States[oid] = {}

                States[oid][prop] = (val) => {
                    this.setState({[tmp_name]: val})
                }

            }

            // Create states for method parameters
            for (let method in propertyMap[oid].Methods) {

               for (let parameter in propertyMap[oid].Methods[method].ParameterMap) {
                    const tmp_method_name = `${oid}.${method}.${parameter}`;

                    this.setState({[tmp_method_name]: propertyMap[oid].Methods[method].ParameterMap[parameter].valueHolder.value})

                    var method_id = `m${method}.${parameter}`

                    States[oid][method_id] = (val) => {
                        this.setState({[tmp_method_name]: val})
                    }
                }
            }
        }

        this.setState({ structure: propertyMap })

        this.setState({ rootBlock: state.provider.getRootBlock() })

        /* Starting the provider, which will set providerActive to true once ready */
        state.provider.startProvider(States, (val) => {
            this.setState({providerActive: val})
        })


    }

    connectionButton(index) {
        return (
            <button key={`button-${index}`}
                    className='selection-button italic-font'

                    onClick={() => {
                        let state = this.state;

                        // Closes current connection
                        if (typeof state.provider === 'object') {
                            this.setState({providerActive: false})
                            this.setState({isLoading: 'true'})
                            state.provider.stopProvider("safe");
                        }

                        this.setState({
                            provider: new DataProvider(
                                this.devices[0],
                                this.debug,
                                (val) => {
                                    this.setState({isLoading: val})
                                },
                                () => {
                                    this.setState({providerActive: false})
                                },
                                this.showClassManager
                            )
                        })
                    }}
            >
                <img src={Node} className='button-img' alt='NetworkNode'/>
                <p className='pad-right'>{this.devices[0]}</p>
            </button>
        )
    }

    //#endregion

    render() {
        const state = this.state;

        return (
            <div className='body normal-font'>
                <div className='page-layout-grid'>
                    <div id='top-area' className='fixed top-block'>
                        <h1>Device Model Browser. URL: {this.wsAddress}</h1>
                    </div>
                    {state.provider !== 'function' ? // IS DATA-PROVIDER ACTIVE?
                        state.isLoading === 'true' ?  // IS DATA-PROVIDER LOADING DATA?
                            <div className='loading'>
                                <h2>Loading...</h2>
                            </div>
                            :
                            state.isLoading === 'false' ?
                            <div id='data-area' className='data-field'> {/* TRUE - SHOW TABLE OF DATA */}
                                <DataProviderContext.Provider value={state.provider}>
                                    {/* === DATA TABLES === */}
                                    {Tables(state)}
                                    {/* =================== */}
                                </DataProviderContext.Provider>
                            </div>
                            :
                            <div className='loading error'>
                                <p>Error has occurred:</p>
                                <p>{state.isLoading}</p>
                            </div>
                        :
                        <div className='loading smaller'><p>Click a node to connect...</p></div> // DATA-PROVIDER FALSE
                    }
                </div>
            </div>
        )
    }
}