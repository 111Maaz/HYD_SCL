import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { IndianRupee, Plus, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { fetchClassYearsWithDetails } from "@/services/academic-structure";
import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/services/academic-years";
import {
  createFeeStructure,
  deleteFeeStructure,
  fetchFeeStructures,
  generateChargesFromStructure,
} from "@/services/fee-structures";
import {
  cancelFeePayment,
  fetchFeeCharges,
  fetchFeePayments,
  fetchStudentLedgers,
  recordFeePayment,
} from "@/services/fees";
import { fetchStudents } from "@/services/students";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type FeeStructureInput,
  type PaymentMethod,
} from "@/types/fees";
import { getStudentDisplayName } from "@/types/students";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FeesAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("structures");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [structureForm, setStructureForm] = useState<FeeStructureInput>({
    academic_year_id: "",
    fee_name: "",
    amount: 0,
    class_year_id: null,
    due_date: "",
    active: true,
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    student_id: "",
    amount: "",
    payment_method: "CASH" as PaymentMethod,
    payment_date: new Date().toISOString().slice(0, 10),
    reference_number: "",
    notes: "",
  });

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
    if (activeYear?.id) setSelectedYearId(activeYear.id);
    else if (years[0]?.id) setSelectedYearId(years[0].id);
  }, [activeYear?.id, selectedYearId, years]);

  const { data: classYears = [] } = useQuery({
    queryKey: ["admin", "class-years", selectedYearId],
    queryFn: () => fetchClassYearsWithDetails(selectedYearId),
    enabled: Boolean(selectedYearId),
  });

  const { data: structures = [], isLoading: structuresLoading } = useQuery({
    queryKey: ["admin", "fee-structures", selectedYearId],
    queryFn: () => fetchFeeStructures(selectedYearId),
    enabled: Boolean(selectedYearId),
  });

  const { data: charges = [] } = useQuery({
    queryKey: ["admin", "fee-charges", selectedYearId],
    queryFn: () => fetchFeeCharges(selectedYearId),
    enabled: Boolean(selectedYearId) && activeTab === "charges",
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin", "fee-payments", selectedYearId],
    queryFn: () => fetchFeePayments(selectedYearId),
    enabled: Boolean(selectedYearId) && activeTab === "payments",
  });

  const { data: ledgers = [], isLoading: ledgersLoading } = useQuery({
    queryKey: ["admin", "fee-ledgers", selectedYearId],
    queryFn: () => fetchStudentLedgers(selectedYearId),
    enabled: Boolean(selectedYearId) && activeTab === "ledger",
  });

  const { data: students = [] } = useQuery({
    queryKey: ["admin", "students", ""],
    queryFn: () => fetchStudents(),
    enabled: paymentDialogOpen,
  });

  const invalidateFees = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "fee-structures"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "fee-charges"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "fee-payments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "fee-ledgers"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
  };

  const saveStructureMutation = useMutation({
    mutationFn: () =>
      createFeeStructure({
        ...structureForm,
        academic_year_id: selectedYearId,
        class_year_id: structureForm.class_year_id || null,
        due_date: structureForm.due_date || null,
      }),
    onSuccess: () => {
      invalidateFees();
      toast.success("Fee structure created.");
      setStructureDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generateMutation = useMutation({
    mutationFn: (structureId: string) => generateChargesFromStructure(structureId),
    onSuccess: (count) => {
      invalidateFees();
      toast.success(count ? `Generated ${count} charge(s).` : "All charges already exist.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteStructureMutation = useMutation({
    mutationFn: (id: string) => deleteFeeStructure(id),
    onSuccess: () => {
      invalidateFees();
      toast.success("Fee structure deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      recordFeePayment({
        student_id: paymentForm.student_id,
        academic_year_id: selectedYearId,
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        reference_number: paymentForm.reference_number || null,
        notes: paymentForm.notes || null,
      }),
    onSuccess: () => {
      invalidateFees();
      toast.success("Payment recorded.");
      setPaymentDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelPaymentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelFeePayment(id, reason),
    onSuccess: () => {
      invalidateFees();
      toast.success("Payment cancelled.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openStructureDialog = () => {
    setStructureForm({
      academic_year_id: selectedYearId,
      fee_name: "",
      amount: 0,
      class_year_id: null,
      due_date: "",
      active: true,
    });
    setStructureDialogOpen(true);
  };

  if (yearsLoading) return <AdminLoadingState label="Loading fees…" />;

  const outstandingTotal = ledgers.reduce((sum, row) => sum + Math.max(0, row.balance), 0);

  return (
    <>
      <AdminPageHeader
        title="Fees"
        description="Manage fee structures, generate charges, record payments, and view outstanding balances."
        action={
          activeTab === "structures" ? (
            <Button onClick={openStructureDialog} disabled={!selectedYearId}>
              <Plus className="size-4" />
              Add structure
            </Button>
          ) : activeTab === "payments" ? (
            <Button onClick={() => setPaymentDialogOpen(true)} disabled={!selectedYearId}>
              <Plus className="size-4" />
              Record payment
            </Button>
          ) : null
        }
      />

      <div className="mb-4 space-y-2">
        <Label>Academic year</Label>
        <Select value={selectedYearId} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select year" />
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="structures">Structures</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ledger">Outstanding</TabsTrigger>
        </TabsList>

        <TabsContent value="structures" className="mt-6">
          {structuresLoading ? (
            <AdminLoadingState label="Loading structures…" />
          ) : structures.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No fee structures yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures.map((structure) => {
                    const classYear = classYears.find((row) => row.id === structure.class_year_id);
                    return (
                      <TableRow key={structure.id}>
                        <TableCell className="font-medium">{structure.fee_name}</TableCell>
                        <TableCell>{classYear?.class.class_name ?? "All classes"}</TableCell>
                        <TableCell>{formatMoney(structure.amount)}</TableCell>
                        <TableCell>
                          {structure.due_date
                            ? format(new Date(`${structure.due_date}T12:00:00`), "d MMM yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={structure.active ? "default" : "secondary"}>
                            {structure.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateMutation.mutate(structure.id)}
                              disabled={generateMutation.isPending}
                            >
                              <Wand2 className="size-4" />
                              Generate
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteStructureMutation.mutate(structure.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="charges" className="mt-6">
          {charges.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No charges yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Concession</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>{charge.description}</TableCell>
                      <TableCell>{formatMoney(charge.amount)}</TableCell>
                      <TableCell>{formatMoney(charge.concession_amount)}</TableCell>
                      <TableCell>
                        {charge.due_date
                          ? format(new Date(`${charge.due_date}T12:00:00`), "d MMM yyyy")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          {payments.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.receipt_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(`${payment.payment_date}T12:00:00`), "d MMM yyyy")}
                      </TableCell>
                      <TableCell>{formatMoney(payment.amount)}</TableCell>
                      <TableCell>{PAYMENT_METHOD_LABELS[payment.payment_method]}</TableCell>
                      <TableCell>
                        <Badge variant={payment.cancelled ? "destructive" : "default"}>
                          {payment.cancelled ? "Cancelled" : "Recorded"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!payment.cancelled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = window.prompt("Cancellation reason:");
                              if (reason?.trim()) {
                                cancelPaymentMutation.mutate({ id: payment.id, reason });
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ledger" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 rounded-lg border bg-card p-4">
            <IndianRupee className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total outstanding</p>
              <p className="text-2xl font-semibold">{formatMoney(outstandingTotal)}</p>
            </div>
          </div>

          {ledgersLoading ? (
            <AdminLoadingState label="Loading ledger…" />
          ) : ledgers.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No fee activity for this year.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Charges</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgers
                    .sort((a, b) => b.balance - a.balance)
                    .map((row) => (
                      <TableRow key={row.student_id}>
                        <TableCell>
                          <div className="font-medium">{row.student_name}</div>
                          <div className="text-xs text-muted-foreground">{row.student_number}</div>
                        </TableCell>
                        <TableCell>{formatMoney(row.total_charges)}</TableCell>
                        <TableCell>{formatMoney(row.total_payments)}</TableCell>
                        <TableCell>
                          <span className={row.balance > 0 ? "font-medium text-destructive" : ""}>
                            {formatMoney(row.balance)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={structureDialogOpen} onOpenChange={setStructureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add fee structure</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Fee name</Label>
              <Input
                value={structureForm.fee_name}
                onChange={(e) => setStructureForm((c) => ({ ...c, fee_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (INR)</Label>
              <Input
                type="number"
                min={0}
                value={structureForm.amount || ""}
                onChange={(e) =>
                  setStructureForm((c) => ({ ...c, amount: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Class (optional)</Label>
              <Select
                value={structureForm.class_year_id || "all"}
                onValueChange={(value) =>
                  setStructureForm((c) => ({
                    ...c,
                    class_year_id: value === "all" ? null : value,
                  }))
                }
              >
                <SelectTrigger>
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
              <Label>Due date</Label>
              <Input
                type="date"
                value={structureForm.due_date ?? ""}
                onChange={(e) => setStructureForm((c) => ({ ...c, due_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStructureDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveStructureMutation.mutate()}
              disabled={saveStructureMutation.isPending || !structureForm.fee_name.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={paymentForm.student_id || "unset"}
                onValueChange={(value) =>
                  setPaymentForm((c) => ({ ...c, student_id: value === "unset" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {getStudentDisplayName(student)} ({student.student_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={1}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((c) => ({ ...c, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value) =>
                  setPaymentForm((c) => ({ ...c, payment_method: value as PaymentMethod }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment date</Label>
              <Input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm((c) => ({ ...c, payment_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={paymentForm.reference_number}
                onChange={(e) =>
                  setPaymentForm((c) => ({ ...c, reference_number: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => paymentMutation.mutate()}
              disabled={
                paymentMutation.isPending || !paymentForm.student_id || !paymentForm.amount
              }
            >
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
