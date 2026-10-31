import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Smartphone,
  SmartphoneNfc,
  Send,
  WifiOff,
  Download,
  RefreshCw,
  HardHat,
  UserCheck,
  QrCode,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Primary Auth Tab: "email" (Corporate / Enterprise) | "mobile" (Site Execution PWA)
  const [authMethod, setAuthMethod] = useState<"email" | "mobile">("email");

  // Mode state for secondary challenges: "standard" | "forgot" | "2fa"
  const [mode, setMode] = useState<"standard" | "forgot" | "2fa">("standard");

  // General Loading State
  const [isLoading, setIsLoading] = useState(false);

  // Email / Password Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Mobile PWA Form State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [mobileUserData, setMobileUserData] = useState<{
    userName?: string;
    userRole?: string;
  } | null>(null);

  // PWA & Network State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Phone QR Code Dialog
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";

  // 2FA state for Corporate Email logins
  const [twoFactorData, setTwoFactorData] = useState<{ tempToken: string; email: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState<{
    success: boolean;
    message: string;
    resetUrl?: string;
    token?: string;
    email?: string;
  } | null>(null);

  // -------------------------------------------------------------
  // PWA Install & Network Listeners
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsStandalone(true);
      }

      const promptHandler = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
      };
      window.addEventListener("beforeinstallprompt", promptHandler);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("beforeinstallprompt", promptHandler);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsStandalone(true);
      setInstallPrompt(null);
      toast({
        title: "PWA Installed",
        description: "Kanak Turnkey is now installed on your device.",
      });
    }
  };

  // -------------------------------------------------------------
  // Mobile PWA Auth Handlers (Site Staff)
  // -------------------------------------------------------------
  const handleSendMobileOtp = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit registered mobile number.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mobile/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server response error (${response.status})` };
      }

      if (!response.ok) {
        const errorText = data.details
          ? `${data.error}: ${data.details}`
          : (data.error || "Failed to send mobile OTP");
        throw new Error(errorText);
      }

      setOtpSent(true);
      setPhone(data.phone || cleanPhone);
      setOtp("");
      setOtpCountdown(45);
      setMobileUserData({
        userName: data.userName,
        userRole: data.userRole,
      });

      toast({
        title: "Verification Code Sent",
        description: `A 6-digit OTP has been sent to +91 ${data.phone || cleanPhone}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "OTP Delivery Failed",
        description: err.message || "Please check your mobile number and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otp.trim();
    if (!phone || cleanCode.length < 6) {
      toast({
        variant: "destructive",
        title: "Incomplete Code",
        description: "Please enter the complete 6-digit verification code.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mobile/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), otp: cleanCode }),
        credentials: "include",
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server response error (${response.status})` };
      }

      if (!response.ok) {
        throw new Error(data.error || "Invalid or expired OTP code.");
      }

      await queryClient.invalidateQueries();

      toast({
        title: "Authentication Successful",
        description: `Welcome back, ${data.name}!`,
      });

      setLocation("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.message || "Invalid or expired OTP code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Demo Accounts for Quick One-Click Sign In (Site Engineer, PM, Admin)
  const DEMO_USERS = [
    { name: "Priya Iyer", role: "Site Engineer", email: "priya.iyer@kanak.in", phone: "9876543213", badge: "Site Execution" },
    { name: "Rohan Mehta", role: "Project Manager", email: "rohan.mehta@kanak.in", phone: "9876543212", badge: "Operations" },
    { name: "Ananya Rao", role: "Admin", email: "ananya.rao@kanak.in", phone: "9876543210", badge: "Executive" },
    { name: "Harinarayana", role: "Director / Admin", email: "Hari.mailapalli12@gmail.com", phone: "9876543211", badge: "Management" },
  ];

  const handleQuickMobileLogin = async (targetPhone: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mobile/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone }),
        credentials: "include",
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server response error (${response.status})` };
      }

      if (response.ok) {
        await queryClient.invalidateQueries();
        toast({
          title: "Authentication Successful",
          description: `Welcome back, ${data.name}!`,
        });
        setLocation("/");
        return;
      }

      // Fallback: verify-otp with demo master OTP 123456
      const fallbackRes = await fetch("/api/auth/mobile/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone, otp: "123456" }),
        credentials: "include",
      });

      const fallbackData = await fallbackRes.json();
      if (!fallbackRes.ok) {
        throw new Error(fallbackData.error || data.error || "Failed to log in.");
      }

      await queryClient.invalidateQueries();
      toast({
        title: "Authentication Successful",
        description: `Welcome back, ${fallbackData.name}!`,
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || "Could not log in with mobile credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performEmailLogin = async (cleanEmail: string, cleanPassword: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        credentials: "include",
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server response error (${response.status})` };
      }

      if (!response.ok) {
        const errorText = data.details
          ? `${data.error}: ${data.details}`
          : (data.error || "Invalid email or password");
        throw new Error(errorText);
      }

      if (data.requires2FA) {
        setTwoFactorData({ tempToken: data.tempToken, email: data.email });
        setTwoFactorCode("");
        setMode("2fa");
        toast({
          title: "Two-Factor Verification Required",
          description: "Please enter the 6-digit code from your authenticator app.",
        });
        return;
      }

      await queryClient.invalidateQueries();

      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.name}!`,
      });

      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Standard Corporate Email & Password Auth Handlers
  // -------------------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast({
        variant: "destructive",
        title: "Missing Credentials",
        description: "Please enter both your email address and password.",
      });
      return;
    }

    await performEmailLogin(cleanEmail, cleanPassword);
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorData || !twoFactorCode.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: twoFactorData.tempToken,
          code: twoFactorCode.trim(),
        }),
        credentials: "include",
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server response error (${response.status})` };
      }

      if (!response.ok) {
        throw new Error(data.error || "Invalid two-factor code");
      }

      await queryClient.invalidateQueries();

      toast({
        title: "Identity Verified",
        description: "Two-factor authentication successful.",
      });

      setLocation("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.message || "The code entered is invalid or has expired.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your registered email address.",
      });
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setForgotResult(data);
      toast({
        title: "Request Received",
        description: data.message || "Password recovery instructions have been processed.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: err.message || "Failed to send password reset instructions.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-3 sm:p-4 text-foreground selection:bg-primary selection:text-white">
      <Card className="w-full max-w-md shadow-2xl border-border/40 backdrop-blur-md bg-card/95 overflow-hidden rounded-2xl">
        {/* PWA App Mode & Network Alerts */}
        <div className="px-5 pt-4 pb-0 space-y-2">
          {!isOnline && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Offline Mode Active. Cached local storage is enabled.</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {isStandalone ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Mobile PWA Mode
              </div>
            ) : installPrompt ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleInstallPwa}
                className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/20"
              >
                <Download className="w-3 h-3" /> Install App
              </Button>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary">
                ⚡ Mobile PWA Ready
              </Badge>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQrModalOpen(true)}
              className="h-7 text-[11px] gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Scan for Phone</span>
            </Button>
          </div>
        </div>

        {/* Brand Card Header */}
        <CardHeader className="space-y-1 text-center pt-3 pb-3">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg ring-4 ring-primary/20">
                K
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow">
                <HardHat className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>

          <CardTitle className="text-xl font-bold tracking-tight">
            {mode === "forgot"
              ? "Reset Password"
              : mode === "2fa"
              ? "Two-Factor Verification"
              : "Kanak Turnkey"}
          </CardTitle>
          <CardDescription className="text-xs">
            {mode === "forgot"
              ? "Enter your corporate email to receive recovery instructions"
              : mode === "2fa"
              ? `Verification code sent to ${twoFactorData?.email}`
              : "Enterprise Construction Management & Site Execution Platform"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-5 pb-6">
          {/* ======================================================== */}
          {/* MODE: TWO-FACTOR AUTHENTICATION CHALLENGE */}
          {/* ======================================================== */}
          {mode === "2fa" && (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground">Two-Factor Authentication is Active</p>
                  <p className="text-muted-foreground">
                    {useBackupCode
                      ? "Enter one of your 8-character recovery backup codes to gain access."
                      : "Open your authenticator app and enter your current 6-digit security code."}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="twoFactorCode" className="text-xs">
                  {useBackupCode ? "Recovery Backup Code" : "6-Digit Authenticator Code"}
                </Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  inputMode={useBackupCode ? "text" : "numeric"}
                  placeholder={useBackupCode ? "e.g. ABCD-1234" : "123456"}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  disabled={isLoading}
                  className="text-center font-mono text-lg tracking-widest h-11 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode("");
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {useBackupCode ? "← Use 6-digit Authenticator code" : "Lost access? Use backup recovery code"}
                </button>
              </div>

              <Button type="submit" className="w-full h-10 gap-2 shadow-md rounded-xl font-bold text-xs" disabled={isLoading || !twoFactorCode.trim()}>
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode("standard");
                  setTwoFactorData(null);
                  setTwoFactorCode("");
                }}
                className="w-full text-xs text-muted-foreground h-9"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
              </Button>
            </form>
          )}

          {/* ======================================================== */}
          {/* MODE: FORGOT PASSWORD */}
          {/* ======================================================== */}
          {mode === "forgot" && (
            <div className="space-y-4">
              {forgotResult?.resetUrl ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-foreground space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Password Reset Link Generated</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reset link is ready for <strong>{forgotEmail}</strong>.
                    </p>
                    <Button
                      onClick={() => setLocation(forgotResult.resetUrl!)}
                      className="w-full h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2 rounded-xl"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Open Password Reset Page
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setForgotResult(null);
                      setMode("standard");
                    }}
                    className="w-full text-xs h-9 rounded-xl"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgotEmail" className="text-xs">Corporate Email Address</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                      disabled={forgotLoading}
                      className="h-10 text-xs rounded-xl"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      We'll generate a secure password reset link valid for 1 hour.
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-10 gap-2 shadow-md text-xs font-bold rounded-xl" disabled={forgotLoading || !forgotEmail.trim()}>
                    {forgotLoading ? (
                      "Sending Reset Instructions..."
                    ) : (
                      <>
                        <Mail className="w-4 h-4" /> Send Reset Link
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setMode("standard");
                      setForgotResult(null);
                    }}
                    className="w-full text-xs text-muted-foreground h-9"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Cancel and Back to Sign In
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE: STANDARD LOGIN (EMAIL OR MOBILE PWA OTP)           */}
          {/* ======================================================== */}
          {mode === "standard" && (
            <div className="space-y-4">
              {/* Segmented Auth Selector */}
              <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl border border-border/50 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    authMethod === "email"
                      ? "bg-card text-foreground shadow-sm border border-border/80 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Corporate Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("mobile");
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    authMethod === "mobile"
                      ? "bg-card text-foreground shadow-sm border border-border/80 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span>Site Mobile OTP</span>
                </button>
              </div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 1: CORPORATE EMAIL & PASSWORD                         */}
              {/* ──────────────────────────────────────────────────────── */}
              {authMethod === "email" && (
                <form onSubmit={handleEmailLogin} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="corporateEmail" className="text-xs font-semibold">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                      <Input
                        id="corporateEmail"
                        type="email"
                        placeholder="user@kanak.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        autoComplete="username"
                        disabled={isLoading}
                        className="h-10 text-xs pl-9 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="corporatePassword" className="text-xs font-semibold">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setMode("forgot");
                        }}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                      <Input
                        id="corporatePassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={isLoading}
                        className="h-10 text-xs pl-9 pr-9 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-0.5">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                    />
                    <Label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer font-normal">
                      Remember this workstation
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-xs font-bold rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all mt-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Signing In...
                      </span>
                    ) : (
                      "Sign In to Platform"
                    )}
                  </Button>

                  {/* Quick Role Sign In Helper */}
                  <div className="pt-3 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Role Sign In
                      </span>
                      <span className="text-[10px] text-muted-foreground">Demo Accounts</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_USERS.map((u) => (
                        <button
                          key={u.email}
                          type="button"
                          disabled={isLoading}
                          onClick={() => {
                            setEmail(u.email);
                            setPassword("password123");
                            performEmailLogin(u.email, "password123");
                          }}
                          className="flex flex-col p-2 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-accent/40 transition-all text-left text-xs disabled:opacity-50 group bg-background/50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground text-[11px] group-hover:text-primary transition-colors truncate">
                              {u.name}
                            </span>
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-primary/10 text-primary shrink-0">
                              {u.role.replace("Site ", "")}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-[10px] truncate mt-0.5">{u.email}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 2: SITE MOBILE PWA OTP                               */}
              {/* ──────────────────────────────────────────────────────── */}
              {authMethod === "mobile" && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <Label htmlFor="mobilePhone" className="text-xs font-semibold flex items-center justify-between">
                          <span>10-Digit Registered Mobile</span>
                          <span className="text-[11px] text-muted-foreground font-normal">India (+91)</span>
                        </Label>
                        <div className="flex gap-2">
                          <div className="w-16 h-11 flex items-center justify-center bg-muted/70 border border-border/70 rounded-xl text-xs font-mono font-medium text-muted-foreground shrink-0">
                            +91
                          </div>
                          <Input
                            id="mobilePhone"
                            type="tel"
                            inputMode="tel"
                            pattern="[0-9]*"
                            placeholder="e.g. 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                            autoFocus
                            disabled={isLoading}
                            className="h-11 font-mono text-sm tracking-wider rounded-xl"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Enter your mobile number to receive a secure one-time verification code.
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleSendMobileOtp()}
                        disabled={isLoading || phone.length < 10}
                        className="w-full h-11 text-xs font-bold gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-primary hover:from-amber-700 hover:to-primary/90 text-white shadow-md"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>{isLoading ? "Sending Code..." : "Send Verification Code"}</span>
                      </Button>

                      {/* Quick 1-Tap Mobile Access for Site Workers */}
                      <div className="pt-3 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick 1-Tap Mobile Access
                          </span>
                          <span className="text-[10px] text-muted-foreground">Site Demo</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {DEMO_USERS.map((u) => (
                            <button
                              key={u.phone}
                              type="button"
                              disabled={isLoading}
                              onClick={() => {
                                setPhone(u.phone);
                                handleQuickMobileLogin(u.phone);
                              }}
                              className="flex flex-col p-2 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-accent/40 transition-all text-left text-xs disabled:opacity-50 group bg-background/50"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground text-[11px] group-hover:text-primary transition-colors truncate">
                                  {u.name}
                                </span>
                                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 shrink-0">
                                  {u.role.replace("Site ", "")}
                                </span>
                              </div>
                              <span className="text-muted-foreground text-[10px] font-mono mt-0.5">+91 {u.phone}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* OTP Verification Screen */
                    <form onSubmit={handleVerifyMobileOtp} className="space-y-3.5 animate-in fade-in-50 duration-200">
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <SmartphoneNfc className="w-3.5 h-3.5 text-primary" />
                            OTP sent to +91 {phone}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtp("");
                            }}
                            className="text-[11px] text-primary hover:underline font-medium"
                          >
                            Change
                          </button>
                        </div>
                        {mobileUserData?.userName && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-500" />
                            <span>Signing in as <strong>{mobileUserData.userName}</strong> ({mobileUserData.userRole})</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="otpCode" className="text-xs font-semibold">
                          Enter 6-Digit OTP Code
                        </Label>
                        <Input
                          id="otpCode"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                          required
                          autoFocus
                          autoComplete="one-time-code"
                          disabled={isLoading}
                          className="text-center font-mono text-xl tracking-widest h-12 rounded-xl"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || otp.length < 6}
                        className="w-full h-11 text-xs font-bold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>{isLoading ? "Verifying..." : "Verify & Launch PWA"}</span>
                      </Button>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          type="button"
                          disabled={otpCountdown > 0 || isLoading}
                          onClick={() => handleSendMobileOtp()}
                          className={`text-[11px] font-medium transition-colors ${
                            otpCountdown > 0
                              ? "text-muted-foreground cursor-not-allowed"
                              : "text-primary hover:underline"
                          }`}
                        >
                          {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : "Resend OTP"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp("");
                          }}
                          className="text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Use another number
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/40 border-t border-border/50 px-5 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary" /> 256-bit Encrypted Session
          </span>
          <span className="font-mono text-[10px]">Enterprise Edition</span>
        </CardFooter>
      </Card>

      {/* Phone QR Code Dialog */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-sm p-5 text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" /> Open on Mobile Phone
            </DialogTitle>
            <DialogDescription className="text-xs">
              Scan this QR code with your mobile camera or enter the server URL:
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentOrigin)}`}
                alt="Mobile PWA QR Code"
                className="w-44 h-44 object-contain"
              />
            </div>

            <div className="w-full p-2.5 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-between gap-2">
              <code className="text-xs font-mono font-bold text-foreground truncate max-w-[240px]">
                {currentOrigin}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(currentOrigin);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                  toast({ title: "Copied!", description: `${currentOrigin} copied to clipboard.` });
                }}
                className="h-7 px-2 text-xs shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>

            <div className="text-left text-xs text-muted-foreground space-y-1.5 w-full bg-primary/5 p-3 rounded-xl border border-primary/10">
              <p className="font-semibold text-foreground text-[11px]">How to install as app on phone:</p>
              <p className="text-[11px]">1. Open camera & scan QR code (or navigate to URL above).</p>
              <p className="text-[11px]">2. Tap <strong>"Install App"</strong> on the banner, or browser menu &rarr; <strong>"Add to Home Screen"</strong>.</p>
              <p className="text-[11px]">3. Launch from your home screen for full offline DPR & site execution!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
