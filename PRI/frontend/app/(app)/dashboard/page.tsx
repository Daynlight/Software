import Link from "next/link";
import Card from "../../components/Card";
import { mockUser as user } from "../../lib/mock-user";

const fields = [
  { label: "Imię", value: user.firstName },
  { label: "Nazwisko", value: user.lastName },
  { label: "Numer indeksu", value: user.indexNumber },
  { label: "Rola w systemie", value: user.role },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="sr-only">
        Pulpit: {user.firstName} {user.lastName}
      </h1>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <Card id="komunikaty" title="Komunikaty">
            <p className="py-6 text-center text-muted">brak nowych komunikatów</p>
          </Card>
          <Card id="powiadomienia" title="Powiadomienia">
            <p className="py-3 text-center text-primary">brak nowych komunikatów</p>
          </Card>
        </div>

        <Card id="moje-dane" title="Moje dane">
          <div className="flex flex-col-reverse gap-6 sm:flex-row sm:justify-between">
            <dl className="flex flex-col gap-2">
              {fields.map((f) => (
                <div key={f.label}>
                  <dt className="text-sm leading-6 text-muted">{f.label}</dt>
                  <dd className="font-medium leading-6">{f.value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-sm leading-6 text-muted">O mnie</dt>
                <dd className="font-medium leading-6">{user.about}</dd>
              </div>
              <div>
                <dt className="text-sm leading-6 text-muted">Umiejętności</dt>
                <dd className="font-medium leading-6">{user.skills}</dd>
              </div>
            </dl>

            <div className="flex h-40 w-32 shrink-0 items-center justify-center bg-placeholder text-[15px]">
              Zdjęcie
            </div>
          </div>

          <Link
            href="/dashboard/profile"
            className="self-end rounded-[2px] bg-primary px-6 py-[13px] text-[15px] font-semibold leading-5 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Edytuj profil
          </Link>
        </Card>
      </div>
    </div>
  );
}