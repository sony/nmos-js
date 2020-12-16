// some abbreviations used in IS-04 and IS-05 APIs
// or the nmos-cpp Logging API
const abbreviations = {
    api: 'API',
    caps: 'Capabilities',
    fec: 'FEC',
    fec1d: 'FEC1D',
    fec2d: 'FEC2D',
    href: 'Address',
    http: 'HTTP',
    id: 'ID',
    ip: 'IP',
    mqtt: 'MQTT',
    ms: '(ms)',
    ptp: 'PTP',
    rtcp: 'RTCP',
    rtp: 'RTP',
    uri: 'URI',
    url: 'URL',
    ws: 'WebSocket',
};

const labelize = source => {
    // '/meow.$purr.hiss_yowl_ms' => 'Meow Purr Hiss Yowl (ms)'
    const label = source
        .replace(/[ /$._]+/g, ' ')
        .trim()
        .replace(
            /\S+/g,
            word =>
                abbreviations[word.toLowerCase()] ||
                word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
        );
    return label;
};

export default labelize;
