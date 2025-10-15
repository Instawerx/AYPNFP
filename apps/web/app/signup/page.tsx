"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, signInWithGoogle, signInWithApple, signInWithMicrosoft } from "@/lib/auth";
import { Mail, Lock, Chrome, Apple, User } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      // Redirect to donor portal after successful signup
      router.push("/portal/donor");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError(err.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push("/portal/donor");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithApple();
      router.push("/portal/donor");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Apple");
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignUp = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithMicrosoft();
      router.push("/portal/donor");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Microsoft");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 bg-muted">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join ADOPT A YOUNG PARENT</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible-ring"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible-ring"
            >
              <Chrome className="h-5 w-5" />
              Google
            </button>

            <button
              onClick={handleAppleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible-ring"
            >
              <Apple className="h-5 w-5" />
              Apple
            </button>

            <button
              onClick={handleMicrosoftSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible-ring"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
              </svg>
              Microsoft
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
