import NavMenu from "./NavMenu";
import SessionStatus from "./SessionStatus";

export default function Header() {
  return (
    <header className="bg-surface">
      <div className="bg-primary px-4 py-[10px] text-[13px] leading-[17px] text-primary-foreground md:px-11 lg:px-[120px]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span>
            Wydział Matematyki i Informatyki · Uniwersytet im. Adama Mickiewicza w
            Poznaniu
          </span>
          <SessionStatus />
        </div>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start justify-between gap-4 px-4 py-7 md:px-6">
        <div className="flex flex-col gap-2">
          <span className="font-logo text-[40px] leading-[52px]">PRI 2.0</span>
        </div>
        <NavMenu />
      </div>
    </header>
  );
}
