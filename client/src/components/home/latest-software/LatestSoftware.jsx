import { useState, useEffect } from "react";
import softwaresApi from "../../../api/software-api";
import { Link } from "react-router-dom";

export default function LatestSoftware({
    _id,
    title,
    description,
    imageUrl,
}) {

    return (
        <div className="row">
            <div className="col-md-4 ">
                <div className="box ">
                    <div className="img-box">
                        <img src={imageUrl} alt={title} />
                    </div>
                    <div className="detail-box">
                        <h5>
                            {title}
                        </h5>
                        <p>
                            {description}
                        </p>
                        <Link to={`/softwares/${_id}/details`}>
                            Read More
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}