import { useParams } from 'react-router-dom';

import styles from './SoftwareDetails.module.css';
import { useGetOneSoftware } from '../../hooks/useSoftwares';
import { useForm } from '../../hooks/useForm';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCreateComment, useGetAllComments } from '../../hooks/useComments';

const initialValues = {
    comment: '',
};

export default function SoftwareDetails() {
    const { softwareId } = useParams();
    const [comments, setComments] = useGetAllComments(softwareId);
    const createComment = useCreateComment();
    const { software } = useGetOneSoftware(softwareId);
    const { isAuthenticated } = useAuthContext();

    const {
        changeHandler,
        submitHandler,
        values,
    } = useForm(initialValues, async ({ comment }) => {
        try {
            const newComment = await createComment(softwareId, comment); 

            setComments(oldComments => [...oldComments, newComment]);
        } catch (error) {
            console.log(error.message);
        }
    });

    if (software === undefined) {
        return <div>Loading...</div>;
    }

    if (!software) {
        return <div>No software found.</div>;
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

                    {comments.map(comment => (
                            <div key={comment._id} className={styles.comment}>
                                <p><strong>{comment.author.email}</strong>: {comment.text}</p>
                            </div>
                        ))
                    }

                    {comments.length === 0 && <p className={styles.noCommentsMessage}>No comments yet. Be the first to comment!</p>}

                    {isAuthenticated && (
                        <>
                            <label>Add new comment:</label>
                            <form className={styles.commentForm} onSubmit={submitHandler}>
                                <textarea
                                    placeholder='Comment...'
                                    name='comment'
                                    onChange={changeHandler}
                                    value={values.comment}
                                ></textarea>

                                <button type="submit" className={styles.commentButton}>Submit</button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}