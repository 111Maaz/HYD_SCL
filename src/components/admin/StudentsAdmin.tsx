import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Pencil, Plus, School, Search, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { fetchClassYearsWithDetails } from "@/services/academic-structure";
import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/services/academic-years";
import {
  createEnrollment,
  deleteEnrollment,
  fetchEnrollmentsForYear,
  fetchStudentsEligibleForEnrollment,
  setEnrollmentStatus,
  suggestNextRollNumber,
  updateEnrollment,
} from "@/services/enrollments";
import {
  createStudent,
  deleteStudent,
  fetchStudents,
  setStudentStatus,
  updateStudent,
} from "@/services/students";
import type { ClassYearWithClass } from "@/types/academic";
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
  getStudentDisplayName,
  type EnrollmentInput,
  type EnrollmentStatus,
  type EnrollmentWithDetails,
  type Student,
  type StudentInput,
  type StudentStatus,
} from "@/types/students";

type StudentFormState = StudentInput & {
  enrollInActiveYear: boolean;
  classYearId: string;
  sectionId: string;
};

type EnrollmentFormState = {
  student_id: string;
  class_year_id: string;
  section_id: string;
  roll_number: string;
  enrollment_date: string;
  notes: string;
};

const emptyStudentForm = (): StudentFormState => ({
  first_name: "",
  middle_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  admission_date: new Date().toISOString().slice(0, 10),
  status: "ACTIVE",
  enrollInActiveYear: false,
  classYearId: "",
  sectionId: "",
});

const emptyEnrollmentForm = (): EnrollmentFormState => ({
  student_id: "",
  class_year_id: "",
  section_id: "",
  roll_number: "",
  enrollment_date: new Date().toISOString().slice(0, 10),
  notes: "",
});

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return format(new Date(`${value}T12:00:00`), "d MMM yyyy");
  } catch {
    return value;
  }
}

function studentStatusVariant(status: StudentStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "ARCHIVED") return "secondary";
  if (status === "WITHDRAWN" || status === "TRANSFERRED") return "destructive";
  return "outline";
}

function enrollmentStatusVariant(
  status: EnrollmentStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "PROMOTED" || status === "COMPLETED") return "secondary";
  if (status === "WITHDRAWN" || status === "TRANSFERRED") return "destructive";
  return "outline";
}

