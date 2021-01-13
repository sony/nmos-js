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

const filterChannelLabel = (
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
            Object.entries(item.channels).some(
                ([channelIndex, channelItem]) =>
                    channelIncludes(
                        personalChannelName(channelIndex),
                        channel_label
                    ) || channelIncludes(channelItem.label, channel_label)
            )
        );
    }
};

const routableInputsIncludes = (inputId, routable_inputs, io, getInputName) => {
    return (
        (inputId === null &&
            'Unrouted'.match(RegExp(`${routable_inputs}`, 'i'))) ||
        (inputId != null &&
            (String(get(io, `inputs.${inputId}.properties.name`)).match(
                RegExp(`${routable_inputs}`, 'i')
            ) ||
                String(getInputName(inputId)).match(
                    RegExp(`${routable_inputs}`, 'i')
                )))
    );
};

const filterRoutableInputs = (
    routable_inputs,
    item,
    filterGroup,
    io,
    getInputName
) => {
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
                item.caps.routable_inputs.some(inputId =>
                    routableInputsIncludes(
                        inputId,
                        routable_inputs,
                        io,
                        getInputName
                    )
                )) ||
            (item.caps.routable_inputs === null &&
                'No Constraints'.match(RegExp(`${routable_inputs}`, 'i')))
        );
    }
};

const filterLabel = (label, apiName, name, filterGroup) => {
    if (filterGroup === 'or' && label === undefined) {
        return false;
    } else {
        return (
            label === undefined ||
            apiName.match(RegExp(`${label}`, 'i')) ||
            name.match(RegExp(`${label}`, 'i'))
        );
    }
};

const filterId = (id, itemId, filterGroup) => {
    if (filterGroup === 'or' && id === undefined) {
        return false;
    } else {
        return id === undefined || itemId.match(RegExp(`${id}`, 'i'));
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
    filtered_io,
    personalNames,
    ioKey
) => {
    if (channel_label) {
        for (const [id, item] of Object.entries(filtered_io)) {
            const getPersonalChannelLabel = channel_index =>
                getPersonalChannelName(id, ioKey, channel_index, personalNames);
            if (
                filterChannelLabel(channel_label, item, getPersonalChannelLabel)
            ) {
                filtered_io[id] = JSON.parse(JSON.stringify(item));
                filtered_io[id].channels = Object.fromEntries(
                    Object.entries(filtered_io[id].channels).filter(
                        ([channel_index, channel_item]) =>
                            channelIncludes(
                                channel_item.label,
                                channel_label
                            ) ||
                            channelIncludes(
                                getPersonalChannelLabel(channel_index),
                                channel_label
                            )
                    )
                );
            }
        }
    }
};

const FilterInputs = filter => {
    return (
        has(filter, 'input name') ||
        has(filter, 'input id') ||
        has(filter, 'block size') ||
        has(filter, 'reordering') ||
        has(filter, 'input channel label')
    );
};

const FilterOutputs = filter => {
    return (
        has(filter, 'output name') ||
        has(filter, 'output id') ||
        has(filter, 'routable inputs') ||
        has(filter, 'output channel label')
    );
};

export const getFilteredInputs = (filter, io, filter_group, personalNames) => {
    let filter_inputs = get(io, 'inputs');
    if (filter && FilterInputs(filter)) {
        let input_id_filter = get(filter, 'input id');
        let input_label = get(filter, 'input name');
        let block_size = get(filter, 'block size');
        let reordering = get(filter, 'reordering');
        let input_channel_label = get(filter, 'input channel label');
        filter_inputs = Object.fromEntries(
            Object.entries(filter_inputs).filter(([input_id, input_item]) =>
                conditionGroup(
                    filter_group,
                    filterId(input_id_filter, input_id, filter_group),
                    filterLabel(
                        input_label,
                        input_item.properties.name,
                        getPersonalName(input_id, 'inputs', personalNames),
                        filter_group
                    ),
                    filterBlockSize(block_size, input_item, filter_group),
                    filterReordering(reordering, input_item, filter_group),
                    filterChannelLabel(
                        input_channel_label,
                        input_item,
                        channel_index =>
                            getPersonalChannelName(
                                input_id,
                                'inputs',
                                channel_index,
                                personalNames
                            ),
                        filter_group
                    )
                )
            )
        );
        filterIOByChannels(
            input_channel_label,
            filter_inputs,
            personalNames,
            'inputs'
        );
    }
    return filter_inputs;
};

export const getFilteredOutputs = (filter, io, filter_group, personalNames) => {
    let filter_outputs = get(io, 'outputs');
    if (filter && FilterOutputs(filter)) {
        let output_id_filter = get(filter, 'output id');
        let output_label = get(filter, 'output name');
        let routable_inputs = get(filter, 'routable inputs');
        let output_channel_label = get(filter, 'output channel label');
        filter_outputs = Object.fromEntries(
            Object.entries(filter_outputs).filter(([output_id, output_item]) =>
                conditionGroup(
                    filter_group,
                    filterId(output_id_filter, output_id, filter_group),
                    filterLabel(
                        output_label,
                        output_item.properties.name,
                        getPersonalName(output_id, 'outputs', personalNames),
                        filter_group
                    ),
                    filterRoutableInputs(
                        routable_inputs,
                        output_item,
                        filter_group,
                        io,
                        inputId =>
                            getPersonalName(inputId, 'inputs', personalNames)
                    ),
                    filterChannelLabel(
                        output_channel_label,
                        output_item,
                        channel_index =>
                            getPersonalChannelName(
                                output_id,
                                'outputs',
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
            filter_outputs,
            personalNames,
            'outputs'
        );
    }
    return filter_outputs;
};
