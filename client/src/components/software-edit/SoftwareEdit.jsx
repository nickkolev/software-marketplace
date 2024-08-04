import { useState, useEffect, useMemo } from 'react';
import styles from './SoftwareEdit.module.css';
import { useForm } from '../../hooks/useForm';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetOneSoftware } from '../../hooks/useSoftwares';
import softwaresApi from '../../api/software-api';

export default function SoftwareEdit() {
    const navigate = useNavigate();
    const { softwareId } = useParams();
    const [software] = useGetOneSoftware(softwareId);

    const {
        changeHandler,
        submitHandler,
        values,
    } = useForm(software, async (values) => {
        const isConfirmed = confirm('Are you sure you want to update this software?');

        if (isConfirmed) {
            await softwaresApi.update(softwareId, values);

            navigate(`/softwares/${softwareId}/details`);
        }
    });

    return (
        <div className={styles.editSoftware}>
            <form className={styles.editForm} onSubmit={submitHandler}>
                <div className={styles.formGroup}>
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={values.title}
                        onChange={changeHandler}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={values.description}
                        onChange={changeHandler}
                    ></textarea>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="version">Version:</label>
                    <input
                        type="text"
                        id="version"
                        name="version"
                        value={values.version}
                        onChange={changeHandler}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="download url">Download Url:</label>
                    <input 
                        type="url" 
                        id="download" 
                        name="download url" 
                        value={values.downloadUrl}
                        onChange={changeHandler} 
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="image">Image Url:</label>
                    <input 
                        type="url" 
                        id="image" 
                        name="image" 
                        value={values.imageUrl}
                        onChange={changeHandler} 
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="category">Category:</label>
                    <input
                        type="text"
                        id="category"
                        name="category"
                        value={values.category}
                        onChange={changeHandler}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="size">Size:</label>
                    <input
                        type="text"
                        id="size"
                        name="size"
                        value={values.size}
                        onChange={changeHandler}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="operatingSystem">Operating System:</label>
                    <input
                        type="text"
                        id="operatingSystem"
                        name="operatingSystem"
                        value={values.operatingSystem}
                        onChange={changeHandler}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="instructions">Instructions:</label>
                    <textarea
                        id="instructions"
                        name="instructions"
                        value={values.instructions}
                        onChange={changeHandler}
                    ></textarea>
                </div>
                <button type="submit" className={styles.saveButton}>Save</button>
            </form>
        </div>
    );
};