import { useState } from 'react';
import { useParams } from 'react-router-dom';

import styles from './SoftwareDetails.module.css';

import commentsAPI from '../../api/comments-api';
import { useGetOneSoftware } from '../../hooks/useSoftwares';

export default function SoftwareDetails() {
    const { softwareId } = useParams();
    const [username, setUsername] = useState('');
    const [comment, setComment] = useState('');
    const [software, setSoftware] = useGetOneSoftware(softwareId);

    const commentSubmitHandler = async (e) => {
        e.preventDefault();

        const newComment = await commentsAPI.create(softwareId, username, comment);

        // TODO: this will be refactored
        setSoftware(prevState => ({
            ...prevState,
            comments: {
                ...prevState.comments,
                [newComment._id]: newComment
            }
        }));

        setUsername('');
        setComment('');
    }

    return (
        <div className={styles.softwareDetails}>
            <img src={software.imageUrl} alt={software.title} className={styles.softwareImage} />
            <div className={styles.details}>
                <h2 className={styles.title}>{software.title}</h2>
                <p className={styles.description}>{software.description}</p>
                <p className={styles.version}>Version: {software.version}</p>
                <p className={styles.category}>Category: {software.category}</p>
                <p className={styles.size}>Size: {software.size}</p>
                <p className={styles.operatingSystem}>OS: {software.operatingSystem}</p>
                <p className={styles.instructions}>Instructions: {software.instructions}</p>
                <a href={software.downloadUrl} className={styles.downloadButton}>Download</a>

                {/* {loggedInUser && loggedInUser.id === software.authorId && (
                    <div className={styles.editButtons}>
                        <button className={styles.editButton}>Edit</button>
                        <button className={styles.deleteButton}>Delete</button>
                    </div>
                )} */}

                <div className={styles.commentsSection}>
                    <h3>Comments</h3>

                    {software.comments ? (
                        Object.values(software.comments).map(comment => (
                            <div key={comment._id} className={styles.comment}>
                                <p><strong>{comment.username}</strong>: {comment.text}</p>
                            </div>
                        ))
                    ) : (
                        <p className={styles.noCommentsMessage}>No comments yet. Be the first to comment!</p>
                    )}

                    {/* {loggedInUser && ( */}
                        <label>Add new comment:</label>
                        <form className={styles.commentForm} onSubmit={commentSubmitHandler}>
                            <input 
                                type='text' 
                                placeholder='Pesho' 
                                name='username'
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                            ></input>

                            <textarea 
                                placeholder='Comment...' 
                                name='comment' 
                                onChange={(e) => setComment(e.target.value)}
                                value={comment}
                            ></textarea>

                            <button type="submit" className={styles.commentButton}>Submit</button>
                        </form>
                    {/* )} */}
                </div>
            </div>
        </div>
    );
}