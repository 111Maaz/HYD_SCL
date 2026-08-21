import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Layers,
  Lightbulb,
  Pencil,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  applySectionRecommendations,
  createSection,
  deleteSection,
  ensureClassYearsInitialized,
  fetchClassYearsWithDetails,
  updateClassYear,
  updateSection,
} from "@/services/academic-structure";
import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/services/academic-years";
import {
  recommendSections,
  sectionEnrollmentSummary,
  type ClassYearWithClass,
  type Section,
  type SectionInput,
  type SectionRecommendation,
} from "@/types/academic";

const emptySectionForm = (): SectionInput => ({
  section_name: "",
  capacity: 40,
  active: true,
});

export function AcademicStructureAdmin() {
  const queryClient = useQueryClient();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [expandedClassYearId, setExpandedClassYearId] = useState<string | null>(null);

  const [expectedDrafts, setExpectedDrafts] = useState<Record<string, string>>({});

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionClassYear, setSectionClassYear] = useState<ClassYearWithClass | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionInput>(emptySectionForm());
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<Section | null>(null);

  const [recommendDialogOpen, setRecommendDialogOpen] = useState(false);
  const [recommendClassYear, setRecommendClassYear] = useState<ClassYearWithClass | null>(null);
  const [preferredCapacity, setPreferredCapacity] = useState("40");
  const [recommendations, setRecommendations] = useState<SectionRecommendation[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const { data: years = [], isLoading: yearsLoading } = useQuery({
    queryKey: ["admin", "academic-years"],
    queryFn: fetchAcademicYears,
  });

  const { data: activeYear } = useQuery({
    queryKey: ["admin", "active-academic-year"],
    queryFn: fetchActiveAcademicYear,
  });

  useEffect(() => {
    if (selectedYearId) return;
    if (activeYear?.id) {
      setSelectedYearId(activeYear.id);
      return;
    }
    if (years[0]?.id) {
      setSelectedYearId(years[0].id);
    }
  }, [activeYear?.id, selectedYearId, years]);

  const selectedYear = years.find((y) => y.id === selectedYearId);

  const {
    data: classYears = [],
    isLoading: structureLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "academic-structure", selectedYearId],
    queryFn: () => fetchClassYearsWithDetails(selectedYearId),
    enabled: !!selectedYearId,
  });

  useEffect(() => {
    const drafts: Record<string, string> = {};
    for (const row of classYears) {
      drafts[row.id] = String(row.expected_student_count);
    }
    setExpectedDrafts(drafts);
  }, [classYears]);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["admin", "academic-structure", selectedYearId],
    });
    void queryClient.invalidateQueries({ queryKey: ["admin", "class-years"] });
  };

  const initMutation = useMutation({
    mutationFn: () => ensureClassYearsInitialized(selectedYearId),
    onSuccess: () => {
      invalidate();
      toast.success("Class structure initialized for this academic year.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const expectedMutation = useMutation({
    mutationFn: ({ classYearId, count }: { classYearId: string; count: number }) =>
      updateClassYear(classYearId, { expected_student_count: count }),
    onSuccess: () => {
      invalidate();
      toast.success("Expected student count saved.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sectionSaveMutation = useMutation({
    mutationFn: async () => {
      if (!sectionClassYear) throw new Error("No class selected.");
      if (editingSection) {
        return updateSection(editingSection.id, sectionForm);
      }
      return createSection(sectionClassYear.id, sectionForm);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editingSection ? "Section updated." : "Section added.");
      closeSectionDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sectionDeleteMutation = useMutation({
    mutationFn: (sectionId: string) => deleteSection(sectionId),
    onSuccess: () => {
      invalidate();
      toast.success("Section deleted.");
      setDeleteSectionTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const recommendMutation = useMutation({
    mutationFn: async () => {
      if (!recommendClassYear) throw new Error("No class selected.");
      return applySectionRecommendations(recommendClassYear.id, recommendations, {
        replaceExisting,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Recommended sections applied.");
      setRecommendDialogOpen(false);
      setRecommendClassYear(null);
      setRecommendations([]);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openAddSection = (classYear: ClassYearWithClass) => {
    setSectionClassYear(classYear);
    setEditingSection(null);
    setSectionForm({
      ...emptySectionForm(),
      display_order: classYear.sections.length + 1,
    });
    setSectionDialogOpen(true);
  };

  const openEditSection = (classYear: ClassYearWithClass, section: Section) => {
    setSectionClassYear(classYear);
    setEditingSection(section);
    setSectionForm({
      section_name: section.section_name,
      capacity: section.capacity,
      display_order: section.display_order,
      active: section.active,
    });
    setSectionDialogOpen(true);
  };

  const closeSectionDialog = () => {
    setSectionDialogOpen(false);
    setSectionClassYear(null);
    setEditingSection(null);
    setSectionForm(emptySectionForm());
  };

  const openRecommend = (classYear: ClassYearWithClass) => {
    const preferred = Number(preferredCapacity) || 40;
    const recs = recommendSections(classYear.expected_student_count, preferred);
    setRecommendClassYear(classYear);
    setRecommendations(recs);
    setReplaceExisting(classYear.sections.length > 0);
    setRecommendDialogOpen(true);
  };

  const recomputeRecommendations = (classYear: ClassYearWithClass, preferred: number) => {
    setRecommendations(recommendSections(classYear.expected_student_count, preferred));
  };

  if (yearsLoading) return <AdminLoadingState label="Loading academic years…" />;

  return (
    <>
      <AdminPageHeader
        title="Academic structure"
        description="Plan expected class sizes and define sections for the selected academic year."
        action={
          selectedYearId ? (
            <Button
              variant="outline"
              disabled={initMutation.isPending}
              onClick={() => initMutation.mutate()}
            >
              <Layers className="size-4" />
              Initialize classes
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 sm:w-72">
          <Label>Academic year</Label>
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                  {year.status === "ACTIVE" ? " (Active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedYear && (
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium text-foreground">{selectedYear.status}</span>
          </p>
        )}
      </div>

      {years.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="font-medium">Create an academic year first</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Go to Academic Years to add a year, then return here to plan sections.
          </p>
        </div>
      ) : structureLoading ? (
        <AdminLoadingState label="Loading class structure…" />
      ) : isError ? (
        <AdminErrorState
          message={error instanceof Error ? error.message : "Failed to load academic structure."}
        />
      ) : classYears.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <Layers className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 font-medium">No class structure for this year</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Initialize classes to create Class 1–10 rows for {selectedYear?.name}.
          </p>
          <Button className="mt-6" disabled={initMutation.isPending} onClick={() => initMutation.mutate()}>
            Initialize classes
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {classYears.map((classYear) => {
            const summary = sectionEnrollmentSummary(classYear.sections);
            const isOpen = expandedClassYearId === classYear.id;

            return (
              <Collapsible
                key={classYear.id}
                open={isOpen}
                onOpenChange={(open) => setExpandedClassYearId(open ? classYear.id : null)}
                className="rounded-xl border bg-card"
              >
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <ChevronDown
                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                      <div>
                        <p className="font-semibold">{classYear.class.class_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {summary.activeSections} section{summary.activeSections === 1 ? "" : "s"}
                          {summary.totalCapacity > 0
                            ? ` · ${summary.totalCapacity} total capacity`
                            : ""}
                        </p>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <div className="flex flex-wrap items-end gap-2 lg:justify-end">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Expected students</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={0}
                          className="h-9 w-24"
                          value={expectedDrafts[classYear.id] ?? "0"}
                          onChange={(e) =>
                            setExpectedDrafts((prev) => ({
                              ...prev,
                              [classYear.id]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={expectedMutation.isPending}
                          onClick={() => {
                            const count = Number(expectedDrafts[classYear.id] ?? 0);
                            if (Number.isNaN(count) || count < 0) {
                              toast.error("Enter a valid expected student count.");
                              return;
                            }
                            expectedMutation.mutate({ classYearId: classYear.id, count });
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openRecommend(classYear)}>
                      <Wand2 className="size-4" />
                      Suggest sections
                    </Button>
                    <Button size="sm" onClick={() => openAddSection(classYear)}>
                      <Plus className="size-4" />
                      Add section
                    </Button>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="border-t px-4 pb-4">
                    {classYear.sections.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No sections yet. Use Suggest sections or Add section.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Section</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classYear.sections.map((section) => (
                            <TableRow key={section.id}>
                              <TableCell className="font-medium">{section.section_name}</TableCell>
                              <TableCell>{section.capacity ?? "—"}</TableCell>
                              <TableCell>{section.display_order}</TableCell>
                              <TableCell>
                                <Badge variant={section.active ? "default" : "secondary"}>
                                  {section.active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditSection(classYear, section)}
                                  >
                                    <Pencil className="size-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteSectionTarget(section)}
                                  >
                                    <Trash2 className="size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      <Dialog open={sectionDialogOpen} onOpenChange={(open) => !open && closeSectionDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? "Edit section" : "Add section"}
              {sectionClassYear ? ` — ${sectionClassYear.class.class_name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Section name</Label>
              <Input
                id="section-name"
                placeholder="e.g. A"
                value={sectionForm.section_name}
                onChange={(e) =>
                  setSectionForm((prev) => ({ ...prev, section_name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="section-capacity">Capacity</Label>
                <Input
                  id="section-capacity"
                  type="number"
                  min={1}
                  value={sectionForm.capacity ?? ""}
                  onChange={(e) =>
                    setSectionForm((prev) => ({
                      ...prev,
                      capacity: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section-order">Display order</Label>
                <Input
                  id="section-order"
                  type="number"
                  min={1}
                  value={sectionForm.display_order ?? 1}
                  onChange={(e) =>
                    setSectionForm((prev) => ({
                      ...prev,
                      display_order: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="section-active">Active</Label>
              <Switch
                id="section-active"
                checked={sectionForm.active ?? true}
                onCheckedChange={(checked) =>
                  setSectionForm((prev) => ({ ...prev, active: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSectionDialog}>
              Cancel
            </Button>
            <Button
              disabled={!sectionForm.section_name.trim() || sectionSaveMutation.isPending}
              onClick={() => sectionSaveMutation.mutate()}
            >
              {editingSection ? "Save changes" : "Add section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={recommendDialogOpen}
        onOpenChange={(open) => {
          setRecommendDialogOpen(open);
          if (!open) {
            setRecommendClassYear(null);
            setRecommendations([]);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Suggest sections
              {recommendClassYear ? ` — ${recommendClassYear.class.class_name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {recommendClassYear && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <Lightbulb className="mt-0.5 size-4 shrink-0" />
                <p>
                  The system recommends a structure based on expected students (
                  {recommendClassYear.expected_student_count}). You can adjust before applying.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred-capacity">Preferred capacity per section</Label>
                <Input
                  id="preferred-capacity"
                  type="number"
                  min={1}
                  value={preferredCapacity}
                  onChange={(e) => {
                    setPreferredCapacity(e.target.value);
                    recomputeRecommendations(recommendClassYear, Number(e.target.value) || 40);
                  }}
                />
              </div>
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Set an expected student count greater than zero to get recommendations.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Capacity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recommendations.map((rec) => (
                        <TableRow key={rec.sectionName}>
                          <TableCell>{rec.sectionName}</TableCell>
                          <TableCell>{rec.capacity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {recommendClassYear.sections.length > 0 && (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="replace-sections">Replace existing sections</Label>
                    <p className="text-xs text-muted-foreground">
                      Fails if enrollments already exist for current sections.
                    </p>
                  </div>
                  <Switch
                    id="replace-sections"
                    checked={replaceExisting}
                    onCheckedChange={setReplaceExisting}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecommendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={recommendations.length === 0 || recommendMutation.isPending}
              onClick={() => recommendMutation.mutate()}
            >
              Apply recommendations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteSectionTarget}
        onOpenChange={(open) => !open && setDeleteSectionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes section {deleteSectionTarget?.section_name}. It cannot be undone if
              enrollments exist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteSectionTarget && sectionDeleteMutation.mutate(deleteSectionTarget.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
