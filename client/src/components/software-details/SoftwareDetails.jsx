import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import styles from './SoftwareDetails.module.css';

import softwaresApi from '../../api/software-api';

export default function SoftwareDetails() {
    const [software, setSoftware] = useState({});
    const { softwareId } = useParams();

    useEffect(() => {
        (async () => {
            const result = await softwaresApi.getOne(softwareId);

            setSoftware(result);
        })();
    }, []);

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

                {/* <div className={styles.commentsSection}>
                    <h3>Comments</h3>
                    {comments.map(comment => (
                        <div key={comment.id} className={styles.comment}>
                            <p><strong>{comment.user}</strong>: {comment.text}</p>
                        </div>
                    ))}

                    {loggedInUser && (
                        <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                            <textarea
                                value={newComment}
                                onChange={handleCommentChange}
                                className={styles.commentInput}
                                placeholder="Write a comment..."
                            ></textarea>
                            <button type="submit" className={styles.commentButton}>Submit</button>
                        </form>
                    )}
                </div> */}
            </div>
        </div>
    );
}