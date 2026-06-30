"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Employee = {
  id: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  position: string;
  phone: string;
  joiningDate: string;
  photo?: string;
};

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Half Day';

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  workingHours: number | null;
};

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoded file data
  uploadedAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assinedBy: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  attachments?: TaskAttachment[];
};

export type LeaveType = 'Casual' | 'Sick' | 'Annual' | 'Emergency';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
};

export type AutomationSettings = {
  attendanceReminder: boolean;
  checkOutReminder: boolean;
  leaveApprovalNotification: boolean;
  dailyTaskSummary: boolean;
  lastRunDates: Record<string, string>;
};

export type AppSettings = {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  theme: 'light' | 'dark' | 'system';
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

interface AppContextType {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  tasks: Task[];
  leaveRequests: LeaveRequest[];
  automationSettings: AutomationSettings;
  appSettings: AppSettings;
  notifications: AppNotification[];

  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, record: Partial<AttendanceRecord>) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addTaskAttachment: (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => void;
  deleteTaskAttachment: (taskId: string, attachmentId: string) => void;

  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>) => void;
  updateLeaveRequestStatus: (id: string, status: LeaveStatus) => void;

  updateAutomationSettings: (settings: Partial<AutomationSettings>) => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;

  addNotification: (title: string, message: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
}

const defaultEmployees: Employee[] = [
  { id: "EMP001", name: "Arjun Sharma", email: "su-24032@sitare.org", password: "Admin@123", department: "Development", position: "Senior Developer", phone: "+91-9876543210", joiningDate: "2022-01-15" },
  { id: "EMP002", name: "Priya Patel", email: "priya@agniit.com", password: "Priya@123", department: "HR", position: "HR Manager", phone: "+91-9876543211", joiningDate: "2021-06-01" },
  { id: "EMP003", name: "Rahul Verma", email: "rahul@agniit.com", password: "Rahul@123", department: "Marketing", position: "Marketing Lead", phone: "+91-9876543212", joiningDate: "2023-03-10" },
  { id: "EMP004", name: "Sneha Gupta", email: "sneha@agniit.com", password: "Sneha@123", department: "Finance", position: "Finance Analyst", phone: "+91-9876543213", joiningDate: "2022-09-20" },
  { id: "EMP005", name: "Vikram Singh", email: "vikram@agniit.com", password: "Vikram@123", department: "Operations", position: "Operations Manager", phone: "+91-9876543214", joiningDate: "2021-11-05" }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialData = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }
  return defaultValue;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => getInitialData('employees', defaultEmployees));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => getInitialData('attendanceRecords', []));
  const [tasks, setTasks] = useState<Task[]>(() => getInitialData('tasks', []));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => getInitialData('leaveRequests', []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getInitialData('notifications', []));
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(() => getInitialData('automationSettings', {
    attendanceReminder: false,
    checkOutReminder: false,
    leaveApprovalNotification: false,
    dailyTaskSummary: false,
    lastRunDates: {}
  }));
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getInitialData('appSettings', {
    companyName: "AgniIT",
    companyEmail: "contact@agniit.com",
    companyPhone: "+91-1800123456",
    theme: 'light'
  }));

  // Seed initial data if empty
  useEffect(() => {
    if (employees.length === 0) {
      setEmployees(defaultEmployees);
    }

    if (attendanceRecords.length === 0) {
      const today = new Date();
      const records: AttendanceRecord[] = [];
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        defaultEmployees.forEach(emp => {
          const statusRand = Math.random();
          let status: AttendanceStatus = 'Present';
          let checkIn: string | null = '09:00';
          let checkOut: string | null = '18:00';
          let workingHours: number | null = 9;
          if (statusRand > 0.9) { status = 'Absent'; checkIn = null; checkOut = null; workingHours = null; }
          else if (statusRand > 0.8) { status = 'Leave'; checkIn = null; checkOut = null; workingHours = null; }
          else if (statusRand > 0.7) { status = 'Half Day'; checkIn = '09:00'; checkOut = '13:00'; workingHours = 4; }
          records.push({ id: `ATT-${Date.now()}-${Math.random()}`, employeeId: emp.id, date: dateStr, checkIn, checkOut, status, workingHours });
        });
      }
      setAttendanceRecords(records);
    }

    if (tasks.length === 0) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setTasks([
        { id: "TSK-001", title: "Complete Q3 Report", description: "Compile all financial data for Q3 and prepare executive summary with charts and projections for the board meeting.", assignedTo: "EMP004", deadline: nextWeek.toISOString().split('T')[0], priority: "High", status: "Pending", createdAt: today.toISOString(), attachments: [] },
        { id: "TSK-002", title: "Update Homepage", description: "Implement the new design system on the landing page. Ensure mobile responsiveness and cross-browser compatibility.", assignedTo: "EMP001", deadline: yesterday.toISOString().split('T')[0], priority: "High", status: "In Progress", createdAt: yesterday.toISOString(), attachments: [] },
        { id: "TSK-003", title: "Review Candidates", description: "Review resumes for the senior developer position. Shortlist top 5 candidates and schedule technical interviews.", assignedTo: "EMP002", deadline: today.toISOString().split('T')[0], priority: "Medium", status: "Pending", createdAt: yesterday.toISOString(), attachments: [] },
      ]);
    }
  }, []);

  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { localStorage.setItem('tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests)); }, [leaveRequests]);
  useEffect(() => { localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('automationSettings', JSON.stringify(automationSettings)); }, [automationSettings]);
  useEffect(() => { localStorage.setItem('appSettings', JSON.stringify(appSettings)); }, [appSettings]);

  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newId = `EMP${(employees.length + 1).toString().padStart(3, '0')}`;
    setEmployees(prev => [...prev, { ...emp, id: newId }]);
  };
  const updateEmployee = (id: string, emp: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...emp } : e));
  };
  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id'>) => {
    setAttendanceRecords(prev => [...prev, { ...record, id: `ATT-${Date.now()}` }]);
  };
  const updateAttendanceRecord = (id: string, record: Partial<AttendanceRecord>) => {
    setAttendanceRecords(prev => prev.map(r => r.id === id ? { ...r, ...record } : r));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [...prev, { ...task, id: `TSK-${Date.now()}`, createdAt: new Date().toISOString(), attachments: task.attachments || [] }]);
  };
  const updateTask = (id: string, task: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...task } : t));
  };
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTaskAttachment = (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newAttachment: TaskAttachment = {
          ...attachment,
          id: `ATT-${Date.now()}`,
          uploadedAt: new Date().toISOString()
        };
        return {
          ...t,
          attachments: [...(t.attachments || []), newAttachment]
        };
      }
      return t;
    }));
  };

  const deleteTaskAttachment = (taskId: string, attachmentId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          attachments: (t.attachments || []).filter(a => a.id !== attachmentId)
        };
      }
      return t;
    }));
  };

  const addLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>) => {
    setLeaveRequests(prev => [...prev, { ...request, id: `LV-${Date.now()}`, requestedAt: new Date().toISOString(), status: 'Pending' }]);
  };
  const updateLeaveRequestStatus = (id: string, status: LeaveStatus) => {
    setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const addNotification = (title: string, message: string) => {
    setNotifications(prev => [
      { id: `NOTIF-${Date.now()}`, title, message, read: false, createdAt: new Date().toISOString() },
      ...prev
    ].slice(0, 50));
  };
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateAutomationSettings = (settings: Partial<AutomationSettings>) => {
    setAutomationSettings(prev => ({ ...prev, ...settings }));
  };
  const updateAppSettings = (settings: Partial<AppSettings>) => {
    setAppSettings(prev => ({ ...prev, ...settings }));
  };

  return (
    <AppContext.Provider value={{
      employees, attendanceRecords, tasks, leaveRequests, automationSettings, appSettings, notifications,
      addEmployee, updateEmployee, deleteEmployee,
      addAttendanceRecord, updateAttendanceRecord,
      addTask, updateTask, deleteTask, addTaskAttachment, deleteTaskAttachment,
      addLeaveRequest, updateLeaveRequestStatus,
      updateAutomationSettings, updateAppSettings,
      addNotification, markAllNotificationsRead, clearNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
