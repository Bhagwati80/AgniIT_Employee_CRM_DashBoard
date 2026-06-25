"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import {
  Users, Clock, UserX, Calendar, CheckSquare, TrendingUp,
  BarChart2, Award, AlertCircle, ArrowUpRight
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string | null) {
  if (!t) return "—";
  return t;
}

function calcWorking(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return "—";
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins <= 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const { employees, attendanceRecords, tasks, leaveRequests, addAttendanceRecord, updateAttendanceRecord } = useAppContext();
  const { currentUser } = useAuthContext();
  const [elapsed, setElapsed] = useState("");

  const today = getToday();
  const todayRec = attendanceRecords.find(r => r.employeeId === currentUser?.id && r.date === today);
  const approvedLeave = leaveRequests.find(
    l => l.employeeId === currentUser?.id && l.status === "Approved" &&
      today >= l.startDate && today <= l.endDate
  );

  useEffect(() => {
    if (!todayRec?.checkIn || todayRec?.checkOut) return;
    const update = () => {
      const [h, m] = todayRec.checkIn!.split(":").map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const diff = Math.floor((Date.now() - start.getTime()) / 1000);
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      setElapsed(`${hrs}h ${mins}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [todayRec?.checkIn, todayRec?.checkOut]);

  const handleCheckIn = () => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    addAttendanceRecord({ employeeId: currentUser!.id, date: today, checkIn: time, checkOut: null, status: "Present", workingHours: null });
  };

  const handleCheckOut = () => {
    if (!todayRec) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const [h1, m1] = todayRec.checkIn!.split(":").map(Number);
    const [h2, m2] = time.split(":").map(Number);
    const hours = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
    updateAttendanceRecord(todayRec.id, { checkOut: time, workingHours: parseFloat(hours.toFixed(2)) });
  };

  // Stats
  const totalEmployees = employees.length;
  const todayAttendance = attendanceRecords.filter(r => r.date === today);
  const presentToday = todayAttendance.filter(r => r.status === "Present" || r.status === "Half Day").length;
  const absentToday = todayAttendance.filter(r => r.status === "Absent").length;
  const onLeave = todayAttendance.filter(r => r.status === "Leave").length;
  const pendingTasks = tasks.filter(t => t.status === "Pending").length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Weekly timeline for current user
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i);
    const ds = d.toISOString().split("T")[0];
    const rec = attendanceRecords.find(r => r.employeeId === currentUser?.id && r.date === ds);
    const isToday = ds === today;
    return { day: DAYS[i], date: ds, status: rec?.status || null, isToday };
  });

  // Attendance chart data
  const attChartData = [
    { name: "Present", value: presentToday, color: "#22c55e" },
    { name: "Absent", value: absentToday, color: "#ef4444" },
    { name: "Leave", value: onLeave, color: "#eab308" },
    { name: "Half Day", value: todayAttendance.filter(r => r.status === "Half Day").length, color: "#f97316" },
  ].filter(d => d.value > 0);

  const taskChartData = [
    { name: "Pending", value: tasks.filter(t => t.status === "Pending").length, fill: "#eab308" },
    { name: "In Progress", value: tasks.filter(t => t.status === "In Progress").length, fill: "#3b82f6" },
    { name: "Completed", value: tasks.filter(t => t.status === "Completed").length, fill: "#22c55e" },
  ];

  const deptData = employees.reduce((acc: Record<string, number>, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {});
  const deptChartData = Object.entries(deptData).map(([name, value]) => ({ name, value }));

  const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id).slice(0, 5);
  const todayStr = new Date().toISOString().split("T")[0];

  const statusColor = (s: string) => {
    if (s === "Completed") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (s === "In Progress") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  };

  const dayColor = (status: string | null, isToday: boolean) => {
    const base = isToday ? "ring-2 ring-primary" : "";
    if (status === "Present") return `bg-green-500 text-white ${base}`;
    if (status === "Absent") return `bg-red-500 text-white ${base}`;
    if (status === "Leave") return `bg-yellow-400 text-white ${base}`;
    if (status === "Half Day") return `bg-orange-400 text-white ${base}`;
    return `bg-muted text-muted-foreground ${base}`;
  };

  // Recent activity
  const recentActivity = [
    ...attendanceRecords.filter(r => r.date === today).map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return {
        time: r.checkIn || "",
        text: `${emp?.name || "Unknown"} checked in at ${r.checkIn || "—"}`,
        type: "checkin"
      };
    }),
    ...leaveRequests.slice(-3).map(l => {
      const emp = employees.find(e => e.id === l.employeeId);
      return {
        time: l.requestedAt,
        text: `${emp?.name || "Unknown"} requested ${l.type} leave`,
        type: "leave"
      };
    }),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8);

  const stats = [
    { label: "Total Employees", value: totalEmployees, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Present Today", value: presentToday, icon: CheckSquare, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Absent Today", value: absentToday, icon: UserX, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
    { label: "On Leave", value: onLeave, icon: Calendar, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { label: "Pending Tasks", value: pendingTasks, icon: Clock, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { label: "Completed Tasks", value: completedTasks, icon: CheckSquare, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Attendance Rate", value: `${attendanceRate}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Productivity Score", value: `${completionRate}%`, icon: Award, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{currentUser?.position} · {currentUser?.department}</p>
      </div>

      {/* Attendance Status Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        {approvedLeave ? (
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <Calendar size={22} className="text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">You are on approved leave today</p>
              <p className="text-sm text-muted-foreground mt-0.5">{approvedLeave.type} Leave — {approvedLeave.reason}</p>
            </div>
          </div>
        ) : !todayRec ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-muted rounded-xl"><Clock size={22} className="text-muted-foreground" /></div>
              <div>
                <p className="font-semibold text-foreground">You have not checked in today</p>
                <p className="text-sm text-muted-foreground mt-0.5">Start your workday by marking attendance</p>
              </div>
            </div>
            <button
              data-testid="button-checkin"
              onClick={handleCheckIn}
              className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition"
            >
              Check In
            </button>
          </div>
        ) : !todayRec.checkOut ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"><Clock size={22} className="text-green-500" /></div>
              <div>
                <p className="font-semibold text-foreground">You are currently checked in</p>
                <p className="text-sm text-muted-foreground mt-0.5">Checked in at <span className="font-medium text-foreground">{todayRec.checkIn}</span> · Working for <span className="font-medium text-foreground">{elapsed}</span></p>
              </div>
            </div>
            <button
              data-testid="button-checkout"
              onClick={handleCheckOut}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition"
            >
              Check Out
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"><CheckSquare size={22} className="text-green-500" /></div>
            <div>
              <p className="font-semibold text-foreground">Attendance completed for today</p>
              <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                <span>In: <span className="font-medium text-foreground">{formatTime(todayRec.checkIn)}</span></span>
                <span>Out: <span className="font-medium text-foreground">{formatTime(todayRec.checkOut)}</span></span>
                <span>Total: <span className="font-medium text-foreground">{calcWorking(todayRec.checkIn, todayRec.checkOut)}</span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon size={16} className={color} />
              </div>
              <ArrowUpRight size={14} className="text-muted-foreground/40" />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Timeline */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Attendance</h3>
        <div className="flex gap-2">
          {weekDays.map(({ day, status, isToday }) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">{day}</span>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${dayColor(status, isToday)}`}>
                {status ? status.charAt(0) : "—"}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          {[["Present","bg-green-500"],["Absent","bg-red-500"],["Leave","bg-yellow-400"],["Half Day","bg-orange-400"]].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`w-2.5 h-2.5 rounded-full ${c}`} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Pie */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Attendance Today</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={attChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {attChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks Bar */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Task Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={taskChartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {taskChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Bar */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">By Department</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deptChartData} barSize={20}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Tasks */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">My Recent Tasks</h3>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks assigned to you</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map(task => {
                const overdue = task.status !== "Completed" && task.deadline < todayStr;
                return (
                  <div key={task.id} data-testid={`task-row-${task.id}`} className={`flex items-center justify-between p-3 rounded-lg ${overdue ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30" : "bg-muted/40"}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${overdue ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                        {overdue && <AlertCircle size={12} className="inline mr-1" />}{task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">Due {task.deadline}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${statusColor(task.status)}`}>{task.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
