export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-16 max-w-[1280px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-3 md:px-11">
        <span className="text-[13px] leading-[17px]">© 2026 UAM · PRI 2.0</span>
        <ul className="flex flex-wrap gap-x-8 gap-y-1 text-sm leading-[18px]">
          <li><a href="#" className="underline">Deklaracja dostępności</a></li>
          <li><a href="#" className="underline">Polityka prywatności</a></li>
          <li><a href="#" className="underline">Pomoc</a></li>
        </ul>
      </div>
    </footer>
  );
}