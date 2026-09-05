"use client";

export default function PageNavigation() {
    const goToAbout = () => {
        document.getElementById("about")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const goToHome = () => {
        document.getElementById("home")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    return (
        <>
            <button
                type="button"
                className="fb-about-button"
                onClick={goToAbout}
                aria-label="Open About section"
            >
                ABOUT
            </button>

            <button
                type="button"
                className="fb-scroll-cue"
                onClick={goToAbout}
                aria-label="Scroll to About"
            >
                <span>SCROLL TO EXPLORE</span>
                <span className="fb-scroll-arrow">↓</span>
            </button>

            <button
                type="button"
                className="fb-home-button"
                onClick={goToHome}
                aria-label="Back to Home"
            >
                ↑
            </button>
        </>
    );
}