import PublicFooter from "../components/PublicFooter";
import PublicHeader from "../components/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>
      <PublicHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}