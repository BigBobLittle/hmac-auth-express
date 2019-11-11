const hmac = require('./../src/index.js');
const { HMACAuthError } = require('./../src/errors.js');

const mockedRequest = override => {
    return {
        headers: {
            authentication: 'HMAC 1573504737300:76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86'
        },
        method: 'POST',
        originalUrl: '/api/order',
        body: {
            foo: 'bar'
        },
        ...override || {},
    };
};

describe('hmac', () => {
    let spies = {};
    
    beforeEach(() => {
        spies.next = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        spies = {};
    });

    test('passes hmac', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = hmac('secret');

        middleware(mockedRequest(), undefined, spies.next);

        expect(spies.next).toHaveBeenLastCalledWith();

        global.Date.now = originalDateNow;
    });

    test('passes hmac without body', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;
        
        const middleware = hmac('secret');

        middleware(mockedRequest({
            headers: {
                authentication: 'HMAC 1573504737300:39f9c6b0ea547d46ac03d4e7b0acd1194c2a06f1037620ba7986f8eb017c98ba'
            },
            body: undefined
        }), undefined, spies.next);

        expect(spies.next).toHaveBeenLastCalledWith();

        global.Date.now = originalDateNow;
    });

    test('fails hmac on no header', () => {
        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: {} }), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Header provided not in sent headers. Expected authentication but not found in request.headers');
    });

    test('fails hmac on no header with custom header', () => {
        const middleware = hmac('secret', { header: 'myhmac' });

        middleware(mockedRequest({ headers: {} }), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Header provided not in sent headers. Expected myhmac but not found in request.headers');
    });

    test('fails hmac on incorrect identifier', () => {
        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: { authentication: 'FOO' } }), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Header did not start with correct identifier. Expected HMAC but not found in options.header');
    });

    test('fails hmac on incorrect identifier with custom identifier', () => {
        const middleware = hmac('secret', { identifier: 'BAR' });

        middleware(mockedRequest({ headers: { authentication: 'FOO' } }), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Header did not start with correct identifier. Expected BAR but not found in options.header');
    });

    test('fails if unix timestamp not found', () => {        
        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: { authentication: 'HMAC :a2bc3' } }), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Unix timestamp was not present in header');
    });

    test('fails if time difference too great', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573508732400;
        
        const middleware = hmac('secret');

        middleware(mockedRequest(), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('fails if time difference too great with custom time', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573591800000;

        // 1 day
        const middleware = hmac('secret', { maxInterval: 86400 });

        middleware(mockedRequest(), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('passes if within maxInterval', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573588200000;

        // 1 day
        const middleware = hmac('secret', { maxInterval: 86400 });

        middleware(mockedRequest(), undefined, spies.next);

        expect(spies.next).toHaveBeenLastCalledWith();

        global.Date.now = originalDateNow;
    });

    test('fails if time before timestamp in hmac', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1542055800000;

        const middleware = hmac('secret');

        middleware(mockedRequest(), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('Time difference between generated and requested time is too great');

        global.Date.now = originalDateNow;
    });

    test('fails if missing hmac digest', () => {
        const originalDateNow = Date.now.bind(global.Date);
        global.Date.now = () => 1573504737300;

        const middleware = hmac('secret');

        middleware(mockedRequest({ headers: { authentication: 'HMAC 1573504737300:' }}), undefined, spies.next);

        const calledArg = spies.next.mock.calls.pop()[0];
        expect(calledArg).toBeInstanceOf(HMACAuthError);
        expect(calledArg.message).toBe('HMAC digest was not present in header');

        global.Date.now = originalDateNow;
    });
});