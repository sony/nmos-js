import decodeJwt from 'jwt-decode';
import CryptoJS from 'crypto-js';
import { AUTH_API, apiUrl, authClientId } from './settings';

const isExpired = access_token => {
    const now = Date.now().valueOf() / 1000;
    if (typeof access_token.exp !== 'undefined' && access_token.exp < now) {
        return true;
    }
    if (typeof access_token.nbf !== 'undefined' && access_token.nbf > now) {
        return true;
    }
    return false;
};

const makeSearchParams = params => {
    let searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        searchParams.append(key, value);
    }
    return searchParams;
};

const startTimer = (onExpired, timer, timeout, token) => {
    if (timer) {
        clearTimeout(timer);
    }
    return setTimeout(onExpired, timeout, token, timeout);
};

const stopTimer = timer => {
    if (timer) {
        clearTimeout(timer);
    }
};

const getAuthSettings = () => {
    // more to add here...
    const client_id = authClientId();
    const server_metadata_endpoint = apiUrl(AUTH_API);
    const redirect_uri = 'http://localhost:3000/login';
    const scope = 'query connection openid';
    return {
        client_id,
        server_metadata_endpoint,
        redirect_uri,
        scope,
    };
};

// from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
//
const makeid = length => {
    let result = '';
    //characters modified to include ALL allowed characters from https://tools.ietf.org/html/rfc7636#section-4.1
    //var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
};

const base64URL = string => {
    return string
        .toString(CryptoJS.enc.Base64)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};

// code_verifier = high-entropy cryptographic random STRING using the
// unreserved characters[A - Z] / [a - z] / [0 - 9] / "-" / "." / "_" / "~"
// from Section 2.3 of[RFC3986], with a minimum length of 43 characters
// and a maximum length of 128 characters
// see https://tools.ietf.org/html/rfc7636#section-4.1
const makeCodeVerifier = () => {
    return makeid(128);
};

// creates code challenge from code verifier
// see https://tools.ietf.org/html/rfc7636#section-4.2
const makeCodeChallenge = code_verifier => {
    return new Promise((resolve, reject) => {
        return resolve(base64URL(CryptoJS.SHA256(code_verifier)));
    });
};

const makeLoginURI = (
    auth_endpoint,
    client_id,
    redirect_uri,
    code_challange,
    state,
    scope
) => {
    let uri = new URL(auth_endpoint);
    uri.searchParams.append('client_id', client_id);
    uri.searchParams.append(
        'redirect_uri',
        redirect_uri.toString(CryptoJS.enc.Hex)
    );
    uri.searchParams.append('response_type', 'code');
    uri.searchParams.append('code_challenge', code_challange);
    uri.searchParams.append('code_challenge_method', 'S256');
    uri.searchParams.append('state', state);
    uri.searchParams.append('scope', scope.toString(CryptoJS.enc.Hex));
    return uri.toString();
};

const makeLogoutURI = (logout_endpoint, redirect_uri, id_token) => {
    let uri = new URL(logout_endpoint);
    if (redirect_uri !== null) {
        uri.searchParams.append(
            'post_logout_redirect_uri',
            redirect_uri.toString(CryptoJS.enc.Hex)
        );
    }
    if (id_token !== null) {
        uri.searchParams.append('id_token_hint', id_token);
    }
    return uri.toString();
};

export const makeBasicAuthHeader = () => {
    const { client_id } = getAuthSettings();
    const creds_utf8 = client_id.toString(CryptoJS.enc.Utf8);
    return { Authorization: 'Basic ' + btoa(creds_utf8) };
};

export const makeBearerAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (token) {
        const bearer_token = JSON.parse(token);
        return { Authorization: `Bearer ${bearer_token.access_token}` };
    }
    return null;
};

