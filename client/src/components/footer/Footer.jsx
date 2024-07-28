import styles from './Footer.module.css';

export default function Footer() {
    return (
        <section className={styles.footerSection}>
            <div className={styles.container}>
                <p>
                    &copy; 2024 All Rights Reserved By Nikola Kolev
                </p>
            </div>
        </section>
    );
}