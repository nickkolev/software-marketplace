import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGetOneSoftware } from '../../hooks/useSoftwares';
import { useForm } from '../../hooks/useForm';
import { useState } from 'react';
import { useCreateComment, useGetAllComments } from '../../hooks/useComments';
import { useAuthContext } from '../../contexts/AuthContext';
import softwaresApi from '../../api/software-api';

import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button
} from '@mui/material';

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
    const [commentError, setCommentError] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [open, setOpen] = useState(false);

    const {
        changeHandler,
        submitHandler,
        values,
    } = useForm(initialValues, async ({ comment }) => {
        try {
            const newComment = await createComment(softwareId, comment, email); 

            setComments(oldComments => [...oldComments, newComment]);

            setCommentError('');
        } catch (error) {
            setCommentError(error.message);
        }
    });

    if (software === undefined) {
        return <div>Loading...</div>;
    }

    if (!software) {
        return <div>No software found.</div>;
    }

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const softwareDeleteHandler = async () => {
        try {
            await softwaresApi.del(softwareId);
            navigate('/');
            handleClose();
        } catch (error) {
            setDeleteError('Failed to delete software: ' + error.message);
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
                    <button className={styles.deleteButton} onClick={handleClickOpen}>Delete</button>
                    {deleteError && (
                        <p className={styles.errorMessage}>{deleteError}</p>
                    )}
                </div>
                )}

                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete {software.title}?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={softwareDeleteHandler} color="secondary">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

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

                                {commentError && (
                                    <p className={styles.errorMessage}>{commentError}</p>
                                )}
                                
                                <button type="submit" className={styles.commentButton}>Submit</button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
