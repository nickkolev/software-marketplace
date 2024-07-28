import { useLocation } from 'react-router-dom';

import Navigation from './navigation/Navigation';
import Slider from './slider/Slider';

export default function Header() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="hero_area">

            {isHome && (
                <div className="hero_bg_box">
                    <div className="bg_img_box">
                        <img src="images/hero-bg.png" alt="Hero background" />
                    </div>
                </div>
            )}

            <Navigation isHome={isHome}/>

            {isHome && <Slider />}
        </div>
    );
}