import { useState, useEffect } from "react";
import softwaresApi from "../../api/software-api";

export default function Catalog() {

    const [latestSoftwares, setLatestSoftwares] = useState([]);

    useEffect(() => {
        (async () => {
            // TODO: modify to fetch only the latest games
            const result = await softwaresApi.getAll();

            setLatestSoftwares(result.reverse().slice(0, 3));

            console.log(result);
        })();
    }, []);

    return (
        <>
            <section className="catalog">
                <h2>Latest Games</h2>
                <ul>
                    {latestSoftwares.map(game => (
                        <li key={game._id}>
                            <img src={game.imageUrl} alt={game.title} />
                            <h3>{game.title}</h3>
                            <p>{game.description}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
}