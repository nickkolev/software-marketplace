import requester from "./requester"

const BASE_URL = 'http://localhost:3030/jsonstore/softwares/';

const buildUrl = (softwareId) => `${BASE_URL}/${softwareId}/comments`;

const create = async (softwareId, username, text) => requester.post(buildUrl(softwareId), { username, text });

const getAll = async (softwareId) => {
    const result = await requester.get(buildUrl(softwareId));

    const comments = Object.values(result);

    return comments;
} 

const commentsAPI = {
    create,
    getAll,
}

export default commentsAPI;