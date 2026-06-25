"use client";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid
} from "recharts";

const TABS = ["Attendance", "Tasks", "Departments", "Leave", "Productivity"];

export default function ReportsPage() {
  const { employees, attendanceRecords, tasks, leaveRequests } = useAppContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Attendance");

  const today = new Date().toISOString().split("T")[0];

  // Attendance data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const records = attendanceRecords.filter(r => r.date === ds);
    return {
      date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      Present: records.filter(r => r.status === "Present").length,
      Absent: records.filter(r => r.status === "Absent").length,
      Leave: records.filter(r => r.status === "Leave").length,
    };
  }).reverse();

  // Task data
  const taskData = [
    { name: "Pending", value: tasks.filter(t => t.status === "Pending").length, fill: "#eab308" },
    { name: "In Progress", value: tasks.filter(t => t.status === "In Progress").length, fill: "#3b82f6" },
    { name: "Completed", value: tasks.filter(t => t.status === "Completed").length, fill: "#22c55e" },
    { name: "Overdue", value: tasks.filter(t => t.status !== "Completed" && t.deadline < today).length, fill: "#ef4444" },
  ];

  // Dept data
  const deptAttendance = employees.map(emp => {
    const records = attendanceRecords.filter(r => r.employeeId === emp.id);
    const present = records.filter(r => r.status === "Present").length;
    const rate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
    return { name: emp.department, rate, employee: emp.name };
  });

  const deptSummary = deptAttendance.reduce((acc: Record<string, { total: number; count: number }>, item) => {
    if (!acc[item.name]) acc[item.name] = { total: 0, count: 0 };
    acc[item.name].total += item.rate;
    acc[item.name].count += 1;
    return acc;
  }, {});
  const deptChartData = Object.entries(deptSummary).map(([name, d]) => ({
    name, rate: Math.round(d.total / d.count), headcount: employees.filter(e => e.department === name).length
  }));

  // Leave data
  const leaveData = ["Casual", "Sick", "Annual", "Emergency"].map(type => ({
    name: type,
    Pending: leaveRequests.filter(l => l.type === type && l.status === "Pending").length,
    Approved: leaveRequests.filter(l => l.type === type && l.status === "Approved").length,
    Rejected: leaveRequests.filter(l => l.type === type && l.status === "Rejected").length,
  }));

  // Productivity
  const productivityData = employees.map(emp => {
    const empTasks = tasks.filter(t => t.assignedTo === emp.id);
    const completed = empTasks.filter(t => t.status === "Completed").length;
    const score = empTasks.length > 0 ? Math.round((completed / empTasks.length) * 100) : 0;
    return { name: emp.name.split(" ")[0], score, total: empTasks.length };
  });

  // Insights
  const bestDeptRate = deptChartData.sort((a, b) => b.rate - a.rate)[0];
  const bestEmployee = productivityData.sort((a, b) => b.score - a.score)[0];

  const handleExport = (type: string) => {
    toast({ title: `Export initiated`, description: `${type} export has been initiated. File will be ready shortly.` });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="button-export-pdf"
            onClick={() => handleExport("PDF")}
            className="flex items-center gap-2 px-4 py-2.5 border border-border bg-card text-foreground text-sm font-medium rounded-lg hover:bg-muted transition"
          >
            <Download size={14} /> Export PDF
          </button>
          <button
            data-testid="button-export-excel"
            onClick={() => handleExport("Excel")}
            className="flex items-center gap-2 px-4 py-2.5 border border-border bg-card text-foreground text-sm font-medium rounded-lg hover:bg-muted transition"
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Best Performing Department", value: bestDeptRate?.name || "—", sub: `${bestDeptRate?.rate || 0}% attendance rate` },
          { label: "Highest Attendance Dept", value: bestDeptRate?.name || "—", sub: `${bestDeptRate?.headcount || 0} employees` },
          { label: "Most Productive Employee", value: bestEmployee?.name || "—", sub: `${bestEmployee?.score || 0}% task completion` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            data-testid={`tab-${tab.toLowerCase()}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        {activeTab === "Attendance" && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Last 7 Days Attendance</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={last7Days} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Present" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Absent" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Leave" fill="#eab308" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === "Tasks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Task Status Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={taskData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {taskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Task Counts</h3>
              <div className="space-y-3 mt-6">
                {taskData.map(({ name, value, fill }) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-semibold text-foreground">{value}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${tasks.length > 0 ? (value / tasks.length) * 100 : 0}%`, backgroundColor: fill }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "Departments" && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Department Attendance Rate</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptChartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="rate" name="Attendance %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === "Leave" && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Leave Requests by Type</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leaveData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Pending" fill="#eab308" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Approved" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Rejected" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === "Productivity" && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Employee Task Completion Rate</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={productivityData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" name="Completion %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