const fetchServerMetadata = () => {
    const { server_metadata_endpoint } = getAuthSettings();
    return fetch(server_metadata_endpoint).then(response => {
        if (response.ok) {
            return Promise.resolve(response.json());
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    });
};

const fetchUserInfo = () => {
    const metadata = JSON.parse(sessionStorage.getItem('metadata'));
    // is openID Connect Authorization Server
    if ('userinfo_endpoint' in metadata) {
        const userinfo_endpoint = metadata.userinfo_endpoint;
        const request = new Request(userinfo_endpoint, {
            method: 'GET',
            headers: { Authorization: makeBearerAuthHeader().Authorization },
        });
        return fetch(request).then(response => {
            if (response.ok) {
                return Promise.resolve(response.json());
            } else {
                return Promise.reject(new Error(response.statusText));
            }
        });
    }

    // return null for none openID Connect Authorization Server
    return Promise.resolve();
};

// token revocation see https://tools.ietf.org/html/rfc7009#section-2.1
const tokenRevocation = () => {
    const metadata = JSON.parse(sessionStorage.getItem('metadata'));
    // is revocation_endpoint supported by Authorization Server
    if (metadata && 'revocation_endpoint' in metadata) {
        const revocation_endpoint = metadata.revocation_endpoint;

        let headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', makeBasicAuthHeader().Authorization);

        let refresh_token = '';
        const token = localStorage.getItem('token');
        if (token) {
            const bearer_token = JSON.parse(token);
            refresh_token = bearer_token.refresh_token;
        }

        const request = new Request(revocation_endpoint, {
            method: 'POST',
            headers: headers,
            body: makeSearchParams({
                token: refresh_token,
                token_type_hint: 'refresh_token',
            }),
        });

        return fetch(request)
            .then(response => {
                if (!response.ok) {
                    console.warn('tokenRevocation:', response.statusText);
                }
                return Promise.resolve();
            })
            .catch(error => {
                console.log(error);
            });
    }

    // return null for Authorization Server not supporting revocation_endpoint
    return Promise.resolve();
};

const handleLogoutRequest = () => {
    const metadata = JSON.parse(sessionStorage.getItem('metadata'));
    // is openID Connect Authorization Server
    if (metadata && 'end_session_endpoint' in metadata) {
        const end_session_endpoint = metadata.end_session_endpoint;
        const token = localStorage.getItem('token');
        let id_token;
        if (token) {
            const bearer_token = JSON.parse(token);
            id_token = bearer_token.id_token;
        }
        //const { redirect_uri } = getAuthSettings();
        const logoutURI = makeLogoutURI(end_session_endpoint, null, id_token);
        return fetch(logoutURI).then(response => {
            //console.log(response);
            if (response.status <= 200 || response.status >= 300) {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(response.statusText));
            }
        });
    }

    // do return for none openID Connect Authorization Server
    return Promise.resolve();
};

let refreshTokenTimer;
const REFRESH_TOKEN_RETRY_LIMIT = 5;
let refreshTokenRetries = REFRESH_TOKEN_RETRY_LIMIT;

const fetchToken = searchParams => {
    const metatdata = JSON.parse(sessionStorage.getItem('metadata'));
    if (metatdata) {
        const token_endpoint = metatdata.token_endpoint;

        let headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');

        const { client_id } = getAuthSettings();
        searchParams.append('client_id', client_id.toString(CryptoJS.enc.Hex));

        const request = new Request(token_endpoint, {
            method: 'POST',
            headers: headers,
            body: searchParams,
        });
        return fetch(request).then(response => {
            if (response.ok) {
                return Promise.resolve(response.json());
            } else {
                return Promise.reject(new Error(response.statusText));
            }
        });
    }

    return Promise.reject(new Error('no token_endpoint'));
};

