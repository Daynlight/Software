"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#o-systemie", label: "O systemie" },
  { href: "/#przebieg", label: "Przebieg PRI" },
  { href: "/#pytania", label: "Pytania" },
  { href: "/#kontakt", label: "Kontakt" },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const showLoginButton = pathname !== "/login";

  return (
    <header>
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1280px] px-4 py-[10px] text-[13px] leading-[17px] md:px-11 lg:px-[120px]">
          Wydział Matematyki i Informatyki · Uniwersytet im. Adama Mickiewicza w Poznaniu
        </div>
      </div>

      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-4 py-6 md:px-11 lg:px-[120px]">
        <Link href="/" className="flex items-center gap-[18px]">
          <span className="font-logo text-[30px] leading-[39px]">PRI 2.0</span>
          <span aria-hidden="true" className="hidden h-9 w-px bg-alt sm:block" />
          <span className="hidden max-w-[141px] text-[13px] font-medium leading-[1.3] text-muted sm:block">
            System obsługi Projektu Inżynierskiego
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <nav aria-label="Menu główne" className="hidden lg:block">
            <ul className="flex gap-8 text-[15px] leading-5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {showLoginButton && (
            <Link
              href="/login"
              className="rounded-[2px] bg-primary px-[26px] py-[14px] text-[15px] font-semibold leading-5 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Zaloguj do PRI
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}