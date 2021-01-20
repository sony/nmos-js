import { cloneDeep, get, has } from 'lodash';
import { getCustomChannelLabel, getCustomName } from './ChannelMappingMatrix';

const channelIncludes = (label, channelLabelReg) => {
    return RegExp(channelLabelReg, 'i').test(label);
};

const filterChannelLabel = (channelLabelReg, item, customChannelLabel) => {
    return (
        !channelLabelReg ||
        Object.entries(item.channels).some(
            ([channelIndex, channelItem]) =>
                channelIncludes(
                    customChannelLabel(channelIndex),
                    channelLabelReg
                ) || channelIncludes(channelItem.label, channelLabelReg)
        )
    );
};

const routableInputsIncludes = (
    inputId,
    routableInputsReg,
    getInputAPIName,
    getInputName
) => {
    return (
        (inputId === null && RegExp(routableInputsReg, 'i').test('Unrouted')) ||
        (inputId != null &&
            RegExp(routableInputsReg, 'i').test(getInputAPIName(inputId))) ||
        RegExp(routableInputsReg, 'i').test(getInputName(inputId))
    );
};

const filterRoutableInputs = (
    routableInputsReg,
    item,
    getInputAPIName,
    getInputName
) => {
    return (
        !routableInputsReg ||
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
            RegExp(routableInputsReg, 'i').test('No Constraints'))
    );
};

const filterName = (nameReg, apiName, name) => {
    return (
        !nameReg ||
        RegExp(nameReg, 'i').test(apiName) ||
        RegExp(nameReg, 'i').test(name)
    );
};

const filterId = (idReg, itemId) => {
    return !idReg || RegExp(idReg, 'i').test(itemId);
};

const filterBlockSize = (blockSizeReg, item) => {
    return (
        blockSizeReg === undefined ||
        isNaN(blockSizeReg) ||
        item.caps.block_size === blockSizeReg
    );
};

const filterReordering = (reorderingReg, item) => {
    return (
        reorderingReg === undefined || item.caps.reordering === reorderingReg
    );
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
                filteredIo[id] = cloneDeep(item);
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

export const getFilteredInputs = (filter, customNames, inputs, deviceId) => {
    let filteredInputs = inputs;
    if (filter && hasInputFilters(filter)) {
        let inputIdReg = get(filter, 'input id');
        let inputNameReg = get(filter, 'input name');
        let blockSizeReg = get(filter, 'block size');
        let reorderingReg = get(filter, 'reordering');
        let inputChannelLabelReg = get(filter, 'input channel label');
        filteredInputs = Object.fromEntries(
            Object.entries(filteredInputs).filter(
                ([inputId, inputItem]) =>
                    filterId(inputIdReg, inputId) &&
                    filterName(
                        inputNameReg,
                        inputItem.properties.name,
                        getCustomName(customNames, deviceId, 'inputs', inputId)
                    ) &&
                    filterBlockSize(blockSizeReg, inputItem) &&
                    filterReordering(reorderingReg, inputItem) &&
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
            Object.entries(filteredOutputs).filter(
                ([outputId, outputItem]) =>
                    filterId(outputIdReg, outputId) &&
                    filterName(
                        outputNameReg,
                        outputItem.properties.name,
                        getCustomName(
                            customNames,
                            deviceId,
                            'outputs',
                            outputId
                        )
                    ) &&
                    filterRoutableInputs(
                        routableInputsReg,
                        outputItem,
                        getInputAPIName,
                        inputId =>
                            getCustomName(
                                customNames,
                                deviceId,
                                'inputs',
                                inputId
                            )
                    ) &&
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
