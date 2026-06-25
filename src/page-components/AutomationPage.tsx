"use client";
import { useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { Zap, Bell, Clock, ClipboardList, Calendar, Mail } from "lucide-react";

const AUTOMATIONS = [
  {
    key: "attendanceReminder" as const,
    title: "Attendance Reminder",
    description: "Sends a notification at 9:00 AM if you have not checked in for the day.",
    icon: Bell,
    triggerHour: 9,
    channel: "notification",
  },
  {
    key: "checkOutReminder" as const,
    title: "Check-Out Reminder",
    description: "Reminds you to check out at 6:00 PM if you are still checked in.",
    icon: Clock,
    triggerHour: 18,
    channel: "notification",
  },
  {
    key: "leaveApprovalNotification" as const,
    title: "Leave Approval Notification",
    description: "Automatically approves pending leave requests older than 24 hours.",
    icon: Calendar,
    triggerHour: null,
    channel: "notification",
  },
  {
    key: "dailyTaskSummary" as const,
    title: "Daily Task Summary",
    description: "Sends an email to your registered address every morning at 9:00 AM with a summary of your pending and overdue tasks.",
    icon: Mail,
    triggerHour: 9,
    channel: "email",
  },
];

export default function AutomationPage() {
  const {
    automationSettings, updateAutomationSettings,
    attendanceRecords, leaveRequests, tasks,
    updateLeaveRequestStatus, addNotification
  } = useAppContext();
  const { currentUser } = useAuthContext();
  const ranRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const run = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const todayKey = now.toISOString().split("T")[0];
      const today = todayKey;

      // Attendance Reminder — 9:00 AM → in-app notification
      if (automationSettings.attendanceReminder && hour === 9 && minute === 0) {
        const key = `attReminder-${todayKey}`;
        if (!ranRef.current[key]) {
          const todayRec = attendanceRecords.find(r => r.employeeId === currentUser?.id && r.date === today);
          if (!todayRec) {
            addNotification(
              "Attendance Reminder",
              "You have not checked in yet today. Please mark your attendance."
            );
            ranRef.current[key] = true;
            updateAutomationSettings({ lastRunDates: { ...automationSettings.lastRunDates, attendanceReminder: now.toISOString() } });
          }
        }
      }

      // Check-Out Reminder — 6:00 PM → in-app notification
      if (automationSettings.checkOutReminder && hour === 18 && minute === 0) {
        const key = `checkoutReminder-${todayKey}`;
        if (!ranRef.current[key]) {
          const todayRec = attendanceRecords.find(r => r.employeeId === currentUser?.id && r.date === today);
          if (todayRec?.checkIn && !todayRec?.checkOut) {
            addNotification(
              "Check-Out Reminder",
              "It is 6:00 PM. Please remember to check out before leaving."
            );
            ranRef.current[key] = true;
            updateAutomationSettings({ lastRunDates: { ...automationSettings.lastRunDates, checkOutReminder: now.toISOString() } });
          }
        }
      }

      // Daily Task Summary — 9:00 AM → email via mailto
      if (automationSettings.dailyTaskSummary && hour === 9 && minute === 0) {
        const key = `taskSummary-${todayKey}`;
        if (!ranRef.current[key]) {
          sendTaskSummaryEmail();
          ranRef.current[key] = true;
          updateAutomationSettings({ lastRunDates: { ...automationSettings.lastRunDates, dailyTaskSummary: now.toISOString() } });
        }
      }

      // Leave Auto-Approval → in-app notification
      if (automationSettings.leaveApprovalNotification) {
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        leaveRequests.forEach(req => {
          if (req.status === "Pending" && req.requestedAt < dayAgo) {
            const key = `autoApprove-${req.id}`;
            if (!ranRef.current[key]) {
              updateLeaveRequestStatus(req.id, "Approved");
              ranRef.current[key] = true;
              addNotification(
                "Leave Auto-Approved",
                `A pending ${req.type} leave request has been automatically approved after 24 hours.`
              );
            }
          }
        });
      }
    };

    run();
    const id = setInterval(run, 60000);
    return () => clearInterval(id);
  }, [automationSettings, attendanceRecords, leaveRequests, tasks, currentUser]);

  const sendTaskSummaryEmail = () => {
    if (!currentUser) return;
    const today = new Date().toISOString().split("T")[0];
    const myTasks = tasks.filter(t => t.assignedTo === currentUser.id);
    const pending = myTasks.filter(t => t.status === "Pending");
    const inProgress = myTasks.filter(t => t.status === "In Progress");
    const overdue = myTasks.filter(t => t.status !== "Completed" && t.deadline < today);

    const subject = encodeURIComponent(`AgniIT HRMS — Daily Task Summary for ${today}`);

    const lines = [
      `Hi ${currentUser.name},`,
      ``,
      `Here is your task summary for ${today}:`,
      ``,
      `PENDING TASKS (${pending.length})`,
      ...pending.map(t => `  • ${t.title} — Due: ${t.deadline} [${t.priority}]`),
      ``,
      `IN PROGRESS (${inProgress.length})`,
      ...inProgress.map(t => `  • ${t.title} — Due: ${t.deadline} [${t.priority}]`),
      ``,
      `OVERDUE (${overdue.length})`,
      ...overdue.map(t => `  • ${t.title} — Was due: ${t.deadline} [${t.priority}]`),
      ``,
      `Log in to AgniIT HRMS to update your tasks.`,
      ``,
      `— AgniIT HRMS`,
    ];

    const body = encodeURIComponent(lines.join("\n"));
    window.open(`mailto:${currentUser.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const toggle = (key: keyof typeof automationSettings) => {
    if (key === "lastRunDates") return;
    updateAutomationSettings({ [key]: !automationSettings[key] });
  };

  const getLastRun = (key: string) => {
    const val = automationSettings.lastRunDates?.[key];
    if (!val) return "Never triggered";
    return `Last triggered: ${new Date(val).toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Automation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure automated workflows and reminders</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl px-5 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
        <Zap size={15} />
        Automations run while the app is open. Notifications appear in the bell icon; task summary is sent to your registered email.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AUTOMATIONS.map(({ key, title, description, icon: Icon, triggerHour, channel }) => {
          const enabled = !!automationSettings[key];
          return (
            <div
              key={key}
              data-testid={`automation-card-${key}`}
              className={`bg-card border rounded-xl p-5 shadow-sm transition-all ${enabled ? "border-primary/30 shadow-primary/5" : "border-border"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2.5 rounded-xl ${enabled ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon size={18} className={enabled ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${channel === "email" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-muted text-muted-foreground"}`}>
                        {channel === "email" ? "✉ EMAIL" : "🔔 IN-APP"}
                      </span>
                    </div>
                    {triggerHour !== null && (
                      <p className="text-xs text-primary font-medium mt-0.5">
                        Triggers at {triggerHour < 12 ? `${triggerHour}:00 AM` : `${triggerHour - 12}:00 PM`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">{getLastRun(key)}</p>
                  </div>
                </div>
                <button
                  data-testid={`toggle-${key}`}
                  onClick={() => toggle(key)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none mt-0.5 ${enabled ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test buttons */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Test Notifications</h3>
          <p className="text-xs text-muted-foreground mb-3">Verify your in-app notification system is working.</p>
          <button
            data-testid="button-test-notification"
            onClick={() => addNotification("Test Notification", "This is a test notification from the Automation page. Your notification system is working correctly.")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            <Bell size={14} /> Send Test Notification
          </button>
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Test Task Summary Email</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Opens your email client with a pre-filled task summary addressed to <span className="font-medium text-foreground">{currentUser?.email}</span>.
          </p>
          <button
            data-testid="button-test-email"
            onClick={sendTaskSummaryEmail}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground text-sm font-semibold rounded-lg hover:bg-muted transition"
          >
            <Mail size={14} /> Send Test Email
          </button>
        </div>
      </div>
    </div>
  );
}
