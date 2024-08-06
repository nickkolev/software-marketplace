import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGetOneSoftware } from '../../hooks/useSoftwares';
import { useForm } from '../../hooks/useForm';
import { useCreateComment, useGetAllComments } from '../../hooks/useComments';
import { useAuthContext } from '../../contexts/AuthContext';
import softwaresApi from '../../api/software-api';

import styles from './SoftwareDetails.module.css';

const initialValues = {
    comment: '',
};

export default function SoftwareDetails() {
    const navigate = useNavigate();
    const { softwareId } = useParams();
    const [comments, setComments] = useGetAllComments(softwareId);
    const createComment = useCreateComment();
    const { isAuthenticated, userId, email } = useAuthContext();
    const [software] = useGetOneSoftware(softwareId);

    const {
        changeHandler,
        submitHandler,
        values,
    } = useForm(initialValues, async ({ comment }) => {
        try {
            const newComment = await createComment(softwareId, comment, email); 

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

    const softwareDeleteHandler = async () => {
        const isConfirmed = confirm(`Are you sure you want to delete ${software.title}?`);

        if (!isConfirmed) {
            return;
        }

        try {
            await softwaresApi.del(softwareId);

            navigate('/');
        } catch (error) {
            console.error('Failed to delete software', error);
        }
    }

    const isOwner = userId === software._ownerId;

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
 
                {(isOwner && isAuthenticated) && (
                <div className={styles.editButtons}>
                    <Link to={`/softwares/${softwareId}/edit`} className={styles.editButton}>Edit</Link>
                    <button className={styles.deleteButton} onClick={softwareDeleteHandler}>Delete</button>
                </div>
                )}

                <div className={styles.commentsSection}>
                    <h3>Comments</h3>

                    {comments && comments.length > 0 ? (
                        comments.map(comment => (
                            <div key={comment._id} className={styles.comment}>
                                {comment.text && comment.email ? (
                                    <p><strong>{comment.email}</strong>: {comment.text}</p>
                                ) : (
                                    <p><strong>Anonymous</strong>: {comment.text}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className={styles.noCommentsMessage}>No comments yet. Be the first to comment!</p>
                    )}

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
