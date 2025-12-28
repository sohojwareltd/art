import axios from 'axios';

const MET_MUSEUM_API = 'https://collectionapi.metmuseum.org/public/collection/v1';

const metMuseumClient = axios.create({
    baseURL: MET_MUSEUM_API,
    headers: {
        'Accept': 'application/json',
    },
    timeout: 10000,
});

export default metMuseumClient;

