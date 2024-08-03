import { useState, useEffect } from 'react';

import softwaresApi from '../api/software-api';

export function useGetAllSoftwares() {
    const [softwares, setSoftwares] = useState([]);

    useEffect(() => {
        // useEffect doesn't allow async functions to be passed directly to it
        (async () => {
            const result = await softwaresApi.getAll();

            setSoftwares(result);
        })();
    }, []);

    return [softwares, setSoftwares];
}

export function useGetOneSoftware(softwareId) {
    const [software, setSoftware] = useState({});

    useEffect(() => {
        (async () => {
            const result = await softwaresApi.getOne(softwareId);

            setSoftware(result);
        })();
    }, [softwareId]);

    return [software, setSoftware];
}