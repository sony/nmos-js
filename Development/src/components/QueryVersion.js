import Cookies from 'universal-cookie';
const cookies = new Cookies();

const QueryVersion = () => {
    let url = cookies.get('Query API');
    return url.match(/([^/]+)(?=\/?$)/g)[0];
};

export default QueryVersion;
