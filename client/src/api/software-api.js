import * as request from './requester';

const BASE_URL = 'http://localhost:3030/jsonstore/softwares';

export const getAll = async () => {
    const result = await request.get(BASE_URL);

    const softwares = Object.values(result);

    return softwares;
}

export const getOne = async (softwareId) => {
    const software = await request.get(`${BASE_URL}/${softwareId}`);

    return software;
}

export const create = (softwareData) => request.post(`${BASE_URL}`, softwareData);

const softwaresApi = {
    getOne,
    getAll,
    create,
}

export default softwaresApi;