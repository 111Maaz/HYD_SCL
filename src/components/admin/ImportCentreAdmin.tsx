import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMISSIONS_CSV_HEADERS, GUARDIAN_LINK_CSV_HEADERS, type ImportJobType } from "@/types/import";
import {
  commitImportJob,
  createAndValidateImportJob,
  fetchImportJobs,
  fetchImportRows,
} from "@/services/import-centre";

export function ImportCentreAdmin() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobType, setJobType] = useState<ImportJobType>("ADMISSIONS");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["admin", "import-jobs"],
    queryFn: fetchImportJobs,
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "import-rows", selectedJobId],
    queryFn: () => fetchImportRows(selectedJobId!),
    enabled: !!selectedJobId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      return createAndValidateImportJob(jobType, file.name, text);
    },
    onSuccess: ({ job }) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "import-jobs"] });
      setSelectedJobId(job.id);
      toast.success(`Validated ${job.valid_count} of ${job.row_count} rows.`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const commitMutation = useMutation({
    mutationFn: (jobId: string) => commitImportJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "import-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "import-rows", selectedJobId] });
      toast.success("Import committed to ERP.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <AdminLoadingState label="Loading import jobs…" />;

  return (
    <>
      <AdminPageHeader
        title="Import Centre"
        description="Upload Google Form / Excel CSV exports. ERP remains the source of truth after commit."
        action={
          <Button onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload CSV
          </Button>
        }
      />

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadMutation.mutate(file);
          e.target.value = "";
        }}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Import type</CardTitle>
          <CardDescription>
            ADMISSIONS creates students; GUARDIAN_LINK matches existing student numbers only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={jobType === "ADMISSIONS" ? "default" : "outline"}
            size="sm"
            onClick={() => setJobType("ADMISSIONS")}
          >
            New admissions
          </Button>
          <Button
            type="button"
            variant={jobType === "GUARDIAN_LINK" ? "default" : "outline"}
            size="sm"
            onClick={() => setJobType("GUARDIAN_LINK")}
          >
            Guardian link
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Expected columns</CardTitle>
          <CardDescription>Header row must include these fields (order flexible).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(jobType === "GUARDIAN_LINK" ? GUARDIAN_LINK_CSV_HEADERS : ADMISSIONS_CSV_HEADERS).map(
            (h) => (
            <Badge key={h} variant="outline">
              {h}
            </Badge>
          ),
          )}
        </CardContent>
      </Card>

      {jobs.length === 0 ? (
        <AdminErrorState message="No imports yet. Upload a CSV to begin." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left text-sm ${
                    selectedJobId === job.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <p className="font-medium">{job.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.job_type} · {job.status} · {job.valid_count}/{job.row_count} valid
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview rows</CardTitle>
              {selectedJobId ? (
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={commitMutation.isPending}
                  onClick={() => commitMutation.mutate(selectedJobId)}
                >
                  Commit valid rows
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {!selectedJobId ? (
                <p className="text-sm text-muted-foreground">Select a job to preview.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.row_number}</TableCell>
                        <TableCell>
                          {row.raw_data.first_name ??
                            row.raw_data.student_number ??
                            "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.status === "ERROR" ? "destructive" : "outline"}>
                            {row.status}
                          </Badge>
                          {row.error_message ? (
                            <p className="mt-1 text-xs text-muted-foreground">{row.error_message}</p>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
