import React from 'react';
import { Card, CardContent, Grid } from '@material-ui/core';
import { SelectField, SimpleShowLayout, TextField } from 'react-admin';
import ConstraintField from '../../components/ConstraintField';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';

const ReceiverConstraintSets = ({ dataObject }) => {
    return (
        <Grid container spacing={2}>
            {Object.keys(dataObject).map(i => (
                <Grid item sm key={i}>
                    <Card elevation={3}>
                        <CardContent>
                            <SimpleShowLayout record={dataObject[i]}>
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:meta:label'
                                ) && (
                                    <TextField
                                        source="urn:x-nmos:cap:meta:label"
                                        label="Label"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:meta:enabled'
                                ) && (
                                    <SelectField
                                        source="urn:x-nmos:cap:meta:enabled"
                                        label="Enabled"
                                        choices={[
                                            {
                                                id: true,
                                                name: <CheckIcon />,
                                            },
                                            {
                                                id: false,
                                                name: <ClearIcon />,
                                            },
                                        ]}
                                        translateChoice={false}
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:meta:preference'
                                ) && (
                                    <TextField
                                        source="urn:x-nmos:cap:meta:preference"
                                        label="Preference"
                                    />
                                )}
                                {
                                    // General Constraints
                                }
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:media_type'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:media_type"
                                        label="Media Type"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:grain_rate'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:grain_rate"
                                        label="Grain Rate"
                                    />
                                )}
                                {
                                    // Video Constraints
                                }
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:frame_width'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:frame_width"
                                        label="Frame Width"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:frame_height'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:frame_height"
                                        label="Frame Height"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:color_sampling'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:color_sampling"
                                        label="Color Sampling"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:interlace_mode'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:interlace_mode"
                                        label="Interlace Mode"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:colorspace'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:colorspace"
                                        label="Colorspace"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:transfer_characteristic'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:transfer_characteristic"
                                        label="Transfer Characteristic"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:component_depth'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:component_depth"
                                        label="Component Depth"
                                    />
                                )}
                                {
                                    // Audio Constraints
                                }
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:channel_count'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:channel_count"
                                        label="Channel Count"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:sample_rate'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:sample_rate"
                                        label="Sample Rate"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:sample_depth'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:sample_depth"
                                        label="Sample Depth"
                                    />
                                )}
                                {
                                    // Event Constraints
                                }
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:format:event_type'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:format:event_type"
                                        label="Event Type"
                                    />
                                )}
                                {
                                    // Transport Constraints
                                }
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:transport:packet_time'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:transport:packet_time"
                                        label="Packet Time (ms)"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:transport:max_packet_time'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:transport:max_packet_time"
                                        label="Max Packet Time (ms)"
                                    />
                                )}
                                {dataObject[i].hasOwnProperty(
                                    'urn:x-nmos:cap:transport:st2110_21_sender_type'
                                ) && (
                                    <ConstraintField
                                        source="urn:x-nmos:cap:transport:st2110_21_sender_type"
                                        label="ST 2110-21 Sender Type"
                                    />
                                )}
                            </SimpleShowLayout>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

const ReceiverConstraintSetCardsGrid = ({ ids, record }) => {
    const dataObject = [];
    for (let i in ids) {
        dataObject.push(JSON.parse(ids[i]));
    }
    return <ReceiverConstraintSets dataObject={dataObject} />;
};

export default ReceiverConstraintSetCardsGrid;
