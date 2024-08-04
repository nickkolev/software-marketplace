import requester from "./requester"

const BASE_URL = 'http://localhost:3030/data/comments/';

const create = (softwareId, text) => requester.post(BASE_URL, { softwareId, text });

const getAll = (softwareId) => {
    const params = new URLSearchParams({
        where: `softwareId="${softwareId}"`,
        load: `author=_ownerId:users`
    });

    return requester.get(`${BASE_URL}?${params.toString()}`);
}

const commentsAPI = {
    create,
    getAll,
}

export default commentsAPI;