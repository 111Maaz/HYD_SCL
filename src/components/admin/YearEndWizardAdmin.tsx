import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  fetchEnrollmentsForYear,
  processYearEndBatch,
  type YearEndAction,
} from "@/services/enrollments";
import { getStudentDisplayName } from "@/types/students";

export function YearEndWizardAdmin() {
  const queryClient = useQueryClient();
  const [fromYearId, setFromYearId] = useState("");
  const [toYearId, setToYearId] = useState("");
  const [action, setAction] = useState<YearEndAction>("PROMOTED");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [promoteToNextClass, setPromoteToNextClass] = useState(true);
  const [closeFromYear, setCloseFromYear] = useState(false);

  const { data: years = [], isLoading: yearsLoading } = useQuery({
    queryKey: ["admin", "academic-years"],
    queryFn: fetchAcademicYears,
  });

  const { data: enrollments = [], isLoading: enrollLoading } = useQuery({
    queryKey: ["admin", "year-end", fromYearId],
    queryFn: () => fetchEnrollmentsForYear(fromYearId),
    enabled: Boolean(fromYearId),
  });

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");

  const processMutation = useMutation({
    mutationFn: () =>
      processYearEndBatch({
        fromYearId,
        toYearId,
        enrollmentIds: [...selected],
        action,
        promoteToNextClass: action === "PROMOTED" ? promoteToNextClass : false,
        closeFromYear,
      }),
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "year-end", fromYearId] });
      toast.success(`Processed ${count} enrollment(s).`);
      setSelected(new Set());
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (yearsLoading) return <AdminLoadingState label="Loading academic years…" />;

  return (
    <>
      <AdminPageHeader
        title="Year-end wizard"
        description="Promote, repeat, or complete enrollments when closing an academic year."
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label>From year</Label>
          <Select value={fromYearId} onValueChange={setFromYearId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Closing year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>To year</Label>
          <Select value={toYearId} onValueChange={setToYearId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Next year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Action</Label>
          <Select value={action} onValueChange={(v) => setAction(v as YearEndAction)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PROMOTED">Promote</SelectItem>
              <SelectItem value="REPEATED">Repeat</SelectItem>
              <SelectItem value="COMPLETED">Complete / graduate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {action === "PROMOTED" ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={promoteToNextClass}
              onCheckedChange={(v) => setPromoteToNextClass(Boolean(v))}
            />
            Promote to next class (same section name)
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={closeFromYear}
            onCheckedChange={(v) => setCloseFromYear(Boolean(v))}
          />
          Close source academic year after processing
        </label>
      </div>

      {!fromYearId ? (
        <AdminErrorState message="Select the closing academic year to load enrollments." />
      ) : enrollLoading ? (
        <AdminLoadingState label="Loading enrollments…" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="size-5" />
              Active enrollments
            </CardTitle>
            <CardDescription>
              Select students to {action.toLowerCase()} into the target year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEnrollments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(checked) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(row.id);
                            else next.delete(row.id);
                            return next;
                          });
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
            <Button
              className="mt-4"
              disabled={
                selected.size === 0 ||
                (action !== "COMPLETED" && !toYearId) ||
                processMutation.isPending
              }
              onClick={() => processMutation.mutate()}
            >
              {processMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Process {selected.size} selected
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
