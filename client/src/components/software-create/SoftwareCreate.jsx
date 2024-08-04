import { useState } from 'react';
import styles from './SoftwareCreate.module.css';
import { useForm } from '../../hooks/useForm';
import { useNavigate } from 'react-router-dom';
import { useCreateSoftware } from '../../hooks/useSoftwares';

const initialValues = {
    title: '',
    description: '',
    version: '',
    downloadUrl: '',
    imageUrl: '',
    operatingSystem: '',
    category: '',
    size: '',
    instructions: ''
}

export default function SoftwareCreate() {
    const navigate = useNavigate();
    const createSoftware = useCreateSoftware();

    const createHandler = async (values) => {
        try {
            const { _id: softwareId } = await createSoftware(values);
            navigate(`/softwares/${softwareId}/details`);
        } catch (error) {
            console.error(error);
        }
    };

    const {
        values,
        changeHandler,
        submitHandler,
    } = useForm(initialValues, createHandler);

    return (
        <div className={styles.createSoftwareContainer}>
            <div className={styles.formContainer}>
                <h2 className="text-center mb-4">Create Software</h2>
                <form onSubmit={submitHandler}>
                    <div className="mb-3">
                        <label htmlFor="title" className={styles.formLabel}>Title</label>
                        <input
                            type="text"
                            className="form-control"
                            id="title"
                            name="title"
                            value={values.title}
                            onChange={changeHandler}
                            placeholder="Enter software title"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="description" className={styles.formLabel}>Description</label>
                        <textarea
                            className="form-control"
                            id="description"
                            name="description"
                            value={values.description}
                            onChange={changeHandler}
                            rows="3"
                            placeholder="Enter software description"
                            required
                        ></textarea>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="version" className={styles.formLabel}>Version</label>
                        <input
                            type="text"
                            className="form-control"
                            id="version"
                            name="version"
                            value={values.version}
                            onChange={changeHandler}
                            placeholder="Enter software version"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="downloadUrl" className={styles.formLabel}>Download URL</label>
                        <input
                            type="url"
                            className="form-control"
                            id="downloadUrl"
                            name="downloadUrl"
                            value={values.downloadUrl}
                            onChange={changeHandler}
                            placeholder="Enter download URL"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="imageUrl" className={styles.formLabel}>Image URL</label>
                        <input
                            type="url"
                            className="form-control"
                            id="imageUrl"
                            name="imageUrl"
                            value={values.imageUrl}
                            onChange={changeHandler}
                            placeholder="Enter image URL"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="operatingSystem" className={styles.formLabel}>Operating System</label>
                        <input
                            type="text"
                            className="form-control"
                            id="operatingSystem"
                            name="operatingSystem"
                            value={values.operatingSystem}
                            onChange={changeHandler}
                            placeholder="Enter operating systems"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="category" className={styles.formLabel}>Category</label>
                        <input
                            type="text"
                            className="form-control"
                            id="category"
                            name="category"
                            value={values.category}
                            onChange={changeHandler}
                            placeholder="Enter software category"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="size" className={styles.formLabel}>Size</label>
                        <input
                            type="text"
                            className="form-control"
                            id="size"
                            name="size"
                            value={values.size}
                            onChange={changeHandler}
                            placeholder="Enter software size"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="instructions" className={styles.formLabel}>Instructions</label>
                        <textarea
                            className="form-control"
                            id="instructions"
                            name="instructions"
                            value={values.instructions}
                            onChange={changeHandler}
                            rows="3"
                            placeholder="Enter installation instructions"
                            required
                        ></textarea>
                    </div>
                    <div className={styles.textCenter}>
                        <button type="submit" className="btn btn-primary">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
