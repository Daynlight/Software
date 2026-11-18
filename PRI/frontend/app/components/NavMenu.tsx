"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Pulpit" },
  { href: "/moja-grupa", label: "Moja grupa" },
  { href: "/gielda", label: "Giełda" },
  { href: "/zgloszenia", label: "Zgłoszenia" },
  { href: "/projekt", label: "Projekt" },
  { href: "/dashboard/profile", label: "Profil" },
];

export default function NavMenu() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu główne">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[55px] min-w-[120px] items-center justify-center px-[14px] py-3 text-[15px] leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-w-[155px] ${
                  active
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "font-medium hover:bg-black/5"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}