"use client";
import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthContext();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const success = login(email, password);
    setLoading(false);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Please try again.");
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    
    // For demo purposes, we'll show a success message
    // In a real app, you'd send this to a backend
    setError("");
    setLoading(false);
    setError("Account creation successful! Please use your email and password to sign in.");
    setTimeout(() => {
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setError("");
    }, 2000);
  };

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <img src="/agniit-logo.webp" alt="AgniIT" className="w-20 h-20 rounded-full object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">AgniIT</h1>
          <p className="text-sm text-muted-foreground mt-1">Employee Management Portal</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          

          {isSignUp ? (
            // Sign Up Form
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Create your account</h2>
              <p className="text-sm text-muted-foreground mb-6">Join AgniIT and manage your tasks efficiently</p>

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    data-testid="input-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1.5">
                    Email address
                  </label>
                  <input
                    id="signup-email"
                    data-testid="input-signup-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@agniit.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      data-testid="input-signup-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition pr-10"
                    />
                    <button
                      type="button"
                      data-testid="toggle-signup-password-visibility"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      data-testid="input-confirm-password"
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your password"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition pr-10"
                    />
                    <button
                      type="button"
                      data-testid="toggle-confirm-password-visibility"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div data-testid="signup-error" className={`text-sm border rounded-lg px-3 py-2 ${
                    error.includes("successful") 
                      ? "text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                      : "text-destructive bg-destructive/10 border-destructive/20"
                  }`}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  data-testid="button-signup"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus size={15} />
                  )}
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleToggle}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign In
                </button>
              </p>
            </>
          ) : (
            // Sign In Form
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Sign in to your account</h2>
              <p className="text-sm text-muted-foreground mb-6">Enter your credentials to continue</p>

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@agniit.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      data-testid="input-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition pr-10"
                    />
                    <button
                      type="button"
                      data-testid="toggle-password-visibility"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div data-testid="login-error" className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  data-testid="button-login"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn size={15} />
                  )}
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Demo Credentials</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-mono text-foreground">su-24032@sitare.org</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="font-mono text-foreground">Admin@123</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={handleToggle}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign Up
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
