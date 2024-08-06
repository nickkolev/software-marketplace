import { Link } from 'react-router-dom';
import { useGetUserSoftwares } from '../../hooks/useSoftwares';
import { useAuthContext } from '../../contexts/AuthContext';
import softwaresApi from '../../api/software-api';
import { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

import styles from './UserProfile.module.css';

export default function UserProfile() {
    const { userId, email } = useAuthContext();
    const [softwares, setSoftwares] = useGetUserSoftwares(userId);
    const [deleteError, setDeleteError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [softwareToDelete, setSoftwareToDelete] = useState(null);

    const handleOpenDialog = (softwareId, softwareTitle) => {
        setSoftwareToDelete({ id: softwareId, title: softwareTitle });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSoftwareToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!softwareToDelete) return;

        const { id } = softwareToDelete;

        try {
            await softwaresApi.del(id);
            setSoftwares(oldSoftwares => oldSoftwares.filter(software => software._id !== id));
            setDeleteError('');
        } catch (error) {
            setDeleteError('Failed to delete software: ' + error.message);
        } finally {
            handleCloseDialog();
        }
    };

    return (
        <div className={styles.userProfile}>
            <div className={styles.profileInfo}>
                <img src="images/Profile.webp" alt="profile picture" className={styles.profilePhoto} />
                <h2 className={styles.name}>{email}</h2>
            </div>

            <div className={styles.userSoftwares}>
                <h3>Your Softwares</h3>
                {deleteError && (
                    <p className={styles.errorMessage}>{deleteError}</p>
                )}
                {softwares.length === 0 && <p>You haven't uploaded any software yet.</p>}
                {softwares.map(software => (
                    <div key={software._id} className={styles.software}>
                        <h4>{software.title}</h4>
                        <Link to={`/softwares/${software._id}/details`} className={styles.viewButton}>View</Link>
                        <Link to={`/softwares/${software._id}/edit`} className={styles.editButton}>Edit</Link>
                        <button
                            className={styles.deleteButton}
                            onClick={() => handleOpenDialog(software._id, software.title)}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{softwareToDelete?.title}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="secondary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
