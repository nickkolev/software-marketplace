import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footerSection}>
            <div className={styles.container}>
                <p>
                    &copy; 2024 All Rights Reserved By Nikola Kolev
                </p>
            </div>
        </footer>
    );
}