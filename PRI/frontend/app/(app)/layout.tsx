import Footer from "../components/Footer";
import Header from "../components/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>
      <Header />
      <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-11">
        {children}
      </main>
      <Footer />
    </>
  );
}