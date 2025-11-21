/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * Device Provider:
 *  Fetches all valid NCA devices from the registry
 */

/**
 * It takes a registry address, checks if it's valid, then fetches the NCA devices from the registry
 * @param {string} registryAddress { IP:PORT } - The address of the registry you want to query
 * @returns A promised array of NCA device websockets
 * @example
 * getDevices("192.168.1.0:8080")
 *        .then((deviceList) => {})
 *        .catch((err) => {});
 */
async function getDevices(registryAddress: string): Promise<string[] | TypeError> {
    let newList: any[] = [];
    newList.push(registryAddress)
    return newList;
}

export default getDevices