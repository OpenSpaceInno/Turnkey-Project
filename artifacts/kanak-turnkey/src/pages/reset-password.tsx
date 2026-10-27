import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<"pending" | "valid" | "invalid">("pending");
  const [tokenError, setTokenError] = useState("");
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract token from query params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token") || "";
    if (queryToken) {
      setToken(queryToken);
      validateToken(queryToken);
    } else {
      setTokenStatus("pending");
    }
  }, []);

  const validateToken = async (tok: string) => {
    if (!tok.trim()) return;
    setIsValidatingToken(true);
    setTokenError("");

    try {
      const response = await fetch("/api/auth/verify-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tok.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.valid) {
        setTokenStatus("invalid");
        setTokenError(data.error || "This reset token is invalid or has expired.");
      } else {
        setTokenStatus("valid");
        setUserInfo({ email: data.email, name: data.name });
      }
    } catch {
      setTokenStatus("invalid");
      setTokenError("Unable to verify token. Please check your connection and try again.");
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please make sure your confirmation password matches.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "An error occurred while resetting your password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-muted" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 20, label: "Very Weak", color: "bg-red-500" };
    if (score === 2) return { score: 40, label: "Weak", color: "bg-orange-500" };
    if (score === 3) return { score: 60, label: "Medium", color: "bg-amber-500" };
    if (score === 4) return { score: 80, label: "Strong", color: "bg-emerald-500" };
    return { score: 100, label: "Very Strong", color: "bg-emerald-600" };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/70 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="flex items-center justify-center mb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSuccess ? "Password Reset Complete" : "Reset Your Password"}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? "Your credentials have been securely updated."
              : "Choose a strong, unique password to protect your account."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Success State */}
          {isSuccess ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">Password Changed!</h3>
                <p className="text-sm text-muted-foreground">
                  You can now sign in with your new password on Kanak Turnkey.
                </p>
              </div>
              <Button
                onClick={() => setLocation("/login")}
                className="w-full gap-2 shadow-md"
              >
                <ArrowLeft className="w-4 h-4" /> Go to Sign In
              </Button>
            </div>
          ) : tokenStatus === "invalid" ? (
            /* Invalid / Expired Token State */
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 text-destructive mx-auto flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-destructive">Invalid or Expired Link</h3>
                <p className="text-sm text-muted-foreground">{tokenError}</p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setToken("");
                    setTokenStatus("pending");
                  }}
                  className="w-full text-xs"
                >
                  Enter another token manually
                </Button>
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Button>
              </div>
            </div>
          ) : tokenStatus === "pending" && !token ? (
            /* No Token in URL: Prompt user for token */
            <form onSubmit={handleManualTokenSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenInput">Password Reset Token</Label>
                <Input
                  id="tokenInput"
                  placeholder="Paste your reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Paste the token received from your password reset link or console simulation.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isValidatingToken || !token.trim()}>
                {isValidatingToken ? "Verifying Token..." : "Verify Token"}
              </Button>
            </form>
          ) : (
            /* Valid Token: Show Password Reset Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {userInfo && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {userInfo.name.slice(0, 1)}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-medium text-foreground truncate">{userInfo.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{userInfo.email}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Strength:</span>
                      <span className="font-medium text-foreground">{strength.label}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Password must be at least 6 characters long and will be securely encrypted with bcrypt.
                </span>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 shadow-md"
                disabled={isSubmitting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                {isSubmitting ? (
                  "Updating Password..."
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Save New Password
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="pt-0 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/login")}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
