import { useEffect, useState } from "react";

import Info from "../footer/info/Info";
import LatestSoftware from "./latest-software/LatestSoftware";
import { Link } from "react-router-dom";
import softwaresApi from "../../api/software-api";

export default function Home() {
    const [latestSoftwares, setLatestSoftwares] = useState([]);

    useEffect(() => {
        (async () => {
            // TODO: modify to fetch only the latest softwares
            const result = await softwaresApi.getAll();

            setLatestSoftwares(result.reverse().slice(0, 3));
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

                                {latestSoftwares.map((software) => <LatestSoftware key={software._id} {...software} />)}
                                
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