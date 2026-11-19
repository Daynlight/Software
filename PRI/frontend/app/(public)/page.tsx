import LandingSection from "../components/LandingSection";

const features = [
  {
    title: "Konta i profile",
    text: "Konto PRI 2.0 powiązane z kontem USOS. Profil studenta z informacjami o sobie i profil promotora z tematami i limitem grup.",
  },
  {
    title: "Grupy projektowe",
    text: "Student zgłasza propozycję projektu (nazwa, opis, liczba członków) i zostaje właścicielem grupy. Pozostali proszą o dołączenie, a właściciel akceptuje lub odrzuca prośby.",
  },
  {
    title: "Giełda grup i członków",
    text: "Ogłoszenia grup szukających członków i studentów szukających grupy, z filtrowaniem po temacie, wolnych miejscach i umiejętnościach. Działa tylko w okresie formowania grup.",
  },
  {
    title: "Zgłoszenia do promotorów",
    text: "Kompletna grupa wysyła projekt do jednego lub kilku promotorów. Promotor przyjmuje zgłoszenie, odrzuca je z uzasadnieniem albo proponuje zmiany. Po wyborze promotora pozostałe zgłoszenia są anulowane automatycznie.",
  },
  {
    title: "Praca nad projektem",
    text: "Czat grupy z wątkami, pliki z historią wersji i komentarzami promotora, linki do repozytorium i Jiry, aktywność w Git oraz powiadomienia z Teams.",
  },
];

const stages = [
  {
    n: "01",
    date: "01–15.10.2026",
    title: "Profile",
    text: "Studenci uzupełniają profile, promotorzy publikują tematy i limit grup.",
  },
  {
    n: "02",
    date: "30.10.2026",
    title: "Tworzenie grup",
    text: "Propozycje projektów, dołączanie do grup i giełda. Po terminie skład zmienia tylko administrator.",
  },
  {
    n: "03",
    date: "20.11 i 15.12.2026",
    title: "Zgłoszenia do promotorów",
    text: "Kompletne grupy wysyłają zgłoszenia, a promotorzy je przyjmują, odrzucają lub proponują zmiany.",
    current: true,
  },
  {
    n: "04",
    date: "01–05.02.2027",
    title: "Wybór promotora",
    text: "Grupa potwierdza jednego promotora i zostaje zamknięta. Studentów bez grupy przypisuje koordynator.",
  },
  {
    n: "05",
    date: "do 10.02.2027",
    title: "Praca nad projektem",
    text: "Czat, dokumenty z historią wersji, zadania.",
  },
];

const roles = [
  {
    title: "Studenci",
    text: "Tworzą grupy lub do nich dołączają, wysyłają zgłoszenia do promotorów, a potem prowadzą projekt: czat, pliki i zadania.",
  },
  {
    title: "Promotorzy",
    text: "Prowadzą profil z tematami i limitem grup, rozpatrują zgłoszenia i komentują dokumenty.",
  },
  {
    title: "Koordynator przedmiotu",
    text: "Ustala terminy etapów i limity, widzi studentów bez grupy i przypisuje ich ręcznie.",
  },
  {
    title: "Administratorzy",
    text: "Nadają role, blokują i odblokowują konta, przenoszą studentów między grupami po zamknięciu zapisów.",
  },
];

const faq = [
  {
    q: "Jak zalogować się do systemu?",
    a: "Wybierz „Zaloguj przez USOS” i użyj danych z USOS. Możesz też zalogować się loginem i hasłem PRI 2.0, co przydaje się szczególnie podczas awarii USOS.",
  },
  {
    q: "Co zrobić, jeśli nie mam zespołu?",
    a: "W okresie formowania grup zajrzyj na giełdę albo opublikuj ogłoszenie, że szukasz grupy. Po zamknięciu zapisów koordynator przypisze Cię do grupy.",
  },
  {
    q: "Czy mogę wysłać projekt do kilku promotorów?",
    a: "Tak, gdy grupa ma komplet członków. Jeśli kilku promotorów zaakceptuje projekt, wybierasz jednego, a pozostałe zgłoszenia anulują się automatycznie.",
  },
  {
    q: "Co zrobić, gdy promotor odrzuci zgłoszenie?",
    a: "Zobaczysz uzasadnienie odrzucenia. Możesz poprawić projekt i zgłosić go ponownie albo wysłać zgłoszenie do innego promotora.",
  },
  {
    q: "Kto widzi dane mojej grupy?",
    a: "Tylko członkowie grupy, jej promotor oraz koordynator i administrator w zakresie swoich uprawnień.",
  },
];

const contacts = [
  {
    label: "KOORDYNATOR PRI 2.0",
    name: "dr Marcin Szczepański",
    email: "koordynator@przyklad.pl",
    lines: ["Dyżur: wtorki 12:00-13:00", "pok. [nr], budynek 090"],
  },
  {
    label: "WSPARCIE TECHNICZNE",
    name: "Zespół PRI 2.0",
    email: "pri2@przyklad.pl",
    lines: ["Problemy z logowaniem i błędy w systemie"],
  },
];

