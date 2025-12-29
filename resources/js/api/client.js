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
            // Don't redirect for save/unsave operations - let them handle the error
            if (!url.includes('/user') && !url.includes('/save')) {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default client;

