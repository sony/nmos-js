import { get, has } from 'lodash';
import { getCustomChannelLabel, getCustomName } from './ChannelMappingMatrix';

const conditionGroup = (filterMode, ...theArgs) =>
    theArgs.reduce((previous, current) => {
        if (filterMode === 'or') {
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
    filterMode
) => {
    if (filterMode === 'or' && channelLabelReg === undefined) {
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
    filterMode,
    getInputAPIName,
    getInputName
) => {
    if (
        filterMode === 'or' &&
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

const filterName = (nameReg, apiName, name, filterMode) => {
    if (filterMode === 'or' && nameReg === undefined) {
        return false;
    } else {
        return (
            nameReg === undefined ||
            apiName.match(RegExp(`${nameReg}`, 'i')) ||
            name.match(RegExp(`${nameReg}`, 'i'))
        );
    }
};

const filterId = (idReg, itemId, filterMode) => {
    if (filterMode === 'or' && idReg === undefined) {
        return false;
    } else {
        return idReg === undefined || itemId.match(RegExp(`${idReg}`, 'i'));
    }
};

const filterBlockSize = (blockSizeReg, item, filterMode) => {
    if (
        filterMode === 'or' &&
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

const filterReordering = (reorderingReg, item, filterMode) => {
    if (filterMode === 'or' && reorderingReg === undefined) {
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
    ioResource,
    deviceId
) => {
    if (channelLabelReg) {
        for (const [id, item] of Object.entries(filteredIo)) {
            const getCustomIOChannelLabel = channelIndex =>
                getCustomChannelLabel(
                    customNames,
                    deviceId,
                    ioResource,
                    id,
                    channelIndex
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
                        ([channelIndex, channelItem]) =>
                            channelIncludes(
                                channelItem.label,
                                channelLabelReg
                            ) ||
                            channelIncludes(
                                getCustomIOChannelLabel(channelIndex),
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
    filterMode,
    customNames,
    inputs,
    deviceId
) => {
    let filteredInputs = inputs;
    if (filter && hasInputFilters(filter)) {
        let inputIdReg = get(filter, 'input id');
        let inputNameReg = get(filter, 'input name');
        let blockSizeReg = get(filter, 'block size');
        let reorderingReg = get(filter, 'reordering');
        let inputChannelLabelReg = get(filter, 'input channel label');
        filteredInputs = Object.fromEntries(
            Object.entries(filteredInputs).filter(([inputId, inputItem]) =>
                conditionGroup(
                    filterMode,
                    filterId(inputIdReg, inputId, filterMode),
                    filterName(
                        inputNameReg,
                        inputItem.properties.name,
                        getCustomName(customNames, deviceId, 'inputs', inputId),
                        filterMode
                    ),
                    filterBlockSize(blockSizeReg, inputItem, filterMode),
                    filterReordering(reorderingReg, inputItem, filterMode),
                    filterChannelLabel(
                        inputChannelLabelReg,
                        inputItem,
                        channelIndex =>
                            getCustomChannelLabel(
                                customNames,
                                deviceId,
                                'inputs',
                                inputId,
                                channelIndex
                            ),
                        filterMode
                    )
                )
            )
        );
        filterIOByChannels(
            inputChannelLabelReg,
            filteredInputs,
            customNames,
            'inputs',
            deviceId
        );
    }
    return filteredInputs;
};

export const getFilteredOutputs = (
    filter,
    getInputAPIName,
    filterMode,
    customNames,
    outputs,
    deviceId
) => {
    let filteredOutputs = outputs;
    if (filter && hasOutputFilters(filter)) {
        let outputIdReg = get(filter, 'output id');
        let outputNameReg = get(filter, 'output name');
        let routableInputsReg = get(filter, 'routable inputs');
        let outputChannelLabelReg = get(filter, 'output channel label');
        filteredOutputs = Object.fromEntries(
            Object.entries(filteredOutputs).filter(([outputId, outputItem]) =>
                conditionGroup(
                    filterMode,
                    filterId(outputIdReg, outputId, filterMode),
                    filterName(
                        outputNameReg,
                        outputItem.properties.name,
                        getCustomName(
                            customNames,
                            deviceId,
                            'outputs',
                            outputId
                        ),
                        filterMode
                    ),
                    filterRoutableInputs(
                        routableInputsReg,
                        outputItem,
                        filterMode,
                        getInputAPIName,
                        inputId =>
                            getCustomName(
                                customNames,
                                deviceId,
                                'inputs',
                                inputId
                            )
                    ),
                    filterChannelLabel(
                        outputChannelLabelReg,
                        outputItem,
                        channelIndex =>
                            getCustomChannelLabel(
                                customNames,
                                deviceId,
                                'outputs',
                                outputId,
                                channelIndex
                            ),
                        filterMode
                    )
                )
            )
        );
        filterIOByChannels(
            outputChannelLabelReg,
            filteredOutputs,
            customNames,
            'outputs',
            deviceId
        );
    }
    return filteredOutputs;
};
