import get from 'lodash/get';
import has from 'lodash/has';
import {
    getPersonalChannelName,
    getPersonalName,
} from './ChannelMappingMatrix';

const conditionGroup = (filterGroup, ...theArgs) => {
    return theArgs.reduce((previous, current) => {
        if (filterGroup === 'or') {
            return previous || current;
        } else {
            return previous && current;
        }
    });
};

const channelIncludes = (label, channel_label) => {
    return label.match(RegExp(`${channel_label}`, 'i'));
};

const filterChannelLabel = (channel_label, item, filterGroup) => {
    if (filterGroup === 'or' && channel_label === undefined) {
        return false;
    } else {
        return (
            channel_label === undefined ||
            channel_label === '' ||
            item.channels.some(element =>
                channelIncludes(element.label, channel_label)
            )
        );
    }
};

const filterPersonalChannelLabel = (
    channel_label,
    item,
    personalChannelName,
    filterGroup
) => {
    if (filterGroup === 'or' && channel_label === undefined) {
        return false;
    } else {
        return (
            channel_label === undefined ||
            channel_label === '' ||
            Object.entries(item.channels).some(([channelIndex, _]) =>
                channelIncludes(
                    personalChannelName(channelIndex),
                    channel_label
                )
            )
        );
    }
};

const routableInputsIncludes = (element, routable_inputs, io) => {
    return (
        (element === null &&
            'Unrouted'.match(RegExp(`${routable_inputs}`, 'i'))) ||
        (element != null &&
            String(get(io, `inputs.${element}.properties.name`)).match(
                RegExp(`${routable_inputs}`, 'i')
            ))
    );
};

const filterRoutableInputs = (routable_inputs, item, filterGroup, io) => {
    if (
        filterGroup === 'or' &&
        (routable_inputs === undefined || routable_inputs === '')
    ) {
        return false;
    } else {
        return (
            routable_inputs === undefined ||
            routable_inputs === '' ||
            (item.caps.routable_inputs !== null &&
                item.caps.routable_inputs.some(element =>
                    routableInputsIncludes(element, routable_inputs, io)
                )) ||
            (item.caps.routable_inputs === null &&
                'No Constraints'.match(RegExp(`${routable_inputs}`, 'i')))
        );
    }
};

const filterLabel = (label, item, filterGroup) => {
    if (filterGroup === 'or' && label === undefined) {
        return false;
    } else {
        return (
            label === undefined ||
            item.properties.name.match(RegExp(`${label}`, 'i'))
        );
    }
};

const filterPersonalLabel = (label, personalName, filterGroup) => {
    if (filterGroup === 'or' && label === undefined) {
        return false;
    } else {
        return (
            label === undefined || personalName.match(RegExp(`${label}`, 'i'))
        );
    }
};

const filterBlockSize = (blockSize, item, filterGroup) => {
    if (filterGroup === 'or' && (blockSize === undefined || isNaN(blockSize))) {
        return false;
    } else {
        return (
            blockSize === undefined ||
            isNaN(blockSize) ||
            item.caps.block_size === blockSize
        );
    }
};

const filterReordering = (reordering, item, filterGroup) => {
    if (filterGroup === 'or' && reordering === undefined) {
        return false;
    } else {
        return reordering === undefined || item.caps.reordering === reordering;
    }
};

const filterIOByChannels = (
    channel_label,
    personal_channel_label,
    filtered_io,
    personalNames,
    ioKey
) => {
    if (channel_label || personal_channel_label) {
        for (const [id, item] of Object.entries(filtered_io)) {
            const getPersonalChannelLabel = channel_index =>
                getPersonalChannelName(id, ioKey, channel_index, personalNames);
            if (
                filterChannelLabel(channel_label, item) ||
                filterPersonalChannelLabel(
                    personal_channel_label,
                    item,
                    getPersonalChannelLabel
                )
            ) {
                filtered_io[id] = JSON.parse(JSON.stringify(item));
                filtered_io[id].channels = filtered_io[id].channels.filter(
                    element =>
                        channelIncludes(element.label, channel_label) ||
                        channelIncludes(
                            getPersonalChannelLabel(
                                filtered_io[id].channels.indexOf(element)
                            ),
                            personal_channel_label
                        )
                );
            }
        }
    }
};

