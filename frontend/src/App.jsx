import { Nav, Hero, Marquee, About, Subjects, HowItWorks, Pricing, Faq, Footer } from './components/Sections.jsx';
import Booking from './components/Booking.jsx';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Subjects />
        <HowItWorks />
        <Pricing />
        <Booking />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
