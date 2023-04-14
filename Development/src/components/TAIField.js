import { Tooltip } from '@material-ui/core';
import HintTypography from './HintTypography';
import tai from 't-a-i';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import get from 'lodash/get';
dayjs.extend(utc);

const TAIField = ({ record, source, mode }) => (
    <div key={source}>
        <Tooltip
            interactive
            title={TAIConversion(record, source, mode)}
            placement="right"
            arrow
        >
            <HintTypography variant="body2">
                {get(record, source)}
            </HintTypography>
        </Tooltip>
    </div>
);

const TAIConversion = (record, source, mode) => {
    try {
        const taiData = get(record, source).split(':', 2);
        if (!taiData[0] || !taiData[1]) return '';
        const taiTimeMilliseconds = 1e3 * taiData[0] + taiData[1] / 1e6;
        if (get(record, mode) === 'activate_scheduled_relative') {
            return dayjs(taiTimeMilliseconds).utc().format('HH:mm:ss.SSS');
        }
        const unixTimeMilliseconds = tai.oneToMany.atomicToUnix(
            taiTimeMilliseconds
        );
        return dayjs(unixTimeMilliseconds).format('YYYY-MM-DD HH:mm:ss.SSS Z');
    } catch (e) {
        return `Conversion Error - ${e}`;
    }
};

TAIField.defaultProps = {
    addLabel: true,
};

export default TAIField;
