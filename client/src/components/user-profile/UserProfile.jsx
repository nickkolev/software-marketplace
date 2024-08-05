import { Link } from 'react-router-dom';
import { useGetUserSoftwares } from '../../hooks/useSoftwares';
import { useAuthContext } from '../../contexts/AuthContext';
import softwaresApi from '../../api/software-api';

import styles from './UserProfile.module.css';

export default function UserProfile() {
    const { userId, email } = useAuthContext();
    const [softwares, setSoftwares] = useGetUserSoftwares(userId);

    // if (loading) {
    //     return <div>Loading...</div>;
    // }

    // if (error) {
    //     return <div>Error loading profile.</div>;
    // }

    const softwareDeleteHandler = async (softwareId, softwareTitle) => {
        const isConfirmed = confirm(`Are you sure you want to delete ${softwareTitle}?`);

        if (!isConfirmed) {
            return;
        }

        try {
            await softwaresApi.del(softwareId);
            setSoftwares(oldSoftwares => oldSoftwares.filter(software => software._id !== softwareId));
        } catch (error) {
            console.error('Failed to delete software', error);
        }
    }

    return (
        <div className={styles.userProfile}>
            <div className={styles.profileInfo}>
                <img src="images/Profile.webp" alt="profile picture" className={styles.profilePhoto} />
                <h2 className={styles.name}>{email}</h2>
            </div>

            <div className={styles.userSoftwares}>
                <h3>Your Softwares</h3>
                {softwares.length === 0 && <p>You haven't uploaded any software yet.</p>}
                {softwares.map(software => (
                    <div key={software._id} className={styles.software}>
                        <h4>{software.title}</h4>
                        <Link to={`/softwares/${software._id}/details`} className={styles.viewButton}>View</Link>
                        <Link to={`/softwares/${software._id}/edit`} className={styles.editButton}>Edit</Link>
                        <button className={styles.deleteButton} onClick={() => softwareDeleteHandler(software._id, software.title)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}