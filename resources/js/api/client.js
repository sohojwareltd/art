import axios from 'axios';

const client = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    withCredentials: true,
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            // Don't redirect for /user endpoint (used for auth checking)
            if (!url.includes('/user')) {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default client;

