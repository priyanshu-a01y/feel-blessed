import Background from "@/components/Background";
import CenterContent from "@/components/CenterContent";
import FilmGrain from "@/components/FilmGrain";
import MusicPlayer from "@/components/MusicPlayer";
import About from "@/components/About";
import PageNavigation from "@/components/PageNavigation";
import { getTracks } from "@/lib/getTracks";

export default function Home() {
  const tracks = getTracks();

  return (
    <main className="fb-site">
      <section className="fb-page" id="home">
        <Background />

        <FilmGrain />

        <header className="fb-topbar">
          <div className="fb-clock">
            <span suppressHydrationWarning>
              {new Date().toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>

          <div className="fb-live">
            <span className="fb-live-dot" />
            <span>126 listeners</span>
          </div>

          <PageNavigation />
        </header>

        <section className="fb-hero">
          <CenterContent />
        </section>

        <MusicPlayer tracks={tracks} />
      </section>

      <About />
    </main>
  );
}