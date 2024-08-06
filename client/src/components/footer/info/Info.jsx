import { Link } from 'react-router-dom';

export default function Info() {
    return (
        <section className="info_section layout_padding2">
            <div className="container">
                <div className="row">
                    <div className="col-md-6 col-lg-3 info_col">
                        <div className="info_contact">
                            <h4>
                                Address
                            </h4>
                            <div className="contact_link_box">
                                <a href="">
                                    <i className="fa fa-map-marker" aria-hidden="true"></i>
                                    <span>
                                        Varna, Bulgaria
                                    </span>
                                </a>
                                <a href="">
                                    <i className="fa fa-phone" aria-hidden="true"></i>
                                    <span>
                                        Call +359 88 123 4567
                                    </span>
                                </a>
                                <a href="">
                                    <i className="fa fa-envelope" aria-hidden="true"></i>
                                    <span>
                                        demo@gmail.com
                                    </span>
                                </a>
                            </div>
                        </div>
                        <div className="info_social">
                            <a href="">
                                <i className="fa fa-facebook" aria-hidden="true"></i>
                            </a>
                            <a href="">
                                <i className="fa fa-twitter" aria-hidden="true"></i>
                            </a>
                            <a href="">
                                <i className="fa fa-linkedin" aria-hidden="true"></i>
                            </a>
                            <a href="">
                                <i className="fa fa-instagram" aria-hidden="true"></i>
                            </a>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-5 info_col">
                        <div className="info_detail">
                            <h4>
                                Info
                            </h4>
                            <p>
                                Software Market is your go-to source for the latest softwares. Designed by developers for developers since 2024.
                            </p>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-3 mx-auto info_col">
                        <div className="info_link_box">
                            <h4>
                                Links
                            </h4>
                            <div className="info_links">
                                <Link className="active" to="/">
                                    Home
                                </Link>
                                <Link className="" to="/softwares">
                                    Catalog
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}