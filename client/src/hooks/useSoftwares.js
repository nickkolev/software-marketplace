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
    const [software, setSoftware] = useState(undefined); // Initialize as undefined

    useEffect(() => {
        (async () => {
            try {
                const result = await softwaresApi.getOne(softwareId);
                setSoftware(result);
            } catch (error) {
                console.error('Failed to fetch software', error);
            }
        })();
    }, [softwareId]);

    return { software, setSoftware };
}

export function useCreateSoftware() {
    
    const softwareCreateHandler = (softwareData) => softwaresApi.create(softwareData)

    return softwareCreateHandler;
}