import { get, has } from 'lodash';
import { getCustomChannelLabel, getCustomName } from './ChannelMappingMatrix';

const conditionGroup = (filterGroup, ...theArgs) =>
    theArgs.reduce((previous, current) => {
        if (filterGroup === 'or') {
            return previous || current;
        } else {
            return previous && current;
        }
    });

const channelIncludes = (label, channelLabelReg) => {
    return label.match(RegExp(`${channelLabelReg}`, 'i'));
};

const filterChannelLabel = (
    channelLabelReg,
    item,
    customChannelLabel,
    filterGroup
) => {
    if (filterGroup === 'or' && channelLabelReg === undefined) {
        return false;
    } else {
        return (
            channelLabelReg === undefined ||
            channelLabelReg === '' ||
            Object.entries(item.channels).some(
                ([channelIndex, channelItem]) =>
                    channelIncludes(
                        customChannelLabel(channelIndex),
                        channelLabelReg
                    ) || channelIncludes(channelItem.label, channelLabelReg)
            )
        );
    }
};

const routableInputsIncludes = (
    inputId,
    routableInputsReg,
    getInputAPIName,
    getInputName
) => {
    return (
        (inputId === null &&
            'Unrouted'.match(RegExp(`${routableInputsReg}`, 'i'))) ||
        (inputId != null &&
            (String(getInputAPIName(inputId)).match(
                RegExp(`${routableInputsReg}`, 'i')
            ) ||
                String(getInputName(inputId)).match(
                    RegExp(`${routableInputsReg}`, 'i')
                )))
    );
};

const filterRoutableInputs = (
    routableInputsReg,
    item,
    filterGroup,
    getInputAPIName,
    getInputName
) => {
    if (
        filterGroup === 'or' &&
        (routableInputsReg === undefined || routableInputsReg === '')
    ) {
        return false;
    } else {
        return (
            routableInputsReg === undefined ||
            routableInputsReg === '' ||
            (item.caps.routable_inputs !== null &&
                item.caps.routable_inputs.some(inputId =>
                    routableInputsIncludes(
                        inputId,
                        routableInputsReg,
                        getInputAPIName,
                        getInputName
                    )
                )) ||
            (item.caps.routable_inputs === null &&
                'No Constraints'.match(RegExp(`${routableInputsReg}`, 'i')))
        );
    }
};

const filterName = (nameReg, apiName, name, filterGroup) => {
    if (filterGroup === 'or' && nameReg === undefined) {
        return false;
    } else {
        return (
            nameReg === undefined ||
            apiName.match(RegExp(`${nameReg}`, 'i')) ||
            name.match(RegExp(`${nameReg}`, 'i'))
        );
    }
};

const filterId = (idReg, itemId, filterGroup) => {
    if (filterGroup === 'or' && idReg === undefined) {
        return false;
    } else {
        return idReg === undefined || itemId.match(RegExp(`${idReg}`, 'i'));
    }
};

const filterBlockSize = (blockSizeReg, item, filterGroup) => {
    if (
        filterGroup === 'or' &&
        (blockSizeReg === undefined || isNaN(blockSizeReg))
    ) {
        return false;
    } else {
        return (
            blockSizeReg === undefined ||
            isNaN(blockSizeReg) ||
            item.caps.block_size === blockSizeReg
        );
    }
};

const filterReordering = (reorderingReg, item, filterGroup) => {
    if (filterGroup === 'or' && reorderingReg === undefined) {
        return false;
    } else {
        return (
            reorderingReg === undefined ||
            item.caps.reordering === reorderingReg
        );
    }
};

const filterIOByChannels = (
    channelLabelReg,
    filteredIo,
    customNames,
    ioKey,
    deviceID
) => {
    if (channelLabelReg) {
        for (const [id, item] of Object.entries(filteredIo)) {
            const getCustomIOChannelLabel = channel_index =>
                getCustomChannelLabel(
                    id,
                    ioKey,
                    channel_index,
                    customNames,
                    deviceID
                );
            if (
                filterChannelLabel(
                    channelLabelReg,
                    item,
                    getCustomIOChannelLabel
                )
            ) {
                filteredIo[id] = JSON.parse(JSON.stringify(item));
                filteredIo[id].channels = Object.fromEntries(
                    Object.entries(filteredIo[id].channels).filter(
                        ([channel_index, channel_item]) =>
                            channelIncludes(
                                channel_item.label,
                                channelLabelReg
                            ) ||
                            channelIncludes(
                                getCustomIOChannelLabel(channel_index),
                                channelLabelReg
                            )
                    )
                );
            }
        }
    }
};