export default function HomePage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1280px]">
        <section
          aria-labelledby="hero-title"
          className="flex flex-col gap-10 px-4 py-12 md:px-11 lg:flex-row lg:gap-[55px] lg:px-[85px] lg:pb-[104px] lg:pt-[85px]"
        >
          <div className="flex flex-col gap-7 lg:w-[637px] lg:shrink-0">
            <p className="font-serif text-[22px] italic leading-[22px] text-muted">
              Projekt Inżynierski · semestr 2026/27
            </p>
            <h1
              id="hero-title"
              className="font-serif text-4xl leading-[1.04] tracking-[-0.01em] lg:text-[50px]"
            >
              Projekt Inżynierski - od pomysłu do współpracy z promotorem.
            </h1>
            <p className="max-w-[600px] text-lg leading-[1.6]">
              PRI 2.0 to wydziałowy system dla studentów i promotorów. Pomaga stworzyć grupę
              projektową, znaleźć promotora i prowadzić projekt w jednym miejscu - z czatem
              zespołu, dokumentami z historią wersji i podglądem aktywności w repozytorium Git.
            </p>
          </div>

          <aside
            aria-label="Jak to działa"
            className="flex flex-col gap-[14px] bg-primary px-8 pb-8 pt-7 text-primary-foreground lg:w-[415px] lg:self-start"
          >
            <div className="flex justify-between">
              <span className="text-xs font-semibold leading-4 tracking-[0.1em]">
                JAK TO DZIAŁA
              </span>
              <span className="text-[13px] leading-[17px]">9 listopada 2026</span>
            </div>
            <p className="font-serif text-[32px] font-medium leading-[1.15]">
              Trzy kroki do projektu
            </p>
            <ol className="list-decimal pl-6 text-xl leading-[1.55]">
              <li>Stwórz grupę lub dołącz do istniejącej</li>
              <li>Wyślij zgłoszenie do jednego lub kilku promotorów</li>
              <li>Po akceptacji prowadź projekt w systemie</li>
            </ol>
          </aside>
        </section>
      </div>

      <LandingSection
        id="o-systemie"
        number="01"
        title="Co obejmuje system"
        intro="Dostępność funkcji zależy od etapu edycji i terminów ustalonych przez koordynatora."
        first
      >
        <dl className="border-t border-alt">
          {features.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-2 py-[22px] sm:flex-row sm:gap-10"
            >
              <dt className="font-serif text-[22px] font-medium leading-[22px] sm:w-[240px] sm:shrink-0">
                {item.title}
              </dt>
              <dd className="text-base leading-[1.55] sm:flex-1">{item.text}</dd>
            </div>
          ))}
        </dl>
      </LandingSection>

            <LandingSection
        id="przebieg"
        number="02"
        title="Przebieg PRI w semestrze 2026/27"
        tone="alt"
        after={
          <ol className="grid gap-7 sm:grid-cols-2 lg:grid-cols-5">
            {stages.map((stage) => (
              <li key={stage.n} className="flex flex-col gap-3">
                <div
                  aria-hidden="true"
                  className={stage.current ? "h-1 bg-primary" : "h-px bg-foreground"}
                />
                {stage.current ? (
                  <>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-logo text-[30px] leading-[39px] text-primary">
                        {stage.n}
                      </span>
                      <span className="text-[11px] font-semibold leading-[14px] tracking-[0.1em]">
                        TRWA TERAZ
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-[18px]">{stage.date}</p>
                  </>
                ) : (
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-logo text-[30px] leading-[39px]">{stage.n}</span>
                    <span className="text-sm font-semibold leading-[18px]">{stage.date}</span>
                  </div>
                )}
                <h3 className="font-serif text-[22px] font-medium leading-[1.15]">
                  {stage.title}
                </h3>
                <p className="text-[15px] leading-[1.5]">{stage.text}</p>
              </li>
            ))}
          </ol>
        }
      >
        <p className="text-lg leading-[1.6]">
          Edycja przebiega w pięciu etapach. Terminy i limity ustala koordynator; o zmianach
          informują komunikaty i powiadomienia w systemie.
        </p>
      </LandingSection>

      <LandingSection
        id="dla-kogo"
        number="03"
        title="Dla kogo"
        intro="Po zalogowaniu każdy widzi tylko to, co dotyczy jego roli i jego grupy."
      >
        <ul className="grid gap-10 sm:grid-cols-2">
          {roles.map((role) => (
            <li
              key={role.title}
              className="flex flex-col gap-[10px] border-t border-foreground pt-[18px]"
            >
              <h3 className="font-serif text-[22px] font-medium leading-[22px]">
                {role.title}
              </h3>
              <p className="text-base leading-[1.55] text-muted">{role.text}</p>
            </li>
          ))}
        </ul>
      </LandingSection>

      <LandingSection
        id="pytania"
        number="04"
        title="Najczęstsze pytania"
        intro="Nie ma tu odpowiedzi? Napisz do nas!"
        tone="alt"
      >
        <div>
          {faq.map((item, index) => (
            <details
              key={item.q}
              open={index === 0}
              className="group border-t border-foreground py-5 last:border-b"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                <span className="font-serif text-[22px] leading-[22px]">{item.q}</span>
                <span aria-hidden="true" className="text-2xl leading-[31px]">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">–</span>
                </span>
              </summary>
              <p className="mt-[10px] text-base leading-[1.55]">{item.a}</p>
            </details>
          ))}
        </div>
      </LandingSection>

      <LandingSection id="kontakt" number="05" title="Kontakt">
        <ul className="grid gap-10 sm:grid-cols-2">
          {contacts.map((c) => (
            <li
              key={c.label}
              className="flex flex-col gap-2 border-t border-foreground pt-[18px]"
            >
              <h3 className="text-xs font-semibold leading-4 tracking-[0.1em] text-muted">
                {c.label}
              </h3>
              <p className="font-serif text-[22px] font-medium leading-[1.2]">{c.name}</p>
              <a
                href={`mailto:${c.email}`}
                className="text-[15px] leading-[1.5] text-primary underline"
              >
                {c.email}
              </a>
              {c.lines.map((line) => (
                <p key={line} className="text-[15px] leading-[1.5]">
                  {line}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </LandingSection>

    </>
  );
}