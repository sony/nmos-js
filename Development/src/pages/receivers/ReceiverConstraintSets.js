import React from 'react';
import { Card, CardContent, Grid } from '@material-ui/core';
import { SelectField, SimpleShowLayout, TextField } from 'react-admin';
import has from 'lodash/has';
import ConstraintField from '../../components/ConstraintField';
import SanitizedDivider from '../../components/SanitizedDivider';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';

const ReceiverConstraintSets = ({ data }) => {
    return (
        <Grid container spacing={2}>
            {Object.keys(data).map(i => (
                <Grid item sm key={i}>
                    <ReceiverConstraintSet data={data[i]} />
                </Grid>
            ))}
        </Grid>
    );
};

const ReceiverConstraintSet = ({ data }) => (
    <Card elevation={3}>
        <CardContent>
            <SimpleShowLayout record={data}>
                {has(data, 'urn:x-nmos:cap:meta:label') && (
                    <TextField
                        source="urn:x-nmos:cap:meta:label"
                        label="Label"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:meta:enabled') && (
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
                {has(data, 'urn:x-nmos:cap:meta:preference') && (
                    <TextField
                        source="urn:x-nmos:cap:meta:preference"
                        label="Preference"
                    />
                )}
                {Object.keys(data).some(x =>
                    x.startsWith('urn:x-nmos:cap:meta:')
                ) && <SanitizedDivider />}
                {
                    // General Constraints
                }
                {has(data, 'urn:x-nmos:cap:format:media_type') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:media_type"
                        label="Media Type"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:grain_rate') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:grain_rate"
                        label="Grain Rate"
                    />
                )}
                {
                    // Video Constraints
                }
                {has(data, 'urn:x-nmos:cap:format:frame_width') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:frame_width"
                        label="Frame Width"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:frame_height') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:frame_height"
                        label="Frame Height"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:color_sampling') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:color_sampling"
                        label="Color Sampling"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:interlace_mode') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:interlace_mode"
                        label="Interlace Mode"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:colorspace') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:colorspace"
                        label="Colorspace"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:transfer_characteristic') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:transfer_characteristic"
                        label="Transfer Characteristic"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:component_depth') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:component_depth"
                        label="Component Depth"
                    />
                )}
                {
                    // Audio Constraints
                }
                {has(data, 'urn:x-nmos:cap:format:channel_count') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:channel_count"
                        label="Channel Count"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:sample_rate') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:sample_rate"
                        label="Sample Rate"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:format:sample_depth') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:sample_depth"
                        label="Sample Depth"
                    />
                )}
                {
                    // Event Constraints
                }
                {has(data, 'urn:x-nmos:cap:format:event_type') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:format:event_type"
                        label="Event Type"
                    />
                )}
                {
                    // Transport Constraints
                }
                {has(data, 'urn:x-nmos:cap:transport:packet_time') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:transport:packet_time"
                        label="Packet Time (ms)"
                    />
                )}
                {has(data, 'urn:x-nmos:cap:transport:max_packet_time') && (
                    <ConstraintField
                        source="urn:x-nmos:cap:transport:max_packet_time"
                        label="Max Packet Time (ms)"
                    />
                )}
                {has(
                    data,
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
);

const ReceiverConstraintSetCardsGrid = ({ ids, record }) => {
    const data = [];
    for (let i in ids) {
        data.push(JSON.parse(ids[i]));
    }
    return <ReceiverConstraintSets data={data} />;
};

export default ReceiverConstraintSetCardsGrid;
