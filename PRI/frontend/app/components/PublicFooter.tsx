export default function PublicFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 pb-10 pt-12 md:px-11 lg:px-[120px]">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-[60px]">
          <div className="flex flex-col gap-2 lg:flex-1">
            <span className="font-logo text-2xl leading-[31px]">PRI 2.0</span>
            <span className="text-sm leading-[18px]">System obsługi Projektu Inżynierskiego</span>
          </div>
          <p className="text-sm font-medium leading-[18px] lg:flex-1">
            Wydział Matematyki i Informatyki
          </p>
          <ul className="flex flex-col gap-[6px] text-sm leading-[18px] lg:flex-1">
            <li><a href="#" className="underline">Deklaracja dostępności</a></li>
            <li><a href="#" className="underline">Polityka prywatności</a></li>
            <li><a href="#" className="underline">Pomoc</a></li>
          </ul>
        </div>
        <hr className="border-t border-primary-foreground" />
        <p className="text-[13px] leading-[17px]">© 2026 UAM · PRI 2.0</p>
      </div>
    </footer>
  );
}