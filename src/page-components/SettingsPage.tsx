"use client";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Save, Building2, Bell, Palette, User } from "lucide-react";

export default function SettingsPage() {
  const { appSettings, automationSettings, updateAppSettings, updateAutomationSettings, updateEmployee } = useAppContext();
  const { currentUser } = useAuthContext();
  const { toast } = useToast();

  const [companyForm, setCompanyForm] = useState({
    companyName: appSettings.companyName,
    companyEmail: appSettings.companyEmail,
    companyPhone: appSettings.companyPhone,
  });

  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
  });

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  const saveCompany = () => {
    updateAppSettings(companyForm);
    toast({ title: "Company settings saved" });
  };

  const saveProfile = () => {
    if (currentUser) {
      updateEmployee(currentUser.id, { name: profileForm.name, phone: profileForm.phone });
      localStorage.setItem("currentUser", JSON.stringify({ ...currentUser, ...profileForm }));
    }
    toast({ title: "Profile updated successfully" });
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    updateAppSettings({ theme: next ? "dark" : "light" });
  };

  const toggleNotification = (key: "attendanceReminder" | "checkOutReminder" | "leaveApprovalNotification") => {
    updateAutomationSettings({ [key]: !automationSettings[key] });
    toast({ title: "Notification preference updated" });
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
        <Icon size={17} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InputField = ({ label, type = "text", value, onChange, testId }: { label: string; type?: string; value: string; onChange: (v: string) => void; testId: string }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
      />
    </div>
  );

  const Toggle = ({ label, description, checked, onChange, testId }: { label: string; description: string; checked: boolean; onChange: () => void; testId: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        data-testid={testId}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your preferences and company settings</p>
      </div>

      {/* Company Settings */}
      <Section title="Company Settings" icon={Building2}>
        <div className="space-y-4">
          <InputField label="Company Name" value={companyForm.companyName} onChange={v => setCompanyForm({ ...companyForm, companyName: v })} testId="input-company-name" />
          <InputField label="Company Email" type="email" value={companyForm.companyEmail} onChange={v => setCompanyForm({ ...companyForm, companyEmail: v })} testId="input-company-email" />
          <InputField label="Company Phone" value={companyForm.companyPhone} onChange={v => setCompanyForm({ ...companyForm, companyPhone: v })} testId="input-company-phone" />
          <button
            data-testid="button-save-company"
            onClick={saveCompany}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            <Save size={14} /> Save Company Settings
          </button>
        </div>
      </Section>

      {/* Notification Settings */}
      <Section title="Notification Settings" icon={Bell}>
        <div>
          <Toggle
            label="Attendance Reminder"
            description="Get reminded at 9:00 AM if you haven't checked in"
            checked={automationSettings.attendanceReminder}
            onChange={() => toggleNotification("attendanceReminder")}
            testId="toggle-attendance-notification"
          />
          <Toggle
            label="Check-Out Reminder"
            description="Get reminded at 6:00 PM to check out"
            checked={automationSettings.checkOutReminder}
            onChange={() => toggleNotification("checkOutReminder")}
            testId="toggle-checkout-notification"
          />
          <Toggle
            label="Leave Notifications"
            description="Auto-approve pending leave requests after 24 hours"
            checked={automationSettings.leaveApprovalNotification}
            onChange={() => toggleNotification("leaveApprovalNotification")}
            testId="toggle-leave-notification"
          />
        </div>
      </Section>

      {/* Theme Settings */}
      <Section title="Theme Settings" icon={Palette}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark appearance</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{isDark ? "Dark" : "Light"}</span>
            <button
              data-testid="toggle-dark-mode"
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${isDark ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </Section>

      {/* Profile Settings */}
      <Section title="Profile Settings" icon={User}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-base font-bold">{currentUser?.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.email} · {currentUser?.id}</p>
            </div>
          </div>
          <InputField label="Full Name" value={profileForm.name} onChange={v => setProfileForm({ ...profileForm, name: v })} testId="input-profile-name" />
          <InputField label="Phone Number" value={profileForm.phone} onChange={v => setProfileForm({ ...profileForm, phone: v })} testId="input-profile-phone" />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
            <input value={currentUser?.department || ""} disabled className="w-full px-3.5 py-2.5 bg-muted border border-input rounded-lg text-sm text-muted-foreground" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Position</label>
            <input value={currentUser?.position || ""} disabled className="w-full px-3.5 py-2.5 bg-muted border border-input rounded-lg text-sm text-muted-foreground" />
          </div>
          <button
            data-testid="button-save-profile"
            onClick={saveProfile}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            <Save size={14} /> Save Profile
          </button>
        </div>
      </Section>
    </div>
  );
}
