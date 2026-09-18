import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAcademicYears } from "@/services/academic-years";
import { fetchClassYearsWithDetails } from "@/services/academic-structure";
import { fetchEnrollmentsForYear, type YearEndAction } from "@/services/enrollments";
import {
  fetchProgressionMaps,
  removeProgressionMap,
  runYearEndTransition,
  saveProgressionMap,
  type TransitionResult,
} from "@/services/year-end";
import type { ClassYearWithClass } from "@/types/academic";
import { getStudentDisplayName } from "@/types/students";

function sectionLabel(classYear: ClassYearWithClass, sectionName: string) {
  return `${classYear.class.class_name} — ${sectionName}`;
}

export function YearEndWizardAdmin() {
  const queryClient = useQueryClient();
  const [fromYearId, setFromYearId] = useState("");
  const [toYearId, setToYearId] = useState("");
  const [action, setAction] = useState<YearEndAction>("PROMOTED");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draftTargets, setDraftTargets] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [closeSource, setCloseSource] = useState(false);
  const [preview, setPreview] = useState<TransitionResult | null>(null);
  const [result, setResult] = useState<TransitionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const resetReview = () => {
    setPreview(null);
    setResult(null);
    setConfirmOpen(false);
  };

  const yearsQuery = useQuery({
    queryKey: ["admin", "academic-years"],
    queryFn: fetchAcademicYears,
  });
  const years = useMemo(() => yearsQuery.data ?? [], [yearsQuery.data]);
  const fromYear = years.find((year) => year.id === fromYearId);
  const futureYears = useMemo(
    () =>
      fromYear
        ? years
            .filter((year) => year.start_date > fromYear.start_date)
            .sort((a, b) => a.start_date.localeCompare(b.start_date))
        : [],
    [fromYear, years],
  );
  useEffect(() => {
    setToYearId((current) =>
      futureYears.some((year) => year.id === current) ? current : (futureYears[0]?.id ?? ""),
    );
  }, [futureYears]);

  const sourceQuery = useQuery({
    queryKey: ["admin", "year-end", fromYearId],
    queryFn: () => fetchEnrollmentsForYear(fromYearId),
    enabled: !!fromYearId,
  });
  const sourceStructureQuery = useQuery({
    queryKey: ["admin", "year-end", "structure", fromYearId],
    queryFn: () => fetchClassYearsWithDetails(fromYearId),
    enabled: !!fromYearId,
  });
  const targetStructureQuery = useQuery({
    queryKey: ["admin", "year-end", "structure", toYearId],
    queryFn: () => fetchClassYearsWithDetails(toYearId),
    enabled: !!toYearId && action !== "COMPLETED",
  });
  const mapsQuery = useQuery({
    queryKey: ["admin", "year-end", "maps", fromYearId, toYearId, action],
    queryFn: () => fetchProgressionMaps(fromYearId, toYearId, action as "PROMOTED" | "REPEATED"),
    enabled: !!fromYearId && !!toYearId && action !== "COMPLETED",
  });
  const sourceStructure = sourceStructureQuery.data ?? [];
  const targetStructure = targetStructureQuery.data ?? [];
  const maps = mapsQuery.data ?? [];
  const enrollments = (sourceQuery.data ?? []).filter((row) => row.status === "ACTIVE");
  const chosen = enrollments.filter((row) => selected.has(row.id));
  const targets = targetStructure.flatMap((classYear) =>
    classYear.active
      ? classYear.sections
          .filter((section) => section.active)
          .map((section) => ({ classYear, section }))
      : [],
  );
  const targetById = new Map(
    targets.map(({ classYear, section }) => [
      section.id,
      sectionLabel(classYear, section.section_name),
    ]),
  );
  const sourceById = new Map(enrollments.map((row) => [row.id, row]));

  const mapMutation = useMutation({
    mutationFn: async ({
      sourceClassYearId,
      sourceSectionId,
      targetSectionId,
    }: {
      sourceClassYearId: string;
      sourceSectionId: string;
      targetSectionId: string;
    }) => {
      const existing = maps.find((row) => row.source_section_id === sourceSectionId);
      if (!targetSectionId) {
        if (existing) await removeProgressionMap(existing.id);
        return;
      }
      const target = targets.find((row) => row.section.id === targetSectionId);
      if (!target) throw new Error("Select an active destination section in the target year.");
      await saveProgressionMap({
        from_year_id: fromYearId,
        to_year_id: toYearId,
        action: action as "PROMOTED" | "REPEATED",
        source_class_year_id: sourceClassYearId,
        source_section_id: sourceSectionId,
        target_class_year_id: target.classYear.id,
        target_section_id: targetSectionId,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "year-end", "maps"] });
      resetReview();
      toast.success("Progression mapping saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const transitionInput = () => ({
    fromYearId,
    toYearId: action === "COMPLETED" ? null : toYearId,
    action,
    enrollmentIds: [...selected],
    overrides,
    closeSource,
  });
  const previewMutation = useMutation({
    mutationFn: () => runYearEndTransition(transitionInput(), false),
    onSuccess: (data) => {
      setPreview(data);
      setResult(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const commitMutation = useMutation({
    mutationFn: () => runYearEndTransition(transitionInput(), true),
    onSuccess: (data) => {
      setConfirmOpen(false);
      setPreview(data);
      setResult(data);
      if (data.blocked || data.processed === 0) {
        toast.error("Nothing was processed. Review the reasons below.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["admin", "year-end"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "academic-years"] });
      setSelected(new Set());
      setOverrides({});
      toast.success(`Processed ${data.processed} enrollment(s).`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (yearsQuery.isLoading) return <AdminLoadingState label="Loading academic years…" />;
  const loadError =
    yearsQuery.error ||
    sourceQuery.error ||
    sourceStructureQuery.error ||
    targetStructureQuery.error ||
    mapsQuery.error;
  if (loadError)
    return (
      <AdminErrorState
        message={loadError instanceof Error ? loadError.message : "Failed to load year-end data."}
      />
    );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Year-end wizard"
        description="Map destinations, select students, review, then confirm the transition."
      />
      <Card>
        <CardHeader>
          <CardTitle>1. Select years and action</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>From year</Label>
            <Select
              value={fromYearId}
              onValueChange={(value) => {
                setFromYearId(value);
                setSelected(new Set());
                setOverrides({});
                setDraftTargets({});
                resetReview();
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Closing year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To year</Label>
            <Select
              value={toYearId}
              onValueChange={(value) => {
                setToYearId(value);
                setOverrides({});
                setDraftTargets({});
                resetReview();
              }}
              disabled={!fromYearId || action === "COMPLETED" || futureYears.length === 0}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Next year" />
              </SelectTrigger>
              <SelectContent>
                {futureYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromYearId && futureYears.length === 0 && action !== "COMPLETED" && (
              <p className="max-w-xs text-sm text-muted-foreground">
                Create a later year in{" "}
                <Link to="/admin/academic-years" className="underline">
                  Academic Years
                </Link>
                .
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Action</Label>
            <Select
              value={action}
              onValueChange={(value) => {
                setAction(value as YearEndAction);
                setOverrides({});
                setDraftTargets({});
                resetReview();
              }}
            >
              <SelectTrigger className="w-[185px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROMOTED">Promote</SelectItem>
                <SelectItem value="REPEATED">Repeat</SelectItem>
                <SelectItem value="COMPLETED">Complete / leaving</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {fromYearId && action !== "COMPLETED" && toYearId && (
        <Card>
          <CardHeader>
            <CardTitle>2. Confirm class and section mappings</CardTitle>
            <CardDescription>
              Choose and save an actual destination for each source section. Matching labels are
              suggestions only; nothing is used until saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceStructure.flatMap((sourceClass) =>
              sourceClass.sections
                .filter((section) => section.active)
                .map((section) => {
                  const saved = maps.find((row) => row.source_section_id === section.id);
                  const choices = targets.filter(({ classYear }) =>
                    action === "REPEATED"
                      ? classYear.class.id === sourceClass.class.id
                      : classYear.class.display_order > sourceClass.class.display_order,
                  );
                  const suggestion = choices.find(
                    ({ classYear, section: target }) =>
                      (action === "REPEATED" ||
                        classYear.class.display_order === sourceClass.class.display_order + 1) &&
                      target.section_name.trim().toLowerCase() ===
                        section.section_name.trim().toLowerCase(),
                  );
                  const value = draftTargets[section.id] ?? saved?.target_section_id ?? "";
                  return (
                    <div
                      key={section.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                    >
                      <span className="min-w-36 font-medium">
                        {sectionLabel(sourceClass, section.section_name)}
                      </span>
                      <span aria-hidden>→</span>
                      <Select
                        value={value}
                        onValueChange={(target) => {
                          setDraftTargets((prev) => ({ ...prev, [section.id]: target }));
                          resetReview();
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-[260px]">
                          <SelectValue placeholder="Choose destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {choices.map(({ classYear, section: target }) => (
                            <SelectItem key={target.id} value={target.id}>
                              {sectionLabel(classYear, target.section_name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!suggestion || mapMutation.isPending}
                        onClick={() => {
                          if (suggestion) {
                            setDraftTargets((prev) => ({
                              ...prev,
                              [section.id]: suggestion.section.id,
                            }));
                            resetReview();
                          }
                        }}
                      >
                        Suggest match
                      </Button>
                      <Button
                        size="sm"
                        disabled={mapMutation.isPending || (!value && !saved)}
                        onClick={() =>
                          mapMutation.mutate({
                            sourceClassYearId: sourceClass.id,
                            sourceSectionId: section.id,
                            targetSectionId: value,
                          })
                        }
                      >
                        Save mapping
                      </Button>
                      {saved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            mapMutation.mutate({
                              sourceClassYearId: sourceClass.id,
                              sourceSectionId: section.id,
                              targetSectionId: "",
                            })
                          }
                        >
                          Remove
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {saved
                          ? `Saved: ${targetById.get(saved.target_section_id) ?? "destination unavailable"}`
                          : "Not saved"}
                      </span>
                      {choices.length === 0 && (
                        <p className="w-full text-sm text-destructive">
                          No destination class/section is configured for this action. Add it to the
                          target academic structure or complete these students.
                        </p>
                      )}
                    </div>
                  );
                }),
            )}
          </CardContent>
        </Card>
      )}

      {fromYearId && (
        <Card>
          <CardHeader>
            <CardTitle>3. Select students</CardTitle>
            <CardDescription>
              {enrollments.length} active enrollment(s) in the source year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelected(new Set(enrollments.map((row) => row.id)));
                  resetReview();
                }}
              >
                Select all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelected(new Set());
                  resetReview();
                }}
              >
                Clear
              </Button>
              <span className="text-sm">Selected: {selected.size}</span>
            </div>
            <div className="max-h-[420px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${row.student ? getStudentDisplayName(row.student) : "student"}`}
                          checked={selected.has(row.id)}
                          onCheckedChange={(checked) => {
                            setSelected((previous) => {
                              const next = new Set(previous);
                              if (checked) next.add(row.id);
                              else next.delete(row.id);
                              return next;
                            });
                            resetReview();
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {row.student ? getStudentDisplayName(row.student) : "—"}
                      </TableCell>
                      <TableCell>{row.class_year?.class?.class_name ?? "—"}</TableCell>
                      <TableCell>{row.section?.section_name ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {chosen.length > 0 && action !== "COMPLETED" && (
        <Card>
          <CardHeader>
            <CardTitle>4. Student exceptions</CardTitle>
            <CardDescription>
              Only choose an override where the saved section mapping does not apply to this
              student.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {chosen.map((row) => {
              const sourceClass = sourceStructure.find((item) => item.id === row.class_year_id);
              const choices = targets.filter(
                ({ classYear }) =>
                  sourceClass &&
                  (action === "REPEATED"
                    ? classYear.class.id === sourceClass.class.id
                    : classYear.class.display_order > sourceClass.class.display_order),
              );
              return (
                <div key={row.id} className="flex flex-wrap items-center gap-3">
                  <span className="min-w-40 text-sm">
                    {row.student ? getStudentDisplayName(row.student) : row.id}
                  </span>
                  <Select
                    value={overrides[row.id] ?? "default"}
                    onValueChange={(value) => {
                      setOverrides((previous) => {
                        const next = { ...previous };
                        if (value === "default") delete next[row.id];
                        else next[row.id] = value;
                        return next;
                      });
                      resetReview();
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[260px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use saved mapping</SelectItem>
                      {choices.map(({ classYear, section }) => (
                        <SelectItem key={section.id} value={section.id}>
                          {sectionLabel(classYear, section.section_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {chosen.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>5. Preview and validate</CardTitle>
            <CardDescription>
              Preview does not change enrollments. Any invalid row blocks the entire commit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={closeSource}
                onCheckedChange={(checked) => {
                  setCloseSource(checked === true);
                  resetReview();
                }}
              />
              Close source academic year after processing
            </label>
            <Button
              disabled={previewMutation.isPending || (!toYearId && action !== "COMPLETED")}
              onClick={() => previewMutation.mutate()}
            >
              {previewMutation.isPending ? "Validating…" : `Preview ${selected.size} selected`}
            </Button>
            {preview && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Selected: {preview.selected} · Eligible: {preview.eligible} · Processed:{" "}
                  {preview.processed} · Skipped: {preview.skipped}
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Status / reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows.map((item) => {
                        const row = sourceById.get(item.enrollmentId);
                        return (
                          <TableRow key={item.enrollmentId}>
                            <TableCell>
                              {row?.student
                                ? getStudentDisplayName(row.student)
                                : item.enrollmentId}
                            </TableCell>
                            <TableCell>
                              {row
                                ? `${row.class_year?.class?.class_name ?? "—"} — ${row.section?.section_name ?? "—"}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {action === "COMPLETED"
                                ? "No destination"
                                : `${years.find((year) => year.id === toYearId)?.name ?? "—"} · ${targetById.get(item.targetSectionId ?? "") ?? "—"}`}
                            </TableCell>
                            <TableCell>
                              {action === "PROMOTED"
                                ? "Promote"
                                : action === "REPEATED"
                                  ? "Repeat"
                                  : "Complete"}
                            </TableCell>
                            <TableCell
                              className={
                                item.status === "ERROR" ? "text-destructive" : "text-emerald-700"
                              }
                            >
                              {item.reason ?? (result?.processed ? "Processed" : "Eligible")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {preview.blocked && (
                  <p role="alert" className="text-sm text-destructive">
                    Resolve every error above and preview again before processing.
                  </p>
                )}
                {!preview.blocked && !result && (
                  <Button onClick={() => setConfirmOpen(true)}>
                    Confirm &amp; process {preview.eligible}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Processing result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Selected: {result.selected} · Eligible: {result.eligible} · Processed:{" "}
              {result.processed} · Skipped: {result.skipped}
            </p>
            {result.rows
              .filter((row) => row.reason)
              .map((row) => (
                <p key={row.enrollmentId} className="text-destructive">
                  {sourceById.get(row.enrollmentId)?.student
                    ? getStudentDisplayName(sourceById.get(row.enrollmentId)!.student)
                    : row.enrollmentId}{" "}
                  — {row.reason}
                </p>
              ))}
          </CardContent>
        </Card>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm year-end processing</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            This will process {preview?.eligible ?? 0} student(s) in one database transaction.
            Previous-year enrollments remain as history.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button disabled={commitMutation.isPending} onClick={() => commitMutation.mutate()}>
              {commitMutation.isPending ? "Processing…" : "Process enrollments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
