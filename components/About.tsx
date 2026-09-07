"use client";

import Image from "next/image";

export default function About() {
    return (
        <section className="fb-about" id="about">
            <div className="fb-about-inner">

                <div className="fb-about-label">
                    THE PERSON BEHIND IT
                </div>

                <div className="fb-about-main">
                    <p className="fb-about-kicker">
                        A LITTLE CORNER, MADE WITH FEELING.
                    </p>

                    <h2>
                        Hi, I am <em>Priyanshu.</em>
                    </h2>

                    <p className="fb-about-intro">
                        I created Feel Blessed as a quiet place for music,
                        memories, prayers, and the feeling of being somewhere
                        familiar.
                    </p>

                    <p className="fb-about-hindi">
                        कुछ रातें अकेले बिताने के लिए होती हैं।
                    </p>

                    <div className="fb-about-credit">
                        <span>DESIGNED & BUILT BY</span>
                        <strong>PRIYANSHU</strong>
                    </div>
                </div>

                <div className="fb-about-links">
                    <a
                        href="https://www.instagram.com/priyanshu.pp7"
                        target="_blank"
                        rel="noreferrer"
                        className="fb-social-card"
                    >
                        <span>INSTAGRAM</span>
                        <strong>@priyanshu.pp7</strong>
                        <small>follow the person behind it ↗</small>
                    </a>

                    <a
                        href="https://www.youtube.com/@priyanshu-is-alive"
                        target="_blank"
                        rel="noreferrer"
                        className="fb-social-card"
                    >
                        <span>YOUTUBE</span>
                        <strong>Priyanshu Is Alive</strong>
                        <small>music, thoughts & little things ↗</small>
                    </a>

                    <a
                        href="https://www.instagram.com/_dear.light_?igsi=MXFkeWY3ZGx6N2ZoNg%3D%3D"
                        target="_blank"
                        rel="noreferrer"
                        className="fb-social-card"
                    >
                        <span>ANOTHER LITTLE CORNER</span>
                        <strong>@_dear.light_</strong>
                        <small>something else I made ↗</small>
                    </a>
                </div>

                <div className="fb-support">
                    <div className="fb-support-copy">
                        <span>IF THIS CORNER MEANT SOMETHING TO YOU</span>

                        <h3>
                            You can help
                            <br />
                            keep it <em>alive.</em>
                        </h3>

                        <p>
                            If you enjoyed the music, the atmosphere, or simply
                            stayed here for a while — your support means a lot.
                        </p>
                    </div>

                    <div className="fb-support-qr">
                        <Image
                            src="/QR.jpeg"
                            alt="UPI support QR code"
                            width={220}
                            height={220}
                            priority={false}
                        />
                        <span>SCAN WITH ANY UPI APP</span>
                    </div>
                </div>

                <div className="fb-about-closing">
                    <p>
                        made quietly, for the nights that feel a little louder.
                    </p>
                </div>

                <footer className="fb-footer">
                    <span>FEEL BLESSED</span>
                    <span>MADE IN INDIA</span>
                    <span>© {new Date().getFullYear()}</span>
                </footer>

            </div>
        </section>
    );
}