export function StudentsAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedYearId, setSelectedYearId] = useState("");
  const [filterClassYearId, setFilterClassYearId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");

  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<StudentFormState>(emptyStudentForm());
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<Student | null>(null);

  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormState>(emptyEnrollmentForm());
  const [deleteEnrollmentTarget, setDeleteEnrollmentTarget] = useState<EnrollmentWithDetails | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

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

  const {
    data: students = [],
    isLoading: studentsLoading,
    isError: studentsError,
    error: studentsLoadError,
  } = useQuery({
    queryKey: ["admin", "students", debouncedSearch],
    queryFn: () => fetchStudents(debouncedSearch),
  });

  const { data: classYears = [], isLoading: classYearsLoading } = useQuery({
    queryKey: ["admin", "class-years", selectedYearId],
    queryFn: () => fetchClassYearsWithDetails(selectedYearId),
    enabled: Boolean(selectedYearId),
  });

  const { data: activeYearClassYears = [] } = useQuery({
    queryKey: ["admin", "class-years", activeYear?.id],
    queryFn: () => fetchClassYearsWithDetails(activeYear!.id),
    enabled: Boolean(activeYear?.id),
  });

  const {
    data: enrollments = [],
    isLoading: enrollmentsLoading,
    isError: enrollmentsError,
    error: enrollmentsLoadError,
  } = useQuery({
    queryKey: [
      "admin",
      "enrollments",
      selectedYearId,
      filterClassYearId,
      filterSectionId,
    ],
    queryFn: () =>
      fetchEnrollmentsForYear(selectedYearId, {
        classYearId: filterClassYearId || undefined,
        sectionId: filterSectionId || undefined,
      }),
    enabled: Boolean(selectedYearId),
  });

  const { data: eligibleStudents = [] } = useQuery({
    queryKey: ["admin", "students-eligible", selectedYearId],
    queryFn: () => fetchStudentsEligibleForEnrollment(selectedYearId),
    enabled: Boolean(selectedYearId) && enrollmentDialogOpen && !editingEnrollment,
  });

  const invalidateStudents = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "students-eligible"] });
  };

  const invalidateEnrollments = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "students-eligible"] });
  };

  const enrollmentClassYears = useMemo(
    () => classYears.filter((row) => row.active && row.sections.some((section) => section.active)),
    [classYears],
  );

  const studentFormClassYears = useMemo(() => {
    return activeYearClassYears.filter(
      (row) => row.active && row.sections.some((section) => section.active),
    );
  }, [activeYearClassYears]);

  const filterSections = useMemo(() => {
    if (!filterClassYearId) return [];
    const classYear = classYears.find((row) => row.id === filterClassYearId);
    return classYear?.sections.filter((section) => section.active) ?? [];
  }, [classYears, filterClassYearId]);

  const enrollmentFormSections = useMemo(() => {
    if (!enrollmentForm.class_year_id) return [];
    const classYear = classYears.find((row) => row.id === enrollmentForm.class_year_id);
    return classYear?.sections.filter((section) => section.active) ?? [];
  }, [classYears, enrollmentForm.class_year_id]);

  const studentFormSections = useMemo(() => {
    if (!studentForm.classYearId) return [];
    const classYear = studentFormClassYears.find((row) => row.id === studentForm.classYearId);
    return classYear?.sections.filter((section) => section.active) ?? [];
  }, [studentForm.classYearId, studentFormClassYears]);

  useEffect(() => {
    if (!enrollmentDialogOpen || editingEnrollment || !enrollmentForm.section_id || !selectedYearId) {
      return;
    }

    let cancelled = false;
    void suggestNextRollNumber(selectedYearId, enrollmentForm.section_id).then((roll) => {
      if (!cancelled) {
        setEnrollmentForm((current) =>
          current.roll_number ? current : { ...current, roll_number: String(roll) },
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    editingEnrollment,
    enrollmentDialogOpen,
    enrollmentForm.section_id,
    selectedYearId,
  ]);

  const saveStudentMutation = useMutation({
    mutationFn: async () => {
      const {
        enrollInActiveYear,
        classYearId,
        sectionId,
        ...input
      } = studentForm;

      const payload: StudentInput = {
        ...input,
        middle_name: input.middle_name || null,
        last_name: input.last_name || null,
        date_of_birth: input.date_of_birth || null,
        gender: input.gender || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        admission_date: input.admission_date || null,
      };

      if (editingStudent) {
        return updateStudent(editingStudent.id, payload);
      }

      const student = await createStudent(payload);

      if (enrollInActiveYear && activeYear?.id && classYearId && sectionId) {
        await createEnrollment({
          student_id: student.id,
          academic_year_id: activeYear.id,
          class_year_id: classYearId,
          section_id: sectionId,
          enrollment_date: input.admission_date || undefined,
        });
      }

      return student;
    },
    onSuccess: () => {
      invalidateStudents();
      invalidateEnrollments();
      toast.success(editingStudent ? "Student updated." : "Student created.");
      setStudentDialogOpen(false);
      setEditingStudent(null);
      setStudentForm(emptyStudentForm());
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const studentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StudentStatus }) =>
      setStudentStatus(id, status),
    onSuccess: () => {
      invalidateStudents();
      toast.success("Student status updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      invalidateStudents();
      toast.success("Student deleted.");
      setDeleteStudentTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveEnrollmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedYearId) {
        throw new Error("Select an academic year first.");
      }

      const rollNumber = enrollmentForm.roll_number.trim()
        ? Number(enrollmentForm.roll_number)
        : null;

      if (editingEnrollment) {
        return updateEnrollment(editingEnrollment.id, {
          class_year_id: enrollmentForm.class_year_id,
          section_id: enrollmentForm.section_id,
          roll_number: rollNumber,
          notes: enrollmentForm.notes || null,
        });
      }

      const input: EnrollmentInput = {
        student_id: enrollmentForm.student_id,
        academic_year_id: selectedYearId,
        class_year_id: enrollmentForm.class_year_id,
        section_id: enrollmentForm.section_id,
        roll_number: rollNumber,
        enrollment_date: enrollmentForm.enrollment_date || undefined,
        notes: enrollmentForm.notes || null,
      };

      return createEnrollment(input);
    },
    onSuccess: () => {
      invalidateEnrollments();
      toast.success(editingEnrollment ? "Enrollment updated." : "Student enrolled.");
      setEnrollmentDialogOpen(false);
      setEditingEnrollment(null);
      setEnrollmentForm(emptyEnrollmentForm());
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const enrollmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnrollmentStatus }) =>
      setEnrollmentStatus(id, status),
    onSuccess: () => {
      invalidateEnrollments();
      toast.success("Enrollment status updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: (id: string) => deleteEnrollment(id),
    onSuccess: () => {
      invalidateEnrollments();
      toast.success("Enrollment removed.");
      setDeleteEnrollmentTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreateStudent = () => {
    setEditingStudent(null);
    setStudentForm(emptyStudentForm());
    setStudentDialogOpen(true);
  };

  const openEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      first_name: student.first_name,
      middle_name: student.middle_name ?? "",
      last_name: student.last_name ?? "",
      date_of_birth: student.date_of_birth ?? "",
      gender: student.gender ?? "",
      phone: student.phone ?? "",
      email: student.email ?? "",
      address: student.address ?? "",
      admission_date: student.admission_date ?? "",
      status: student.status,
      enrollInActiveYear: false,
      classYearId: "",
      sectionId: "",
    });
    setStudentDialogOpen(true);
  };

  const openCreateEnrollment = () => {
    setEditingEnrollment(null);
    setEnrollmentForm(emptyEnrollmentForm());
    setEnrollmentDialogOpen(true);
  };

  const openEditEnrollment = (enrollment: EnrollmentWithDetails) => {
    setEditingEnrollment(enrollment);
    setEnrollmentForm({
      student_id: enrollment.student_id,
      class_year_id: enrollment.class_year_id,
      section_id: enrollment.section_id,
      roll_number: enrollment.roll_number != null ? String(enrollment.roll_number) : "",
      enrollment_date: enrollment.enrollment_date,
      notes: enrollment.notes ?? "",
    });
    setEnrollmentDialogOpen(true);
  };

  if (yearsLoading) return <AdminLoadingState label="Loading students…" />;

  return (
    <>
      <AdminPageHeader
        title="Students"
        description="Manage student records and class enrollments. Student IDs are permanent (HS-YYYY-NNNNN)."
        action={
          activeTab === "students" ? (
            <Button onClick={openCreateStudent}>
              <Plus className="size-4" />
              Add student
            </Button>
          ) : (
            <Button onClick={openCreateEnrollment} disabled={!selectedYearId}>
              <UserPlus className="size-4" />
              Enroll student
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or student ID…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {studentsLoading ? (
            <AdminLoadingState label="Loading students…" />
          ) : studentsError ? (
            <AdminErrorState
              message={
                studentsLoadError instanceof Error
                  ? studentsLoadError.message
                  : "Failed to load students."
              }
            />
          ) : students.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
              <School className="mx-auto size-10 text-muted-foreground" aria-hidden />
              <p className="mt-4 font-medium">No students yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first student to start building enrollment records.
              </p>
              <Button className="mt-4" onClick={openCreateStudent}>
                <Plus className="size-4" />
                Add student
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date of birth</TableHead>
                    <TableHead>Admission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">{student.student_number}</TableCell>
                      <TableCell className="font-medium">{getStudentDisplayName(student)}</TableCell>
                      <TableCell>{formatDate(student.date_of_birth)}</TableCell>
                      <TableCell>{formatDate(student.admission_date)}</TableCell>
                      <TableCell>
                        <Select
                          value={student.status}
                          onValueChange={(value) =>
                            studentStatusMutation.mutate({
                              id: student.id,
                              status: value as StudentStatus,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <Badge variant={studentStatusVariant(student.status)}>
                              {STUDENT_STATUS_LABELS[student.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STUDENT_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {STUDENT_STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${getStudentDisplayName(student)}`}
                            onClick={() => openEditStudent(student)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${getStudentDisplayName(student)}`}
                            onClick={() => setDeleteStudentTarget(student)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <Label>Academic year</Label>
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="w-[220px]">
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

            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={filterClassYearId || "all"}
                onValueChange={(value) => {
                  setFilterClassYearId(value === "all" ? "" : value);
                  setFilterSectionId("");
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classYears.map((classYear) => (
                    <SelectItem key={classYear.id} value={classYear.id}>
                      {classYear.class.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                value={filterSectionId || "all"}
                onValueChange={(value) => setFilterSectionId(value === "all" ? "" : value)}
                disabled={!filterClassYearId}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {filterSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {classYearsLoading || enrollmentsLoading ? (
            <AdminLoadingState label="Loading enrollments…" />
          ) : enrollmentsError ? (
            <AdminErrorState
              message={
                enrollmentsLoadError instanceof Error
                  ? enrollmentsLoadError.message
                  : "Failed to load enrollments."
              }
            />
          ) : enrollments.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
              <UserPlus className="mx-auto size-10 text-muted-foreground" aria-hidden />
              <p className="mt-4 font-medium">No enrollments for this year</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Enroll students into class sections for the selected academic year.
              </p>
              <Button className="mt-4" onClick={openCreateEnrollment} disabled={!selectedYearId}>
                <UserPlus className="size-4" />
                Enroll student
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-mono">{enrollment.roll_number ?? "—"}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getStudentDisplayName(enrollment.student)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {enrollment.student.student_number}
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.class_year.class.class_name}</TableCell>
                      <TableCell>{enrollment.section.section_name}</TableCell>
                      <TableCell>{formatDate(enrollment.enrollment_date)}</TableCell>
                      <TableCell>
                        <Select
                          value={enrollment.status}
                          onValueChange={(value) =>
                            enrollmentStatusMutation.mutate({
                              id: enrollment.id,
                              status: value as EnrollmentStatus,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <Badge variant={enrollmentStatusVariant(enrollment.status)}>
                              {ENROLLMENT_STATUS_LABELS[enrollment.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {ENROLLMENT_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {ENROLLMENT_STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit enrollment"
                            onClick={() => openEditEnrollment(enrollment)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete enrollment"
                            onClick={() => setDeleteEnrollmentTarget(enrollment)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit student" : "Add student"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {editingStudent && (
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input value={editingStudent.student_number} disabled />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="first_name">First name *</Label>
                <Input
                  id="first_name"
                  value={studentForm.first_name}
                  onChange={(event) =>
                    setStudentForm((current) => ({ ...current, first_name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle name</Label>
                <Input
                  id="middle_name"
                  value={studentForm.middle_name ?? ""}
                  onChange={(event) =>
                    setStudentForm((current) => ({ ...current, middle_name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={studentForm.last_name ?? ""}
                  onChange={(event) =>
                    setStudentForm((current) => ({ ...current, last_name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={studentForm.date_of_birth ?? ""}
                  onChange={(event) =>
                    setStudentForm((current) => ({ ...current, date_of_birth: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={studentForm.gender || "unset"}
                  onValueChange={(value) =>
                    setStudentForm((current) => ({
                      ...current,
                      gender: value === "unset" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not specified</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admission_date">Admission date</Label>
                <Input
                  id="admission_date"
                  type="date"
                  value={studentForm.admission_date ?? ""}
                  onChange={(event) =>
                    setStudentForm((current) => ({ ...current, admission_date: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_status">Status</Label>
                <Select
                  value={studentForm.status}
                  onValueChange={(value) =>
                    setStudentForm((current) => ({ ...current, status: value as StudentStatus }))
                  }
                >
                  <SelectTrigger id="student_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STUDENT_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={studentForm.phone ?? ""}
                  onChange={(event) =>
                    setStudentForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={studentForm.email ?? ""}
                  onChange={(event) =>
                    setStudentForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={studentForm.address ?? ""}
                  onChange={(event) =>
                    setStudentForm((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </div>
            </div>

            {!editingStudent && activeYear && studentFormClassYears.length > 0 && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="enroll_in_active_year"
                    checked={studentForm.enrollInActiveYear}
                    onCheckedChange={(checked) =>
                      setStudentForm((current) => ({
                        ...current,
                        enrollInActiveYear: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="enroll_in_active_year">
                    Enroll in active year ({activeYear.name})
                  </Label>
                </div>

                {studentForm.enrollInActiveYear && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select
                        value={studentForm.classYearId || "unset"}
                        onValueChange={(value) =>
                          setStudentForm((current) => ({
                            ...current,
                            classYearId: value === "unset" ? "" : value,
                            sectionId: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentFormClassYears.map((classYear: ClassYearWithClass) => (
                            <SelectItem key={classYear.id} value={classYear.id}>
                              {classYear.class.class_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select
                        value={studentForm.sectionId || "unset"}
                        onValueChange={(value) =>
                          setStudentForm((current) => ({
                            ...current,
                            sectionId: value === "unset" ? "" : value,
                          }))
                        }
                        disabled={!studentForm.classYearId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentFormSections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.section_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveStudentMutation.mutate()}
              disabled={saveStudentMutation.isPending || !studentForm.first_name.trim()}
            >
              {saveStudentMutation.isPending ? "Saving…" : editingStudent ? "Save changes" : "Create student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEnrollment ? "Edit enrollment" : "Enroll student"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {!editingEnrollment && (
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={enrollmentForm.student_id || "unset"}
                  onValueChange={(value) =>
                    setEnrollmentForm((current) => ({
                      ...current,
                      student_id: value === "unset" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleStudents.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No eligible students
                      </SelectItem>
                    ) : (
                      eligibleStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {getStudentDisplayName(student)} ({student.student_number})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editingEnrollment && (
              <div className="space-y-2">
                <Label>Student</Label>
                <Input
                  value={`${getStudentDisplayName(editingEnrollment.student)} (${editingEnrollment.student.student_number})`}
                  disabled
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={enrollmentForm.class_year_id || "unset"}
                  onValueChange={(value) =>
                    setEnrollmentForm((current) => ({
                      ...current,
                      class_year_id: value === "unset" ? "" : value,
                      section_id: "",
                      roll_number: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollmentClassYears.map((classYear) => (
                      <SelectItem key={classYear.id} value={classYear.id}>
                        {classYear.class.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select
                  value={enrollmentForm.section_id || "unset"}
                  onValueChange={(value) =>
                    setEnrollmentForm((current) => ({
                      ...current,
                      section_id: value === "unset" ? "" : value,
                      roll_number: "",
                    }))
                  }
                  disabled={!enrollmentForm.class_year_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollmentFormSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll_number">Roll number</Label>
                <Input
                  id="roll_number"
                  type="number"
                  min={1}
                  value={enrollmentForm.roll_number}
                  onChange={(event) =>
                    setEnrollmentForm((current) => ({ ...current, roll_number: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enrollment_date">Enrollment date</Label>
                <Input
                  id="enrollment_date"
                  type="date"
                  value={enrollmentForm.enrollment_date}
                  onChange={(event) =>
                    setEnrollmentForm((current) => ({
                      ...current,
                      enrollment_date: event.target.value,
                    }))
                  }
                  disabled={Boolean(editingEnrollment)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="enrollment_notes">Notes</Label>
                <Textarea
                  id="enrollment_notes"
                  rows={2}
                  value={enrollmentForm.notes}
                  onChange={(event) =>
                    setEnrollmentForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveEnrollmentMutation.mutate()}
              disabled={
                saveEnrollmentMutation.isPending ||
                (!editingEnrollment && !enrollmentForm.student_id) ||
                !enrollmentForm.class_year_id ||
                !enrollmentForm.section_id
              }
            >
              {saveEnrollmentMutation.isPending
                ? "Saving…"
                : editingEnrollment
                  ? "Save changes"
                  : "Enroll student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteStudentTarget)}
        onOpenChange={(open) => !open && setDeleteStudentTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteStudentTarget
                ? `Remove ${getStudentDisplayName(deleteStudentTarget)} (${deleteStudentTarget.student_number})? This only works if the student has no enrollment history.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteStudentTarget && deleteStudentMutation.mutate(deleteStudentTarget.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteEnrollmentTarget)}
        onOpenChange={(open) => !open && setDeleteEnrollmentTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove enrollment?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteEnrollmentTarget
                ? `Remove enrollment for ${getStudentDisplayName(deleteEnrollmentTarget.student)} in ${deleteEnrollmentTarget.class_year.class.class_name} ${deleteEnrollmentTarget.section.section_name}?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteEnrollmentTarget &&
                deleteEnrollmentMutation.mutate(deleteEnrollmentTarget.id)
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
