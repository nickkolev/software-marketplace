import { useState, useEffect } from "react";
import softwaresApi from "../../api/software-api";
import SoftwareListItem from './software-list-item/SoftwareListItem';

import styles from './SoftwareList.module.css';

export default function SoftwareList() {

    const [latestSoftwares, setLatestSoftwares] = useState([]);

    useEffect(() => {
        // useEffect doesn't allow async functions to be passed directly to it
        (async () => {
            const result = await softwaresApi.getAll();
            console.log(result);

            setLatestSoftwares(result);
        })();
    }, []);

    return (
        <section className={styles.catalog}>
            <h2 className={styles.catalogTitle}>Latest Softwares</h2>
            {latestSoftwares.length > 0 ? (
                <div className={styles.softwareList}>
                    {latestSoftwares.map(software => (
                        <SoftwareListItem key={software._id} software={software} />
                    ))}
                </div>
            ) : (
                <p className={styles.noSoftwaresMessage}>No software items have been added yet.</p>
            )}
        </section>
    );
}