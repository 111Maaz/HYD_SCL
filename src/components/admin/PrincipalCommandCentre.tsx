import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  IndianRupee,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { PrincipalSearch } from "@/components/admin/PrincipalSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  PortalEmptyState,
  PortalPanel,
  PortalSectionTitle,
} from "@/components/portal/PortalPanel";
import { AUDIT_ACTION_LABELS } from "@/types/audit";
import {
  fetchPrincipalCommandData,
  formatInr,
  type PrincipalCommandData,
} from "@/services/principal-command";

const strengthConfig = {
  students: { label: "Students", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const duesConfig = {
  outstanding: { label: "Outstanding", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const feeMonthConfig = {
  assessed: { label: "Assessed", color: "hsl(var(--muted-foreground))" },
  collected: { label: "Collected", color: "hsl(var(--primary))" },
  remaining: { label: "Remaining", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const trendConfig = {
  percent: { label: "Attendance %", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

function StatTile({
  value,
  label,
  hint,
}: {
  value: string | number;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-soft">
      <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function PrincipalCommandCentre() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "principal-command"],
    queryFn: fetchPrincipalCommandData,
  });

  if (isLoading) return <AdminLoadingState label="Loading command centre…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load school snapshot."}
      />
    );
  }
  if (!data) return null;

  return <CommandCentreBody data={data} />;
}

function CommandCentreBody({ data }: { data: PrincipalCommandData }) {
  const yearLabel = data.activeYear?.name ?? "No active academic year";
  const attendanceHint = data.isAttendanceDay
    ? `${data.attendanceToday.present + data.attendanceToday.absent} of ${data.students.activeEnrolled} marked · ${data.attendanceToday.percent == null ? "No present rate yet" : `${data.attendanceToday.percent}% present among marked`}`
    : "Holiday / school closure — attendance not expected";

  return (
    <>
      <AdminPageHeader
        title="Command centre"
        description={`School-wide picture for today. ${yearLabel}. Figures come from live enrollments, attendance, fees, and admissions — not sample charts.`}
        action={<PrincipalSearch />}
      />

      <PortalSectionTitle>Needs attention</PortalSectionTitle>
      {data.alerts.length === 0 ? (
        <PortalPanel>
          <p className="text-sm text-muted-foreground">
            Nothing flagged right now. Attendance, fees, admissions, and parent invites look clear.
          </p>
        </PortalPanel>
      ) : (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {data.alerts.map((alert) => (
            <Link key={alert.id} to={alert.href} className="block">
              <PortalPanel className="h-full transition hover:border-primary/40">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <p className="font-medium">{alert.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
                    <p className="mt-2 text-xs font-medium text-primary">Open →</p>
                  </div>
                </div>
              </PortalPanel>
            </Link>
          ))}
        </div>
      )}

      <PortalSectionTitle>Today</PortalSectionTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          value={data.students.activeEnrolled}
          label="Students enrolled"
          hint="Active enrollments this year"
        />
        <StatTile
          value={data.attendanceToday.markedPercent == null ? "—" : `${data.attendanceToday.markedPercent}%`}
          label="Attendance marked today"
          hint={attendanceHint}
        />
        <StatTile
          value={data.attendanceToday.present}
          label="Present"
          hint={`${data.attendanceToday.absent} absent · ${data.attendanceToday.unmarked} not marked`}
        />
        <StatTile
          value={data.eventsToday.length}
          label="Today's events"
          hint={`${data.eventsUpcoming.length} upcoming on the calendar`}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <PortalPanel
          title="Attendance inspection"
          description={`${data.attendanceToday.present} present · ${data.attendanceToday.absent} absent · ${data.attendanceToday.unmarked} not marked`}
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/attendance">Open attendance</Link>
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p>
              Boys {data.students.boys}
              <span className="block text-xs text-muted-foreground">from recorded gender</span>
            </p>
            <p>
              Girls {data.students.girls}
              <span className="block text-xs text-muted-foreground">
                {data.students.unspecified} unspecified
              </span>
            </p>
          </div>
          {data.unmarkedSections.length > 0 ? (
            <ul className="mt-4 max-h-40 space-y-1 overflow-y-auto text-sm">
              {data.unmarkedSections.map((row) => (
                <li key={row.sectionId} className="text-muted-foreground">
                  {row.className} {row.sectionName} — not marked ({row.enrolled})
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {data.isAttendanceDay
                ? "Every section with students has at least some attendance marked."
                : "No attendance expected today."}
            </p>
          )}
        </PortalPanel>

        <PortalPanel
          title="Last 7 days"
          description="Percent of marked records that are present. Empty days have no marks."
        >
          {data.attendanceTrend.every((row) => row.percent == null) ? (
            <PortalEmptyState title="No marked attendance this week" />
          ) : (
            <ChartContainer config={trendConfig} className="aspect-auto h-48">
              <LineChart data={data.attendanceTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="var(--color-percent)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </PortalPanel>

        <PortalPanel
          title="Events"
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/calendar">View calendar</Link>
            </Button>
          }
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today
          </p>
          {data.eventsToday.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">No calendar items today.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {data.eventsToday.map((event) => (
                <li key={event.id}>
                  {event.title}{" "}
                  <Badge variant="outline" className="ml-1 text-[10px]">
                    {event.event_type.replaceAll("_", " ")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming
          </p>
          {data.eventsUpcoming.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Nothing scheduled after today.</p>
          ) : (
            <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-sm">
              {data.eventsUpcoming.map((event) => (
                <li key={event.id} className="flex justify-between gap-2">
                  <span className="truncate">{event.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {format(parseISO(event.event_date), "d MMM")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PortalPanel>
      </div>

      {data.lowAttendanceSections.length > 0 || data.chronicAbsences.length > 0 ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {data.lowAttendanceSections.length > 0 ? (
            <PortalPanel title="Sections below 85% (marked students)">
              <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                {data.lowAttendanceSections.map((row) => (
                  <li key={row.sectionId} className="flex justify-between gap-2">
                    <Link to="/admin/attendance" className="text-primary hover:underline">
                      {row.className} {row.sectionName}
                    </Link>
                    <span className="tabular-nums">{row.percent}%</span>
                  </li>
                ))}
              </ul>
            </PortalPanel>
          ) : null}
          {data.chronicAbsences.length > 0 ? (
            <PortalPanel title="Repeated absences (last 7 days)">
              <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                {data.chronicAbsences.map((row) => (
                  <li key={row.studentNumber} className="flex justify-between gap-2">
                    <Link to="/admin/students" className="truncate text-primary hover:underline">
                      {row.studentName}{" "}
                      <span className="text-muted-foreground">({row.studentNumber})</span>
                    </Link>
                    <span className="shrink-0 tabular-nums">{row.days} days</span>
                  </li>
                ))}
              </ul>
            </PortalPanel>
          ) : null}
        </div>
      ) : null}

      <PortalSectionTitle>How the school is performing</PortalSectionTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile value={data.students.activeEnrolled} label="Total strength" />
        <StatTile
          value={data.students.newThisYear}
          label="New this year"
          hint={`${data.students.continuingThisYear} continuing / promoted in`}
        />
        <StatTile
          value={data.fees.collectionPct == null ? "—" : `${data.fees.collectionPct}%`}
          label="Fee collection"
          hint={`${formatInr(data.fees.collected)} of ${formatInr(data.fees.assessed)}`}
        />
        <StatTile
          value={formatInr(data.fees.outstanding)}
          label="Outstanding"
          hint={`${data.fees.defaulterCount} students with dues`}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <PortalPanel
          title="Class-wise student strength"
          description={`Total students — ${data.students.activeEnrolled}`}
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/students">Students</Link>
            </Button>
          }
        >
          {data.classStrength.length === 0 ? (
            <PortalEmptyState icon={<Users className="size-8" />} title="No active enrollments" />
          ) : (
            <ChartContainer config={strengthConfig} className="aspect-auto h-64">
              <BarChart data={data.classStrength}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="className"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={72}
                  tickMargin={8}
                />
                <YAxis allowDecimals={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="students" fill="var(--color-students)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </PortalPanel>

        <PortalPanel
          title="Class-wise current dues"
          description={`Total outstanding — ${formatInr(data.fees.outstanding)}`}
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/fees">Fee ledger</Link>
            </Button>
          }
        >
          {data.fees.byClass.length === 0 ? (
            <PortalEmptyState icon={<IndianRupee className="size-8" />} title="No outstanding dues" />
          ) : (
            <ChartContainer config={duesConfig} className="aspect-auto h-64">
              <BarChart data={data.fees.byClass}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="className"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={72}
                  tickMargin={8}
                />
                <YAxis width={48} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatInr(Number(value))} />}
                />
                <Bar dataKey="outstanding" fill="var(--color-outstanding)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </PortalPanel>
      </div>

      <PortalPanel
        className="mb-6"
        title="Fee summary by month"
        description={`Assessed ${formatInr(data.fees.assessed)} · Collected ${formatInr(data.fees.collected)} · Remaining ${formatInr(data.fees.outstanding)}`}
      >
        {data.fees.byMonth.every(
          (row) => row.assessed === 0 && row.collected === 0,
        ) ? (
          <PortalEmptyState title="No fee charges or payments in this academic year yet" />
        ) : (
          <ChartContainer config={feeMonthConfig} className="aspect-auto h-72">
            <LineChart data={data.fees.byMonth}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis width={52} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => formatInr(Number(value))} />}
              />
              <Line type="monotone" dataKey="assessed" stroke="var(--color-assessed)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="collected" stroke="var(--color-collected)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="remaining" stroke="var(--color-remaining)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartContainer>
        )}
      </PortalPanel>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <PortalPanel
          title="Admissions pipeline"
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/admissions">Admissions</Link>
            </Button>
          }
        >
          <ul className="space-y-2 text-sm">
            {Object.entries(data.admissions).map(([status, count]) => (
              <li key={status} className="flex justify-between">
                <span>{status}</span>
                <span className="tabular-nums font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </PortalPanel>

        <PortalPanel title="Staff snapshot">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Teaching</span>
              <span className="tabular-nums font-medium">{data.staff.teaching}</span>
            </li>
            <li className="flex justify-between">
              <span>Non-teaching</span>
              <span className="tabular-nums font-medium">{data.staff.nonTeaching}</span>
            </li>
            <li className="flex justify-between">
              <span>Leadership / incharge</span>
              <span className="tabular-nums font-medium">{data.staff.leadership}</span>
            </li>
            <li className="flex justify-between border-t pt-2">
              <span>Active staff</span>
              <span className="tabular-nums font-medium">{data.staff.total}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Daily staff present/absent is not in the ERP yet — these are role counts, not attendance.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link to="/admin/faculty-accounts">Staff accounts</Link>
          </Button>
        </PortalPanel>

        <PortalPanel
          title="Parents"
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/guardians">Guardians</Link>
            </Button>
          }
        >
          <p className="text-2xl font-semibold tabular-nums">{data.parents.total}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Guardian records</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {data.parents.pendingInvite} still need a parent login invite.
          </p>
        </PortalPanel>
      </div>

      <PortalPanel
        className="mb-10"
        title="Recent activity"
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/audit">Full audit</Link>
          </Button>
        }
      >
        {data.activity.length === 0 ? (
          <PortalEmptyState icon={<CalendarDays className="size-8" />} title="No audit entries yet" />
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {data.activity.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-2 last:border-0">
                <span>
                  {AUDIT_ACTION_LABELS[row.action]}{" "}
                  <span className="text-muted-foreground">{row.table_name ?? "record"}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(row.created_at), "d MMM, HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PortalPanel>
    </>
  );
}
