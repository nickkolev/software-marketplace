import { useState } from 'react';
import { useGetAllSoftwares } from '../../hooks/useSoftwares';
import SoftwareListItem from './software-list-item/SoftwareListItem';
import { TextField } from '@mui/material';

import styles from './SoftwareList.module.css';

export default function SoftwareList() {
    const [softwares, setSoftwares] = useGetAllSoftwares();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSoftwares = softwares.filter(software =>
        software.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className={styles.catalog}>
            <h2 className={styles.catalogTitle}>Softwares</h2>
            <div className={styles.searchContainer}>
                <TextField
                    label="Search softwares..."
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>
            {filteredSoftwares.length > 0 ? (
                <div className={styles.softwareList}>
                    {filteredSoftwares.map(software => (
                        <SoftwareListItem key={software._id} software={software} />
                    ))}
                </div>
            ) : (
                <p className={styles.noSoftwaresMessage}>No software items have been added yet.</p>
            )}
        </section>
    );
}