const refreshToken = (refresh_token, expires_in) => {
    fetchToken(
        makeSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
        })
    )
        .then(bearer_token => {
            console.log(
                new Date().toLocaleString('en-GB'),
                'refreshed bearer_token:',
                bearer_token
            );
            // do access token refresh in half-life of the token
            const timeout = (bearer_token.expires_in / 2) * 1000; // in ms
            refreshTokenTimer = startTimer(
                refreshToken,
                refreshTokenTimer,
                timeout,
                bearer_token.refresh_token
            );
            localStorage.setItem('token', JSON.stringify(bearer_token));
            refreshTokenRetries = REFRESH_TOKEN_RETRY_LIMIT;
        })
        .catch(error => {
            // TODO...
            console.error('refreshToken failed: ', error);
            // inform user with error message?
            // try token fetch again in half of the reminding access token life
            if (refreshTokenRetries > 0 && expires_in > 0) {
                console.warn(
                    'will retry refreshTokenTimer ' +
                        refreshTokenRetries +
                        ' more times'
                );
                refreshTokenRetries--;
                const timeout = expires_in / 2;
                refreshTokenTimer = startTimer(
                    refreshToken,
                    refreshTokenTimer,
                    timeout,
                    refresh_token
                );
            } else {
                console.warn('refreshTokenTimer stopped!');
            }
        });
};

const authCodeToToken = (state, code, code_verifier) => {
    // verify state
    if (state.toString() !== sessionStorage.getItem('oauth_state')) {
        return Promise.reject(new Error('miss-matched OAuth state'));
    }

    // exchange code for token
    const { redirect_uri, scope } = getAuthSettings();
    return fetchToken(
        makeSearchParams({
            grant_type: 'authorization_code',
            code: code.toString(CryptoJS.enc.Hex),
            redirect_uri: redirect_uri.toString(CryptoJS.enc.Hex),
            code_verifier: code_verifier.toString(CryptoJS.enc.Hex),
            scope: scope,
        })
    );
};

const handleLoginRequest = () => {
    console.log('handleLoginRequest');

    const code_verifier = makeCodeVerifier();

    return fetchServerMetadata()
        .then(metadata => {
            sessionStorage.setItem('metadata', JSON.stringify(metadata));
            console.log(JSON.parse(sessionStorage.getItem('metadata')));
        })
        .then(() => makeCodeChallenge(code_verifier))
        .then(code_challange => {
            // Generate state
            const state = makeid(32);
            sessionStorage.setItem('oauth_code_verifier', code_verifier);
            sessionStorage.setItem('oauth_state', state);

            const { client_id, redirect_uri, scope } = getAuthSettings();
            const auth_endpoint = JSON.parse(
                sessionStorage.getItem('metadata')
            ).authorization_endpoint;
            const uri = makeLoginURI(
                auth_endpoint,
                client_id,
                redirect_uri,
                code_challange,
                state,
                scope
            );

            // redirect to the uri
            window.location.replace(uri);
        });
};

const setUnauthenticatedState = () => {
    if ('token' in localStorage) {
        localStorage.removeItem('token');
    }
    if ('user' in localStorage) {
        localStorage.removeItem('user');
    }
    stopTimer(refreshTokenTimer);
    refreshTokenTimer = null;
};

