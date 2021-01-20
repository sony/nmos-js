import { cloneDeep, get, has } from 'lodash';
import { getCustomChannelLabel, getCustomName } from './ChannelMappingMatrix';

const channelIncludes = (label, channelLabelReg) =>
    RegExp(channelLabelReg, 'i').test(label);

const filterChannelLabel = (channelLabelReg, item, customChannelLabel) =>
    !channelLabelReg ||
    Object.entries(item.channels).some(
        ([channelIndex, channelItem]) =>
            channelIncludes(channelItem.label, channelLabelReg) ||
            channelIncludes(customChannelLabel(channelIndex), channelLabelReg)
    );

const routableInputsIncludes = (
    inputId,
    routableInputsReg,
    getInputAPIName,
    getInputName
) =>
    inputId === null
        ? RegExp(routableInputsReg, 'i').test('Unrouted')
        : RegExp(routableInputsReg, 'i').test(getInputAPIName(inputId)) ||
          RegExp(routableInputsReg, 'i').test(getInputName(inputId));

const filterRoutableInputs = (
    routableInputsReg,
    item,
    getInputAPIName,
    getInputName
) =>
    !routableInputsReg ||
    (item.caps.routable_inputs
        ? item.caps.routable_inputs.some(inputId =>
              routableInputsIncludes(
                  inputId,
                  routableInputsReg,
                  getInputAPIName,
                  getInputName
              )
          )
        : RegExp(routableInputsReg, 'i').test('No Constraints'));

const filterName = (nameReg, apiName, name) =>
    !nameReg ||
    RegExp(nameReg, 'i').test(apiName) ||
    RegExp(nameReg, 'i').test(name);

const filterId = (idReg, itemId) => !idReg || RegExp(idReg, 'i').test(itemId);

const filterBlockSize = (blockSizeVal, item) =>
    blockSizeVal === undefined ||
    isNaN(blockSizeVal) ||
    item.caps.block_size === blockSizeVal;

const filterReordering = (reorderingVal, item) =>
    reorderingVal === undefined || item.caps.reordering === reorderingVal;

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

const hasInputFilters = filter =>
    has(filter, 'input name') ||
    has(filter, 'input id') ||
    has(filter, 'block size') ||
    has(filter, 'reordering') ||
    has(filter, 'input channel label');

const hasOutputFilters = filter =>
    has(filter, 'output name') ||
    has(filter, 'output id') ||
    has(filter, 'routable inputs') ||
    has(filter, 'output channel label');

export const getFilteredInputs = (filter, customNames, inputs, deviceId) => {
    let filteredInputs = inputs;
    if (filter && hasInputFilters(filter)) {
        let inputIdReg = get(filter, 'input id');
        let inputNameReg = get(filter, 'input name');
        let blockSizeVal = get(filter, 'block size');
        let reorderingVal = get(filter, 'reordering');
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
                    filterBlockSize(blockSizeVal, inputItem) &&
                    filterReordering(reorderingVal, inputItem) &&
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
