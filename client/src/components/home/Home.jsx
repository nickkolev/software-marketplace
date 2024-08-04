import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import softwaresApi from "../../api/software-api";

import LatestSoftware from "./latest-software/LatestSoftware";
import Info from "../footer/info/Info";

export default function Home() {
    const [latestSoftwares, setLatestSoftwares] = useState([]);

    useEffect(() => {
        (async () => {
            const result = await softwaresApi.getLatest();

            setLatestSoftwares(result);
        })();
    }, []);

    return (
        <>
            {latestSoftwares.length > 0 ? (
                <>
                    <section className="service_section layout_padding">
                        <div className="service_container">
                            <div className="container ">
                                <div className="heading_container heading_center">
                                    <h2>
                                        Latest <span>Software</span>
                                    </h2>
                                    <p>
                                        There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration
                                    </p>
                                </div>
                                
                                <div className="row">
                                {latestSoftwares.map((software) => <LatestSoftware key={software._id} {...software} />)}
                                </div>
                                
                                <div className="btn-box">
                                    <Link to="/softwares">
                                        View All
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            ) : (
                <p>There are no softwares on our marketplace yet.</p>
            )
            }
            <Info />
        </>
    );
}