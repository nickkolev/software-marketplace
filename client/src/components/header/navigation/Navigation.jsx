import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../contexts/authContext';

export default function Navigation({ isHome }) {
    const location = useLocation();
    const { isAuthenticated } = useContext(AuthContext);

    return (
        <header className="header_section" style={!isHome ? { backgroundColor: '#002049' } : {}}>
            <div className="container-fluid">
                <nav className="navbar navbar-expand-lg custom_nav-container">
                    <Link className="navbar-brand" to="/">
                        <span>Soft Market</span>
                    </Link>

                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className=""> </span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav">
                            <li className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                                <Link className="nav-link" to="/">
                                    Home {location.pathname === '/' && <span className="sr-only">(current)</span>}
                                </Link>
                            </li>
                            <li className={`nav-item ${location.pathname === '/software' ? 'active' : ''}`}>
                                <Link className="nav-link" to="/software">
                                    Catalog {location.pathname === '/software' && <span className="sr-only">(current)</span>}
                                </Link>
                            </li>
                            {isAuthenticated && (
                                <>
                                    <li className={`nav-item ${location.pathname === '/software/create' ? 'active' : ''}`}>
                                        <Link className="nav-link" to="/software/create">
                                            Upload {location.pathname === '/software/create' && <span className="sr-only">(current)</span>}
                                        </Link>
                                    </li>
                                    <li className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                                        <Link className="nav-link" to="/profile">
                                            <i className="fa fa-user" aria-hidden="true"></i> Profile {location.pathname === '/profile' && <span className="sr-only">(current)</span>}
                                        </Link>
                                    </li>
                                </>
                            )}
                            {!isAuthenticated && (
                                <>
                                    <li className={`nav-item ${location.pathname === '/login' ? 'active' : ''}`}>
                                        <Link className="nav-link" to="/login">
                                            Login {location.pathname === '/login' && <span className="sr-only">(current)</span>}
                                        </Link>
                                    </li>
                                    <li className={`nav-item ${location.pathname === '/register' ? 'active' : ''}`}>
                                        <Link className="nav-link" to="/register">
                                            Register {location.pathname === '/register' && <span className="sr-only">(current)</span>}
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </nav>
            </div>
        </header>
    );
}