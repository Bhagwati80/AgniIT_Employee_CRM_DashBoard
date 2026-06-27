"use client";
import { useState } from "react";
import { useAppContext, Task, TaskStatus, TaskPriority } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { Plus, Search, AlertCircle, X, ChevronDown, ChevronUp, Paperclip, Download, Trash2, File } from "lucide-react";

const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];
const STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];

const priorityColor = (p: string) => {
  if (p === "High") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (p === "Medium") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
};

const statusColor = (s: string) => {
  if (s === "Completed") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (s === "In Progress") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
};

const emptyForm = {
  title: "", description: "", assignedTo: "", assignedBy: "",
  deadline: "", priority: "Medium" as TaskPriority, status: "Pending" as TaskStatus, attachments: [] as any[]
};

function getDeadlineLabel(deadline: string, status: string) {
  if (status === "Completed") return null;
  const today = new Date().toISOString().split("T")[0];
  if (deadline < today) return "Overdue";
  if (deadline === today) return "Today";
  return "Due";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(type: string) {
  if (type.includes('image')) return '🖼️';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('presentation')) return '🎯';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  if (type.includes('zip') || type.includes('archive')) return '📦';
  return '📎';
}

export default function TasksPage() {
  const { tasks, employees, addTask, updateTask, addTaskAttachment, deleteTaskAttachment } = useAppContext();
  const { currentUser } = useAuthContext();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || t.status === filterStatus;
    const matchPriority = filterPriority === "All" || t.priority === filterPriority;
    const matchMine = !showMyTasks || t.assignedTo === currentUser?.id;
    return matchSearch && matchStatus && matchPriority && matchMine;
  });

  const myTaskCount = tasks.filter(t => t.assignedTo === currentUser?.id).length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    setAttachmentError("");
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setAttachmentError(`File "${file.name}" is too large. Max 5MB allowed.`);
        return false;
      }
      return true;
    });

    setAttachmentFiles(prev => [...prev, ...validFiles]);
  };

  const removeAttachmentFile = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Add task first
      addTask(form);
      
      // Get the newly created task ID (it's the last one)
      const newTaskId = `TSK-${Date.now()}`;
      
      // Add attachments to the task
      for (const file of attachmentFiles) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target?.result as string;
          addTaskAttachment(newTaskId, {
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64Data
          });
        };
        reader.readAsDataURL(file);
      }

      setShowModal(false);
      setForm(emptyForm);
      setAttachmentFiles([]);
      setAttachmentError("");
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, { status: newStatus });
  };

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || id;

  const downloadAttachment = (attachment: any) => {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    link.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tasks.length} total tasks</p>
        </div>
        <button
          data-testid="button-add-task"
          onClick={() => { setForm(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
        >
          <Plus size={15} /> Create Task
        </button>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border w-fit">
        <button
          data-testid="tab-all-tasks"
          onClick={() => setShowMyTasks(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!showMyTasks ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          All Tasks
        </button>
        <button
          data-testid="tab-my-tasks"
          onClick={() => setShowMyTasks(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${showMyTasks ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          My Tasks
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${showMyTasks ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            {myTaskCount}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="input-search-tasks"
            type="search"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          data-testid="select-status-filter"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none text-foreground"
        >
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          data-testid="select-priority-filter"
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none text-foreground"
        >
          <option value="All">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Title", "Assigned To", "Assigned By", "Deadline", "Priority", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    {showMyTasks ? "No tasks assigned to you" : "No tasks found"}
                  </td>
                </tr>
              ) : (
                filtered.map((task) => {
                  const isMyTask = task.assignedTo === currentUser?.id;
                  const isOverdue = task.status !== "Completed" && task.deadline < new Date().toISOString().split("T")[0];
                  const label = getDeadlineLabel(task.deadline, task.status);

                  return (
                    <tr key={task.id} className="border-b border-border hover:bg-muted/20 transition group">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedTask(task)}
                          className="text-left hover:bg-muted/50 px-2 py-1 rounded transition"
                        >
                          <p className={`font-medium group-hover:underline underline-offset-2 flex items-center gap-1.5 ${isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                            {isOverdue && <AlertCircle size={12} className="flex-shrink-0" />}
                            {task.title}
                            {(task.attachments?.length ?? 0) > 0 && (
                              <Paperclip size={12} className="text-muted-foreground flex-shrink-0" />
                            )}
                            <ChevronDown size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px] line-clamp-2 leading-relaxed">{task.description}</p>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{getEmployeeName(task.assignedTo)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getEmployeeName(task.assignedBy)}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-muted-foreground">{task.deadline}</p>
                          {label && (
                            <span className={`text-xs font-medium ${isOverdue ? "text-red-500" : label === "Today" ? "text-orange-500" : "text-blue-500"}`}>
                              {label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isMyTask ? (
                          <select
                            data-testid={`select-status-${task.id}`}
                            value={task.status}
                            onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className="text-xs px-2 py-1 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(task.status)}`}>
                            {task.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Description Modal — with attachments */}
      {expandedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setExpandedTask(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <h2 className="text-base font-semibold text-foreground">{expandedTask.title}</h2>
                <div className="flex gap-2 flex-wrap mt-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColor(expandedTask.priority)}`}>
                    {expandedTask.priority}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(expandedTask.status)}`}>
                    {expandedTask.status}
                  </span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5">
                    {expandedTask.deadline}
                  </span>
                  {(expandedTask.attachments?.length ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground px-2 py-0.5 flex items-center gap-1">
                      <Paperclip size={12} /> {expandedTask.attachments?.length} attachment{(expandedTask.attachments?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setExpandedTask(null)} className="p-1.5 hover:bg-muted rounded text-muted-foreground flex-shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <div className="mb-6 pb-6 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {expandedTask.description || "No description provided for this task."}
              </p>
            </div>

            {/* Attachments */}
            {(expandedTask.attachments?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Paperclip size={14} /> Attachments
                </h3>
                <div className="space-y-2">
                  {expandedTask.attachments?.map(attachment => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">{getFileIcon(attachment.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadAttachment(attachment)}
                        className="p-2 hover:bg-muted rounded transition text-muted-foreground hover:text-foreground flex-shrink-0"
                        title="Download file"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Create Task</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
                <input
                  data-testid="input-task-title"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <textarea
                  data-testid="input-task-description"
                  placeholder="Describe the task in detail — include goals, deliverables, steps, links, or any relevant context..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-y min-h-[120px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Assign To</label>
                  <select
                    data-testid="select-assign-to"
                    required
                    value={form.assignedTo}
                    onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Assigned By
                  </label>

                  <select
                    required
                    value={form.assignedBy}
                    onChange={e => setForm({ ...form, assignedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                  >
                    <option value="">Select Employee</option>

                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Deadline</label>
                  <input
                    data-testid="input-task-deadline"
                    type="date"
                    required
                    value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
                  <select
                    data-testid="select-task-priority"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    data-testid="select-task-status"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Paperclip size={14} /> Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition">
                  <input
                    data-testid="input-file-attachment"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    accept="*/*"
                  />
                  <label htmlFor="file-input" className="cursor-pointer block">
                    <File size={24} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs font-medium text-foreground">Click to attach files or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB per file</p>
                  </label>
                </div>

                {attachmentError && (
                  <div className="mt-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                    {attachmentError}
                  </div>
                )}

                {/* Display selected files */}
                {attachmentFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Selected files:</p>
                    {attachmentFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0">{getFileIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachmentFile(idx)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setAttachmentFiles([]); setAttachmentError(""); }} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition">Cancel</button>
                <button data-testid="button-save-task" type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
