import { GroupSummary } from "../../lib/groups-client";
import GroupJoinAction from "./GroupJoinAction";

export default function GroupBoardRow({
  group,
  canJoin,
  joinDisabledReason,
}: {
  group: GroupSummary;
  canJoin: boolean;
  joinDisabledReason?: string;
}) {
  const headingId = `group-${group.id}`;
  const slotsLabel = group.isFull ? "komplet" : "wolne miejsca";

  return (
    <li
      aria-labelledby={headingId}
      className="grid gap-5 border-b border-border py-6 first:border-t md:grid-cols-[96px_minmax(0,1fr)_230px] md:items-center md:gap-8"
    >
      <div className="flex items-center gap-3 md:flex-col md:items-center md:gap-1">
        <span
          aria-hidden="true"
          className={`font-logo text-[46px] leading-none tabular-nums ${
            group.isFull ? "text-muted" : "text-primary"
          }`}
        >
          {group.freeSlots}
        </span>
        <span className="pb-1 text-center text-xs leading-4 text-muted md:pb-0">
          {slotsLabel}
        </span>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 id={headingId} className="font-serif text-[24px] leading-tight">
            {group.name}
          </h3>
          {group.isFull && (
            <span className="border border-danger px-2 py-1 text-[11px] font-semibold leading-none text-danger">
              Komplet
            </span>
          )}
          {group.isLarge && !group.isFull && (
            <span className="border border-primary px-2 py-1 text-[11px] font-semibold leading-none text-primary">
              Duża grupa
            </span>
          )}
        </div>

        <p className="line-clamp-3 max-w-[62ch] text-sm leading-6 text-muted">
          {group.description}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm leading-5">
          <div className="flex gap-2">
            <dt className="text-muted">Lider</dt>
            <dd className="font-medium">
              {group.leader.firstName} {group.leader.lastName}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Skład</dt>
            <dd className="font-medium">
              {group.memberCount} z {group.maxMembers} osób
            </dd>
          </div>
        </dl>
      </div>

      <GroupJoinAction
        group={group}
        disabled={!canJoin}
        disabledReason={joinDisabledReason}
      />
    </li>
  );
}
