"use client";
import { useState } from "react";
import { useAppContext, Employee } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { Search, Plus, Edit2, Trash2, X } from "lucide-react";

const DEPARTMENTS = ["Development", "HR", "Marketing", "Finance", "Operations"];

const emptyForm = { name: "", email: "", password: "", phone: "", department: "Development", position: "", joiningDate: "" };

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useAppContext();
  const { currentUser } = useAuthContext();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ ...emptyForm, ...emp });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateEmployee(editing.id, form);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{employees.length} total employees</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="input-search-employees"
            type="search"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          data-testid="select-department-filter"
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        >
          <option value="All">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["ID", "Name", "Email", "Phone", "Department", "Position", "Joining Date", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No employees found</td></tr>
              ) : filtered.map((emp, i) => {
                const isOwnRow = emp.id === currentUser?.id;
                return (
                  <tr
                    key={emp.id}
                    data-testid={`employee-row-${emp.id}`}
                    className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"} ${isOwnRow ? "ring-1 ring-inset ring-primary/20" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{emp.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-xs font-semibold">{emp.name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-foreground">{emp.name}</span>
                          {isOwnRow && <span className="ml-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">You</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.phone}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">{emp.department}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.position}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.joiningDate}</td>
                    <td className="px-4 py-3">
                      {isOwnRow ? (
                        <div className="flex items-center gap-1">
                          <button
                            data-testid={`button-edit-${emp.id}`}
                            onClick={() => openEdit(emp)}
                            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit your profile"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Own Profile Modal */}
      {showModal && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Edit Your Profile</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Phone", key: "phone", type: "text" },
                ].map(({ label, key, type }) => (
                  <div key={key} className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                    <input
                      data-testid={`input-${key}`}
                      type={type}
                      value={(form as any)[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-sm text-muted-foreground"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Department</label>
                  <input value={form.department} disabled className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-sm text-muted-foreground" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Position</label>
                  <input value={form.position} disabled className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-sm text-muted-foreground" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition">Cancel</button>
                <button data-testid="button-save-employee" type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
