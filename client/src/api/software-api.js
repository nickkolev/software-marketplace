import * as request from './requester';

const BASE_URL = 'http://localhost:3030/data/softwares';

export const getAll = async () => {
    const result = await request.get(BASE_URL);

    const softwares = Object.values(result);

    return softwares;
}

export const getLatest = async () => {
    const result = await request.get(`${BASE_URL}?sortBy=_createdOn desc&pageSize=3`);

    const latestSoftwares = Object.values(result);

    return latestSoftwares;
}

export const getOne = async (softwareId) => {
    const software = await request.get(`${BASE_URL}/${softwareId}`);

    return software;
}

export const create = (softwareData) => request.post(`${BASE_URL}`, softwareData);

export const del = (softwareId) => request.del(`${BASE_URL}/${softwareId}`);

export const update = (softwareId, softwareData) => request.put(`${BASE_URL}/${softwareId}`, softwareData);

export const getUserSoftwares = async (userId) => {
    const result = await request.get(`${BASE_URL}?where=_ownerId%3D%22${userId}%22`);

    const softwares = Object.values(result);

    return softwares;
}

const softwaresApi = {
    getOne,
    getAll,
    create,
    del,
    update,
    getLatest,
    getUserSoftwares,
}

export default softwaresApi;