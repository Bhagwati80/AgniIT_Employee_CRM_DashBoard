"use client";
import { Sun, Moon, Bell, X, Check, Trash2, User, Phone, Building2, Camera, LogOut } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState, useRef } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header() {
  const { currentUser, logout } = useAuthContext();
  const { notifications, markAllNotificationsRead, clearNotifications, employees, updateEmployee } = useAppContext();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [now, setNow] = useState(new Date());

  // Panels
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Profile edit state
  const [profileForm, setProfileForm] = useState({ name: currentUser?.name || "", phone: currentUser?.phone || "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const liveEmployee = employees.find(e => e.id === currentUser?.id);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  // Close panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync profile form when currentUser changes
  useEffect(() => {
    if (currentUser) setProfileForm({ name: currentUser.name, phone: currentUser.phone });
  }, [currentUser]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const openNotif = () => {
    setShowNotif(v => !v);
    setShowProfile(false);
  };

  const openProfile = () => {
    setShowProfile(v => !v);
    setShowNotif(false);
    setProfileSaved(false);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleProfileSave = () => {
    if (!currentUser) return;
    updateEmployee(currentUser.id, { name: profileForm.name, phone: profileForm.phone });
    // Update session storage so greeting reflects new name immediately
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        localStorage.setItem("currentUser", JSON.stringify({ ...parsed, name: profileForm.name, phone: profileForm.phone }));
      } catch {}
    }
    setProfileSaved(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateEmployee(currentUser.id, { photo: dataUrl });
      // Update session too
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem("currentUser", JSON.stringify({ ...parsed, photo: dataUrl }));
        } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <header
      data-testid="app-header"
      className="h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 relative z-30"
    >
      {/* Left */}
      <div>
        <p className="text-sm font-semibold text-foreground">
          {getGreeting()}{liveEmployee ? `, ${liveEmployee.name.split(" ")[0]}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(now)}</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          data-testid="theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            data-testid="notification-bell"
            onClick={openNotif}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border border-background" />
            )}
          </button>

          {/* Notification Panel */}
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-destructive text-white px-1.5 py-0.5 rounded-full font-semibold">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <>
                      <button
                        data-testid="button-mark-all-read"
                        onClick={handleMarkAllRead}
                        title="Mark all as read"
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        data-testid="button-clear-notifications"
                        onClick={clearNotifications}
                        title="Clear all"
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    data-testid={`notification-item-${n.id}`}
                    className={`px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${n.read ? "opacity-60" : "bg-primary/5"}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                      <div className={!n.read ? "" : "pl-3.5"}>
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div ref={profileRef} className="relative ml-2 pl-2 border-l border-border">
          <button
            data-testid="button-profile"
            onClick={openProfile}
            className="flex items-center gap-2 hover:bg-accent rounded-lg px-2 py-1.5 transition-colors"
          >
            {liveEmployee?.photo ? (
              <img src={liveEmployee.photo} alt={liveEmployee.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-sm font-semibold">
                  {(liveEmployee?.name || currentUser?.name || "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-tight">{liveEmployee?.name || currentUser?.name}</p>
              <p className="text-xs text-muted-foreground leading-tight">{currentUser?.department}</p>
            </div>
          </button>

          {/* Profile Dropdown Panel */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              {/* Avatar section */}
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 px-6 py-5 text-center border-b border-border">
                <div className="relative inline-block">
                  {liveEmployee?.photo ? (
                    <img src={liveEmployee.photo} alt={liveEmployee.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 mx-auto" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto border-2 border-primary/30">
                      <span className="text-primary text-2xl font-bold">
                        {(liveEmployee?.name || currentUser?.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    data-testid="button-upload-photo"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                    title="Upload photo"
                  >
                    <Camera size={11} className="text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <p className="text-sm font-bold text-foreground mt-2">{liveEmployee?.name || currentUser?.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.position} · {currentUser?.department}</p>
                <p className="text-xs font-mono text-muted-foreground/60 mt-0.5">{currentUser?.id}</p>
              </div>

              {/* Edit fields */}
              <div className="px-4 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      data-testid="input-profile-name-header"
                      type="text"
                      value={profileForm.name}
                      onChange={e => { setProfileForm({ ...profileForm, name: e.target.value }); setProfileSaved(false); }}
                      className="w-full pl-8 pr-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      data-testid="input-profile-phone-header"
                      type="text"
                      value={profileForm.phone}
                      onChange={e => { setProfileForm({ ...profileForm, phone: e.target.value }); setProfileSaved(false); }}
                      className="w-full pl-8 pr-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <div className="relative">
                    <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={currentUser?.email || ""}
                      disabled
                      className="w-full pl-8 pr-3 py-2 bg-muted border border-input rounded-lg text-sm text-muted-foreground"
                    />
                  </div>
                </div>

                <button
                  data-testid="button-save-profile-header"
                  onClick={handleProfileSave}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${profileSaved ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                >
                  {profileSaved ? "Saved!" : "Save Changes"}
                </button>
              </div>

              {/* Logout */}
              <div className="px-4 pb-3">
                <button
                  data-testid="button-logout-header"
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors border border-destructive/20"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
