import { cloneDeep, get, has } from 'lodash';

const channelIncludes = (label, channelLabelReg) =>
    RegExp(channelLabelReg, 'i').test(label);

const filterChannelLabel = (channelLabelReg, item, getCustomChannelLabel) =>
    !channelLabelReg ||
    Object.entries(item.channels).some(
        ([channelIndex, channelItem]) =>
            channelIncludes(channelItem.label, channelLabelReg) ||
            channelIncludes(
                getCustomChannelLabel(channelIndex),
                channelLabelReg
            )
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
    ioResource,
    getCustomName
) => {
    if (channelLabelReg) {
        for (const [id, item] of Object.entries(filteredIo)) {
            const getCustomChannelLabel = channelIndex =>
                getCustomName(`${ioResource}.${id}.channels.${channelIndex}`);
            if (
                filterChannelLabel(channelLabelReg, item, getCustomChannelLabel)
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
                                getCustomChannelLabel(channelIndex),
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

export const getFilteredInputs = (filter, inputs, getCustomName) => {
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
                        getCustomName(`inputs.${inputId}.name`)
                    ) &&
                    filterBlockSize(blockSizeVal, inputItem) &&
                    filterReordering(reorderingVal, inputItem) &&
                    filterChannelLabel(
                        inputChannelLabelReg,
                        inputItem,
                        channelIndex =>
                            getCustomName(
                                `inputs.${inputId}.channels.${channelIndex}`
                            )
                    )
            )
        );
        filterIOByChannels(
            inputChannelLabelReg,
            filteredInputs,
            'inputs',
            getCustomName
        );
    }
    return filteredInputs;
};

export const getFilteredOutputs = (
    filter,
    outputs,
    getInputAPIName,
    getCustomName
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
                        getCustomName(`outputs.${outputId}.name`)
                    ) &&
                    filterRoutableInputs(
                        routableInputsReg,
                        outputItem,
                        getInputAPIName,
                        inputId => getCustomName(`inputs.${inputId}.name`)
                    ) &&
                    filterChannelLabel(
                        outputChannelLabelReg,
                        outputItem,
                        channelIndex =>
                            getCustomName(
                                `outputs.${outputId}.channels.${channelIndex}`
                            )
                    )
            )
        );
        filterIOByChannels(
            outputChannelLabelReg,
            filteredOutputs,
            'outputs',
            getCustomName
        );
    }
    return filteredOutputs;
};
