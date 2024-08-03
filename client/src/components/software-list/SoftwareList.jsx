import { useGetAllSoftwares } from '../../hooks/useSoftwares';
import SoftwareListItem from './software-list-item/SoftwareListItem';

import styles from './SoftwareList.module.css';

export default function SoftwareList() {

    const [softwares, setSoftwares] = useGetAllSoftwares();

    return (
        <section className={styles.catalog}>
            <h2 className={styles.catalogTitle}>Softwares</h2>
            {softwares.length > 0 ? (
                <div className={styles.softwareList}>
                    {softwares.map(software => (
                        <SoftwareListItem key={software._id} software={software} />
                    ))}
                </div>
            ) : (
                <p className={styles.noSoftwaresMessage}>No software items have been added yet.</p>
            )}
        </section>
    );
}