const hasInputFilters = filter => {
    return (
        has(filter, 'input name') ||
        has(filter, 'input id') ||
        has(filter, 'block size') ||
        has(filter, 'reordering') ||
        has(filter, 'input channel label')
    );
};

const hasOutputFilters = filter => {
    return (
        has(filter, 'output name') ||
        has(filter, 'output id') ||
        has(filter, 'routable inputs') ||
        has(filter, 'output channel label')
    );
};

export const getFilteredInputs = (
    filter,
    filterGroup,
    customNames,
    inputs,
    deviceID
) => {
    let filter_inputs = inputs;
    if (filter && hasInputFilters(filter)) {
        let inputIdReg = get(filter, 'input id');
        let inputNameReg = get(filter, 'input name');
        let blockSizeReg = get(filter, 'block size');
        let reorderingReg = get(filter, 'reordering');
        let inputChannelLabelReg = get(filter, 'input channel label');
        filter_inputs = Object.fromEntries(
            Object.entries(filter_inputs).filter(([input_id, input_item]) =>
                conditionGroup(
                    filterGroup,
                    filterId(inputIdReg, input_id, filterGroup),
                    filterName(
                        inputNameReg,
                        input_item.properties.name,
                        getCustomName(
                            input_id,
                            'inputs',
                            customNames,
                            deviceID
                        ),
                        filterGroup
                    ),
                    filterBlockSize(blockSizeReg, input_item, filterGroup),
                    filterReordering(reorderingReg, input_item, filterGroup),
                    filterChannelLabel(
                        inputChannelLabelReg,
                        input_item,
                        channel_index =>
                            getCustomChannelLabel(
                                input_id,
                                'inputs',
                                channel_index,
                                customNames,
                                deviceID
                            ),
                        filterGroup
                    )
                )
            )
        );
        filterIOByChannels(
            inputChannelLabelReg,
            filter_inputs,
            customNames,
            'inputs',
            deviceID
        );
    }
    return filter_inputs;
};

export const getFilteredOutputs = (
    filter,
    getInputAPIName,
    filterGroup,
    customNames,
    outputs,
    deviceID
) => {
    let filter_outputs = outputs;
    if (filter && hasOutputFilters(filter)) {
        let outputIdReg = get(filter, 'output id');
        let outputNameReg = get(filter, 'output name');
        let routableInputsReg = get(filter, 'routable inputs');
        let outputChannelLabelReg = get(filter, 'output channel label');
        filter_outputs = Object.fromEntries(
            Object.entries(filter_outputs).filter(([output_id, output_item]) =>
                conditionGroup(
                    filterGroup,
                    filterId(outputIdReg, output_id, filterGroup),
                    filterName(
                        outputNameReg,
                        output_item.properties.name,
                        getCustomName(
                            output_id,
                            'outputs',
                            customNames,
                            deviceID
                        ),
                        filterGroup
                    ),
                    filterRoutableInputs(
                        routableInputsReg,
                        output_item,
                        filterGroup,
                        getInputAPIName,
                        inputId =>
                            getCustomName(
                                inputId,
                                'inputs',
                                customNames,
                                deviceID
                            )
                    ),
                    filterChannelLabel(
                        outputChannelLabelReg,
                        output_item,
                        channel_index =>
                            getCustomChannelLabel(
                                output_id,
                                'outputs',
                                channel_index,
                                customNames,
                                deviceID
                            ),
                        filterGroup
                    )
                )
            )
        );
        filterIOByChannels(
            outputChannelLabelReg,
            filter_outputs,
            customNames,
            'outputs',
            deviceID
        );
    }
    return filter_outputs;
};
