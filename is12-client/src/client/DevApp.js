/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * DevApp:
 *  Used for viewing all the class descriptors in a tree layout to help with creating commands
 *  and debugging
 */

/*
* DONE: FIX dev_app graph
*/

import * as React from 'react';
import {useContext, useEffect} from 'react';
import Tree from 'react-d3-tree';
import Button from '@mui/material/Button';
import './DevApp.css';
import {NCAConnection} from '../backend/ConnectionHandler';
import {DeviceContext} from '../index.js'
import {getClassDescriptor, getFormattedBlockNodes} from "../backend/BlockNodeCommands";

//region defaults
const orgChart = {
    name: 'Methods',
    attributes: {
        i: 'Click to expand',
    },
    children: [],
}
//#endregion

export default function DevApp() {
    //region States
    const [chartData, setChartData] = React.useState(orgChart)
    const [, setMethods] = React.useState([])
    const [NCASocket, setNCASocket] = React.useState(typeof NCAConnection)
    const {devices} = useContext(DeviceContext);
    //#endregion

    useEffect(() => {
        if (NCASocket !== "function") NCASocket.startWS().then(r => console.log(r))
    }, [NCASocket])

    //region Functions
    const establishConnection = (index) => {
        return (
            <div key={`div-${index}`}>
                {devices[0]}
                <Button
                    key={`button-${index}`}
                    onClick={() => {
                        setNCASocket(new NCAConnection(devices[0], true))
                    }
                    }>Connect</Button>
            </div>
        )
    }

    /**
     * It takes a type of node and an array of children, and returns an array of children with the correct format for the
     * tree
     * @param type - The type of the children, this is used to determine how to normalise the children
     * @param children - The children of the node
     * @returns The return value is a function that takes two arguments, type and children.
     */
    const normaliseChildren = (type, children) => {

        let t_children = [...children]
        let one_range = [-1, 0] // Used to allocate a node for default methods
        const temp_expand = {
            name: 'Default Properties',
            attributes: {id: 'level: 1'},
            children: []
        }

        function childType(index, elem) {
            if (type === 'methods') {
                t_children[index] = {
                    name: elem.name,
                    attributes: {
                        description: elem.description,
                        id: `level: ${elem.id.level}, index: ${elem.id.index}`,
                        resultDatatype: elem.resultDatatype
                    },
                    children: normaliseChildren('parameters', elem.parameters)
                }

            } else if (type === 'parameters') {
                if (t_children.length !== 0) {
                    t_children[index] = {
                        name: `param: ${elem.name}`,
                        attributes: {
                            description: elem.description,
                            typeName: elem.typeName,
                            isNullable: `${elem.isNullable}`,
                            isSequence: `${elem.isSequence}`,
                            constraints: `${elem.constraints}`
                        }
                    }
                }
            } else if (type === 'events') {
                t_children[index] = {
                    name: elem.name,
                    attributes: {
                        id: `level: ${elem.id.level}, index: ${elem.id.index}`,
                        description: elem.description,
                        eventDatatype: elem.eventDatatype
                    }
                }

            } else if (type === 'properties') {
                if (elem.id.level === 1) {

                    if (one_range[0] === -1) one_range[0] = index

                    one_range[1] = index
                    temp_expand.children.push({
                        name: elem.name,
                        attributes: {
                            id: `level: ${elem.id.level}, index: ${elem.id.index}`,
                            description: elem.description,
                            typeName: elem.typeName,
                            isDeprecated: `${elem.isDeprecated}`,
                            isNullable: `${elem.isNullable}`,
                            isSequence: `${elem.isSequence}`,
                            isReadOnly: `${elem.isReadOnly}`,
                            constraints: `${elem.constraints}`
                        }
                    })

                } else {
                    t_children[index] = {
                        name: elem.name,
                        attributes: {
                            id: `level: ${elem.id.level}, index: ${elem.id.index}`,
                            description: elem.description,
                            typeName: elem.typeName,
                            isDeprecated: `${elem.isDeprecated}`,
                            isNullable: `${elem.isNullable}`,
                            isSequence: `${elem.isSequence}`,
                            isReadOnly: `${elem.isReadOnly}`,
                            constraints: `${elem.constraints}`
                        }
                    }
                }
            }
        }

        // Re-formats data based on type since each type has different values
        t_children.forEach((elem, index) => {
            childType(index, elem);
        })

        // Deletes default methods and puts them into their own node
        if (type === 'properties') {
            t_children.splice(one_range[0], one_range[1] - one_range[0] + 1)
            t_children.push(temp_expand)
        }

        if (t_children.length !== 0) {
            return t_children;
        } else {
            return [{name: 'empty'}]
        }
    }

    /**
     * It takes a chart, a name, an array of attributes, an array of parentIDs, and an array of children, and returns a
     * chart with the new child added. If no attributes provided, it over-writes the current children of parentId.
     * @param location - the array with children
     * @param name - the name of the node
     * @param attributes - an object with the following keys:
     * @param children - an array of objects that have the same structure as the chart object
     * @returns The chart is being returned.
     */
    const addChild = (location, name, attributes, children) => {
        if (attributes === undefined) {
            location = children

        } else {
            location.push({
                name: name,
                attributes: attributes,
                children: children,
            })
        }

        return location;
    }

    /**
     * It sends a message to the NCASocket, and then depending on the message,
     * it updates the chartData and methods state variables
     */
    const sendMessage = async () => {

        // Gets all root blocks and children
        const m_result = await getFormattedBlockNodes(NCASocket, true, false)

        // Copies into chart
        let t_chart = {...orgChart, children: []};

        // For each oid
        for (const elem of Object.keys(m_result)) {

            let lm = m_result[elem];

            // Gets class descriptor
            const descriptor = await getClassDescriptor(NCASocket, m_result[elem])

            // Adds into graph
            const desc = addChild([], descriptor.description, undefined,
                [{
                    name: 'events',
                    children: normaliseChildren('events', descriptor.events)
                }, {
                    name: 'methods',
                    children: normaliseChildren('methods', descriptor.methods)
                }, {
                    name: 'properties',
                    children: normaliseChildren('properties', descriptor.properties)
                }],
            )


            // Parent blocks
            if (lm.owner === 1) {

                t_chart.children = addChild(t_chart.children, lm.role, {
                    oid: lm.oid,
                    userLabel: lm.userLabel,
                    id: lm.classId.join('.'),
                    description: lm.description
                }, [...desc])

            }
            // Child blocks
            else {
                t_chart.children.forEach((elem) => {
                    if (elem.attributes.oid === lm.owner) {
                        elem.children = addChild(elem.children, lm.role, {
                            oid: lm.oid,
                            userLabel: lm.userLabel,
                            id: lm.classId.join('.'),
                            description: lm.description
                        }, [...desc])
                    }
                })
            }
        }

        // Sets state and chart data
        setMethods(m_result);
        setChartData(t_chart);
    }
    //#endregion


    //region MAIN APP
    if (typeof NCASocket === 'object') {
        return (
            <div className={'basic'}>
                {/*<Button onClick={() => {*/}
                {/*    sendMessage(getUserLabel())*/}
                {/*}}> Get User Label </Button>*/}
                <Button onClick={() => {
                    sendMessage().then()
                }}> Get Data </Button>

                <div className={'tree_wrap'}>
                    <Tree
                        data={chartData}
                        pathFunc={'step'}
                        initialDepth={1}
                        nodeSize={{x: 450, y: 100}}
                        translate={{x: 200, y: 400}}
                        scaleExtent={{min: 0.5, max: 1.5}}
                        enableLegacyTransitions={true}
                        rootNodeClassName="node__root"
                        branchNodeClassName="node__branch"
                        leafNodeClassName="node__leaf"
                        separation={{nonSiblings: 5, siblings: 3}}
                        shouldCollapseNeighborNodes={true}

                    />
                </div>
            </div>
        )
    } else {
        return (
            <div className={'basic'}> Devices:
                {
                    establishConnection(0)
                }
            </div>
        )
    }
    //endregion
}
