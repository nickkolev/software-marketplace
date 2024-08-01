import { Link } from 'react-router-dom';

import styles from './SoftwareListItem.module.css';

export default function SoftwareListItem({ software }) {
    const { _id, title, category, imageUrl, size, version } = software;
    return (
        <div className={styles.softwareCard} key={_id}>
            <img src={imageUrl} alt={title} className={styles.softwareImage} />
            <div className={styles.softwareDetails}>
                <h3 className={styles.softwareTitle}>{title}</h3>
                <p className={styles.softwareCategory}>{category}</p>
                <p className={styles.softwareSize}>Size: {size}</p>
                <p className={styles.softwareVersion}>Version: {version}</p>
                <div className={styles.softwareButtons}>
                    <Link className={`${styles.softwareButton} ${styles.detailsButton}`} to={`/softwares/${_id}/details`}>Details</Link>
                    <Link className={`${styles.softwareButton} ${styles.downloadButton}`} to={'/'}>Download</Link>
                </div>
            </div>
        </div>
    );
}
