import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, IndianRupee, School } from "lucide-react";

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
import {
  fetchParentChildAttendance,
  fetchParentChildEnrollment,
  fetchParentChildFees,
  fetchParentChildProfile,
  formatAttendanceStatus,
  getStudentDisplayName,
} from "@/services/parent-portal";
import { fetchLinkedChildrenForCurrentParent } from "@/services/guardians";

export function ParentChildDetail({ studentId }: { studentId: string }) {
  const { data: childLink } = useQuery({
    queryKey: ["parent", "children"],
    queryFn: fetchLinkedChildrenForCurrentParent,
  });

  const link = childLink?.find((c) => c.id === studentId)?.link;

  const { data: student, isLoading } = useQuery({
    queryKey: ["parent", "child", studentId],
    queryFn: () => fetchParentChildProfile(studentId),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["parent", "child-attendance", studentId],
    queryFn: () => fetchParentChildAttendance(studentId),
    enabled: !!link?.can_view_attendance,
  });

  const { data: fees } = useQuery({
    queryKey: ["parent", "child-fees", studentId],
    queryFn: () => fetchParentChildFees(studentId),
    enabled: !!link?.can_view_fees,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["parent", "child-enrollment", studentId],
    queryFn: () => fetchParentChildEnrollment(studentId),
    enabled: !!link?.can_view_academic_data,
  });

  if (isLoading || !student) {
    return <p className="text-sm text-muted-foreground">Loading child details…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/parent/children">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{getStudentDisplayName(student)}</h1>
          <p className="font-mono text-sm text-muted-foreground">{student.student_number}</p>
        </div>
      </div>

      {enrollment ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enrollment</CardTitle>
            <CardDescription>{enrollment.academic_year_name}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              {enrollment.class_name} · Section {enrollment.section_name}
              {enrollment.roll_number != null ? ` · Roll ${enrollment.roll_number}` : ""}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {link?.can_view_attendance ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <School className="size-5" />
              Attendance
            </CardTitle>
            <CardDescription>Recent attendance for the active academic year.</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((row) => (
                    <TableRow key={row.attendance_date}>
                      <TableCell>{row.attendance_date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatAttendanceStatus(row.status)}</Badge>
                      </TableCell>
                      <TableCell>{row.remarks ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {link?.can_view_fees ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="size-5" />
              Fees
            </CardTitle>
            <CardDescription>Charges, payments, and outstanding balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total charges</p>
                <p className="text-lg font-semibold">₹{fees?.total_charges ?? 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-semibold">₹{fees?.total_payments ?? 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-lg font-semibold">₹{fees?.balance ?? 0}</p>
              </div>
            </div>
            {fees?.payments?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.payment_date}</TableCell>
                      <TableCell>{payment.receipt_number ?? "—"}</TableCell>
                      <TableCell>
                        {payment.cancelled ? (
                          <Badge variant="outline">Cancelled</Badge>
                        ) : (
                          `₹${payment.amount}`
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
