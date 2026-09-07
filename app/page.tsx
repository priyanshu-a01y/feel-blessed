import Background from "@/components/Background";
import CenterContent from "@/components/CenterContent";
import FilmGrain from "@/components/FilmGrain";
import MusicPlayer from "@/components/MusicPlayer";
import About from "@/components/About";
import PageNavigation from "@/components/PageNavigation";
import LiveClock from "@/components/LiveClock";
import LivePresence from "@/components/LivePresence";
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
            <LiveClock />
          </div>

          <LivePresence />

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