const checkForAuthenticationCodeFlow = () => {
    const url = window.location;

    if (new URLSearchParams(url.search).get('error')) {
        const errorMessage = new URLSearchParams(url.search).get('error');
        console.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
    } else if (new URLSearchParams(url.search).get('code')) {
        // exchange code for token
        const searchParams = new URLSearchParams(url.search);
        const state = searchParams.get('state');
        const code = searchParams.get('code');
        const code_verifier = sessionStorage.getItem('oauth_code_verifier');

        // store placeholder for the user to avoid checkAuth() failing while
        // user metadata is being fetched
        localStorage.setItem(
            'user',
            JSON.stringify({ id: '', fullName: '', avatar: '' })
        );

        // get rid of parameters in address bar
        window.history.replaceState({}, document.title, '/#/');

        return authCodeToToken(state, code, code_verifier)
            .then(bearer_token => {
                console.log(
                    new Date().toLocaleString('en-GB'),
                    'authCodeToToken bearer_token:',
                    bearer_token
                );
                // do access token refresh in half-life of the token
                const timeout = (bearer_token.expires_in / 2) * 1000; // in ms
                refreshTokenTimer = startTimer(
                    refreshToken,
                    refreshTokenTimer,
                    timeout,
                    bearer_token.refresh_token
                );
                localStorage.setItem('token', JSON.stringify(bearer_token));
            })
            .then(() => fetchUserInfo())
            .then(user_info => {
                //console.log('user_info: ', user_info);
                let user = { id: 'user', fullName: 'user', avatar: '' };
                if (user_info) {
                    user = {
                        id: user_info.sub,
                        fullName: user_info.name
                            ? user_info.name
                            : user_info.preferred_username,
                        avatar: '',
                    };
                }
                localStorage.setItem('user', JSON.stringify(user));
            });
    }

    return Promise.resolve();
};

const isPageSecured = () => {
    const url = window.location;

    console.log(url);
    const securedPages = [
        'nodes',
        'devices',
        'sources',
        'flows',
        'senders',
        'receivers',
        'subscriptions',
        'queryapis',
        'logs',
    ];

    function checkPage(value) {
        if (url.href.includes(value)) {
            return true;
        }

        return false;
    }

    return securedPages.filter(checkPage).length;
};

const authProvider = {
    login: () => {
        console.log('authProvider: login');

        return handleLoginRequest();
    },
    checkError: error => {
        console.log('authProvider: checkError');

        const status = error.status;
        if (status === 401 || status === 403) {
            setUnauthenticatedState();
            return Promise.reject();
        }
        // other error code (404, 500, etc): no need to log out
        return Promise.resolve();
    },
    checkAuth: () => {
        console.log('authProvider: checkAuth');

        return checkForAuthenticationCodeFlow().then(() => {
            if (!localStorage.getItem('user') && isPageSecured()) {
                return Promise.reject({
                    redirectTo: '',
                    message: 'Please Log In',
                });
            }

            const token = localStorage.getItem('token');

            // is access token in cache
            if (token === null) {
                if (isPageSecured()) {
                    setUnauthenticatedState();
                    return Promise.reject({
                        redirectTo: '',
                        message: 'Please Log In',
                    });
                }
            } else {
                const bearer_token = JSON.parse(token);
                if (bearer_token.access_token) {
                    if (isExpired(decodeJwt(bearer_token.access_token))) {
                        return Promise.reject({
                            redirectTo: '',
                            message: 'Please Log In',
                        });
                    }
                } else if (isPageSecured()) {
                    setUnauthenticatedState();
                    return Promise.reject({
                        redirectTo: '',
                        message: 'Please Log In',
                    });
                }

                // start token refresh timer if it has not been started yet!
                if (!refreshTokenTimer) {
                    refreshTokenTimer = startTimer(
                        refreshToken,
                        refreshTokenTimer,
                        0,
                        bearer_token.refresh_token
                    );
                }
            }

            return Promise.resolve();
        });
    },
    logout: () => {
        console.log('authProvider: logout');

        return tokenRevocation()
            .then(() => handleLogoutRequest())
            .then(() => setUnauthenticatedState());
    },
    getIdentity: () => {
        console.log('authProvider: getIdentity');
        return checkForAuthenticationCodeFlow()
            .then(() => {
                try {
                    return Promise.resolve(
                        JSON.parse(localStorage.getItem('user'))
                    );
                } catch (error) {
                    return Promise.reject(error);
                }
            })
            .catch(error => {
                console.error(error);
                return Promise.reject(error);
            });
    },
    getPermissions: () => {
        console.log('authProvider: getPermissions');

        const role = localStorage.getItem('role');
        return role ? Promise.resolve(role) : Promise.resolve('guest');
    },
};

export default authProvider;
