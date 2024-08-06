import { Link } from "react-router-dom";

export default function Slider() {
    return (
        <section className="slider_section ">
            <div id="customCarousel1" className="carousel slide" data-ride="carousel">
                <div className="carousel-inner">
                    <div className="carousel-item active">
                        <div className="container ">
                            <div className="row">
                                <div className="col-md-6 ">
                                    <div className="detail-box">
                                        <h1>
                                            Software Market
                                        </h1>
                                        <p>
                                            Software Market is your go-to source for the latest softwares. Explore a wide range of applications across various categories with detailed descriptions, user reviews, and secure downloads!
                                        </p>
                                        <div className="btn-box">
                                            <Link to="/softwares" className="btn1">
                                                Explore
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="img-box">
                                        <img src="images/slider-img.png" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="carousel-item ">
                        <div className="container ">
                            <div className="row">
                                <div className="col-md-6 ">
                                    <div className="detail-box">
                                        <h1>
                                            Newest Mobile Apps
                                        </h1>
                                        <p>
                                            Discover the latest mobile applications available on Software Market. Browse through a variety of apps for Android and iOS devices!
                                        </p> 
                                        <div className="btn-box">
                                            <Link to="/softwares" className="btn1">
                                                Browse
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="img-box">
                                        <img src="images/slider-robot.png" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="carousel-item">
                        <div className="container ">
                            <div className="row">
                                <div className="col-md-6 ">
                                    <div className="detail-box">
                                        <h1>
                                            Register now
                                        </h1>
                                        <p>
                                            Register now to join Software Market! Gain access to exclusive software downloads, leave reviews, and participate in our community discussions. Sign up today and elevate your software experience!
                                        </p>
                                        <div className="btn-box">
                                            <Link to="/register" className="btn1">
                                                Join
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="img-box">
                                        <img src="images/sign-up-image.png" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ol className="carousel-indicators">
                    <li data-target="#customCarousel1" data-slide-to="0" className="active"></li>
                    <li data-target="#customCarousel1" data-slide-to="1"></li>
                    <li data-target="#customCarousel1" data-slide-to="2"></li>
                </ol>
            </div>

        </section>
    );
}