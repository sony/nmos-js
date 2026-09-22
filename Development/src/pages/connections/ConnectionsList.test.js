import { isConnectionsAxisTruncated } from './ConnectionsList';

describe('isConnectionsAxisTruncated', () => {
    it('reports a full page as possibly truncated', () => {
        expect(isConnectionsAxisTruncated(10, 10)).toBe(true);
    });

    it('does not report fewer results than the paging limit', () => {
        expect(isConnectionsAxisTruncated(5, 10)).toBe(false);
        expect(isConnectionsAxisTruncated(0, 10)).toBe(false);
    });
});
