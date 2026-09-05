"use client";

import { useEffect, useRef, useState } from "react";

export default function About() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const section = sectionRef.current;

        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(section);
                }
            },
            { threshold: 0.18 }
        );

        observer.observe(section);

        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={sectionRef}
            className={`fb-about ${visible ? "is-visible" : ""}`}
            id="about"
        >
            <div className="fb-about-inner">
                <div className="fb-about-label">
                    ABOUT FEEL BLESSED
                </div>

                <div className="fb-about-grid">
                    <div className="fb-about-heading">
                        <h2>
                            some places
                            <br />
                            <em>stay with you.</em>
                        </h2>
                    </div>

                    <div className="fb-about-copy">
                        <p>
                            Feel Blessed is a quiet corner for music, memories,
                            and moments that deserve to be remembered.
                        </p>

                        <p>
                            From riverside evenings and temple bells to long
                            journeys and familiar songs, this space brings
                            together the sounds and feelings attached to places
                            we carry with us.
                        </p>

                        <p>
                            No charts. No noise. Just music, prayers, places,
                            and memories.
                        </p>

                        <div className="fb-about-meta">
                            <span>FEEL BLESSED</span>
                            <span>INDIA</span>
                            <span>EST. 2026</span>
                        </div>
                    </div>
                </div>

                <div className="fb-about-closing">
                    <p>
                        For the places we remember,
                        <br />
                        and the songs that remember us.
                    </p>
                </div>

                <footer className="fb-footer">
                    <span>FEEL BLESSED</span>
                    <span>MADE WITH FAITH &amp; MEMORIES</span>
                    <span>© 2026</span>
                </footer>
            </div>
        </section>
    );
}