const FilterInputs = filter => {
    return (
        has(filter, `input label`) ||
        has(filter, `block size`) ||
        has(filter, `reordering`) ||
        has(filter, `input channel label`) ||
        has(filter, 'personal input label') ||
        has(filter, 'personal input channel label')
    );
};

const FilterOutputs = filter => {
    return (
        has(filter, `output label`) ||
        has(filter, `routable inputs`) ||
        has(filter, `output channel label`) ||
        has(filter, 'personal output label') ||
        has(filter, 'personal output channel label')
    );
};

export const getFilteredIO = (filter, io, personalNames) => {
    let filter_outputs = get(io, `outputs`);
    let filter_inputs = get(io, `inputs`);
    let filter_group = get(filter, `filter group`);
    if (filter) {
        if (FilterOutputs(filter)) {
            let output_label = get(filter, `output label`);
            let routable_inputs = get(filter, `routable inputs`);
            let output_channel_label = get(filter, `output channel label`);
            let personal_output_label = get(filter, 'personal output label');
            let personal_output_channel_label = get(
                filter,
                'personal output channel label'
            );
            filter_outputs = Object.fromEntries(
                Object.entries(filter_outputs).filter(
                    ([output_id, output_item]) =>
                        conditionGroup(
                            filter_group,
                            filterLabel(
                                output_label,
                                output_item,
                                filter_group
                            ),
                            filterRoutableInputs(
                                routable_inputs,
                                output_item,
                                filter_group,
                                io
                            ),
                            filterChannelLabel(
                                output_channel_label,
                                output_item,
                                filter_group
                            ),
                            filterPersonalLabel(
                                personal_output_label,
                                getPersonalName(
                                    output_id,
                                    'outputs',
                                    personalNames
                                ),
                                filter_group
                            ),
                            filterPersonalChannelLabel(
                                personal_output_channel_label,
                                output_item,
                                channel_index =>
                                    getPersonalChannelName(
                                        output_id,
                                        `outputs`,
                                        channel_index,
                                        personalNames
                                    ),
                                filter_group
                            )
                        )
                )
            );
            filterIOByChannels(
                output_channel_label,
                personal_output_channel_label,
                filter_outputs,
                personalNames,
                'outputs'
            );
        }
        if (FilterInputs(filter)) {
            let input_label = get(filter, `input label`);
            let block_size = get(filter, `block size`);
            let reordering = get(filter, `reordering`);
            let input_channel_label = get(filter, `input channel label`);
            let personal_input_label = get(filter, 'personal input label');
            let personal_input_channel_label = get(
                filter,
                'personal input channel label'
            );
            filter_inputs = Object.fromEntries(
                Object.entries(filter_inputs).filter(([input_id, input_item]) =>
                    conditionGroup(
                        filter_group,
                        filterLabel(input_label, input_item),
                        filterBlockSize(block_size, input_item),
                        filterReordering(reordering, input_item),
                        filterChannelLabel(input_channel_label, input_item),
                        filterPersonalLabel(
                            personal_input_label,
                            getPersonalName(input_id, 'inputs', personalNames)
                        ),
                        filterPersonalChannelLabel(
                            personal_input_channel_label,
                            input_item,
                            channel_index =>
                                getPersonalChannelName(
                                    input_id,
                                    `inputs`,
                                    channel_index,
                                    personalNames
                                )
                        )
                    )
                )
            );
            filterIOByChannels(
                input_channel_label,
                personal_input_channel_label,
                filter_inputs,
                personalNames,
                'inputs'
            );
        }
    }
    return [filter_inputs, filter_outputs];
};
