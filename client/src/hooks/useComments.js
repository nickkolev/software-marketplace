import { useEffect, useState } from 'react';
import commentsAPI from '../api/comments-api';

export function useCreateComment() {
    const createHandler = (softwareId, comment) => commentsAPI.create(softwareId, comment);

    return createHandler;
}

export function useGetAllComments(softwareId) {
    const [comments, setComments] = useState([]);

    useEffect(() => {
        (async () => {
            const comments = await commentsAPI.getAll(softwareId);

            setComments(comments);
        })();
    }, [softwareId]);

    return [comments, setComments];
}