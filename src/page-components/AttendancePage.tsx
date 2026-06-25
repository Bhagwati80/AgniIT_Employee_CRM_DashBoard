"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { Clock, CheckCircle } from "lucide-react";

function getToday() { return new Date().toISOString().split("T")[0]; }

function calcHours(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return "—";
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins <= 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Present: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Leave: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Half Day": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return map[status] || "bg-muted text-muted-foreground";
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function AttendancePage() {
  const { attendanceRecords, addAttendanceRecord, updateAttendanceRecord } = useAppContext();
  const { currentUser } = useAuthContext();
  const [clock, setClock] = useState(new Date());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const today = getToday();

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayRec = attendanceRecords.find(r => r.employeeId === currentUser?.id && r.date === today);
  const myRecords = attendanceRecords
    .filter(r => r.employeeId === currentUser?.id)
    .filter(r => {
      const m = new Date(r.date).getMonth();
      return m === filterMonth;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const nowTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
  };

  const handleCheckIn = () => {
    if (todayRec) return;
    addAttendanceRecord({ employeeId: currentUser!.id, date: today, checkIn: nowTime(), checkOut: null, status: "Present", workingHours: null });
  };

  const handleCheckOut = () => {
    if (!todayRec || !todayRec.checkIn || todayRec.checkOut) return;
    const time = nowTime();
    const [h1, m1] = todayRec.checkIn.split(":").map(Number);
    const [h2, m2] = time.split(":").map(Number);
    const hours = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
    updateAttendanceRecord(todayRec.id, { checkOut: time, workingHours: parseFloat(hours.toFixed(2)) });
  };

  const handleHalfDay = () => {
    if (todayRec) return;
    addAttendanceRecord({ employeeId: currentUser!.id, date: today, checkIn: nowTime(), checkOut: null, status: "Half Day", workingHours: null });
  };

  const handleLeave = () => {
    if (todayRec) return;
    addAttendanceRecord({ employeeId: currentUser!.id, date: today, checkIn: null, checkOut: null, status: "Leave", workingHours: null });
  };

  // Monthly summary
  const monthRecords = attendanceRecords.filter(r => r.employeeId === currentUser?.id && new Date(r.date).getMonth() === filterMonth);
  const daysPresent = monthRecords.filter(r => r.status === "Present").length;
  const daysLeave = monthRecords.filter(r => r.status === "Leave").length;
  const halfDays = monthRecords.filter(r => r.status === "Half Day").length;
  const avgHours = monthRecords.filter(r => r.workingHours).reduce((sum, r) => sum + (r.workingHours || 0), 0) / (monthRecords.filter(r => r.workingHours).length || 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your daily attendance</p>
      </div>

      {/* Today Panel */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Today</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold text-foreground tabular-nums">
              {clock.getHours().toString().padStart(2,"0")}:{clock.getMinutes().toString().padStart(2,"0")}:{clock.getSeconds().toString().padStart(2,"0")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Live Clock</p>
          </div>
        </div>

        {/* Status */}
        {todayRec && (
          <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-muted/30 rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(todayRec.status)}`}>{todayRec.status}</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check In</p>
              <p className="text-sm font-semibold text-foreground">{todayRec.checkIn || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check Out</p>
              <p className="text-sm font-semibold text-foreground">{todayRec.checkOut || "—"}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            data-testid="button-checkin"
            onClick={handleCheckIn}
            disabled={!!todayRec}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            <CheckCircle size={15} /> Check In
          </button>
          <button
            data-testid="button-checkout"
            onClick={handleCheckOut}
            disabled={!todayRec?.checkIn || !!todayRec?.checkOut}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            <Clock size={15} /> Check Out
          </button>
          <button
            data-testid="button-half-day"
            onClick={handleHalfDay}
            disabled={!!todayRec}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-400 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            Half Day
          </button>
          <button
            data-testid="button-mark-leave"
            onClick={handleLeave}
            disabled={!!todayRec}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            Mark Leave
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Days Present", value: daysPresent, color: "text-green-500" },
          { label: "Days on Leave", value: daysLeave, color: "text-yellow-500" },
          { label: "Half Days", value: halfDays, color: "text-orange-500" },
          { label: "Avg Working Hours", value: `${avgHours.toFixed(1)}h`, color: "text-blue-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Attendance History</h3>
          <select
            data-testid="select-month-filter"
            value={filterMonth}
            onChange={e => setFilterMonth(Number(e.target.value))}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          >
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Date","Check In","Check Out","Working Hours","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myRecords.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No records for this month</td></tr>
              ) : myRecords.map(r => (
                <tr key={r.id} data-testid={`attendance-row-${r.date}`} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium text-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.checkIn || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.checkOut || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{calcHours(r.checkIn, r.checkOut)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(r.status)}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
