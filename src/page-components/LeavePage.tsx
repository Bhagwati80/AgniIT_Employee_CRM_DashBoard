"use client";
import { useState } from "react";
import { useAppContext, LeaveType } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { Plus, X } from "lucide-react";

const LEAVE_TYPES: LeaveType[] = ["Casual", "Sick", "Annual", "Emergency"];

const statusColor = (s: string) => {
  if (s === "Approved") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (s === "Rejected") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
};

function daysBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

const emptyForm = { type: "Casual" as LeaveType, startDate: "", endDate: "", reason: "" };

export default function LeavePage() {
  const { leaveRequests, addLeaveRequest } = useAppContext();
  const { currentUser } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const myRequests = leaveRequests.filter(l => l.employeeId === currentUser?.id);

  const leaveStats = LEAVE_TYPES.map(type => ({
    type,
    used: myRequests.filter(l => l.type === type && l.status === "Approved").reduce((sum, l) => sum + daysBetween(l.startDate, l.endDate), 0),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLeaveRequest({ ...form, employeeId: currentUser!.id });
    setShowModal(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage leave requests</p>
        </div>
        <button
          data-testid="button-apply-leave"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
        >
          <Plus size={15} /> Apply for Leave
        </button>
      </div>

      {/* Leave Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {leaveStats.map(({ type, used }) => (
          <div key={type} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-foreground">{used}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{type} Leave Used</p>
          </div>
        ))}
      </div>

      {/* My Leave History */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">My Leave History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Type","Start Date","End Date","Days","Reason","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No leave requests found</td></tr>
              ) : [...myRequests].reverse().map(req => (
                <tr key={req.id} data-testid={`leave-row-${req.id}`} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium text-foreground">{req.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{req.startDate}</td>
                  <td className="px-4 py-3 text-muted-foreground">{req.endDate}</td>
                  <td className="px-4 py-3 text-muted-foreground">{daysBetween(req.startDate, req.endDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{req.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(req.status)}`}>{req.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Apply for Leave</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Employee</label>
                <input value={currentUser?.name || ""} disabled className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-sm text-muted-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Leave Type</label>
                <select data-testid="select-leave-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as LeaveType })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t} Leave</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
                  <input data-testid="input-leave-start" type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
                  <input data-testid="input-leave-end" type="date" required value={form.endDate} min={form.startDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Reason</label>
                <textarea data-testid="input-leave-reason" required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3}
                  placeholder="Briefly describe the reason..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-none placeholder:text-muted-foreground" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition">Cancel</button>
                <button data-testid="button-submit-leave" type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
