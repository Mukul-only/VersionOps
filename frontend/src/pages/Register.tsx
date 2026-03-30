import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Command, ShieldCheck, ArrowLeft } from 'lucide-react';
import { mapped_toast } from "@/lib/toast_map.ts";
import { Link } from 'react-router-dom';

/* ── Design tokens (Neon Arena / Stitch) ── */
const T = {
  bg: "#0e0e0e",
  surface: "#1a1919",
  surfaceLow: "#201f1f",
  surfaceContainer: "#2c2c2c",
  border: "#494847",
  borderSub: "#494847",
  textPrimary: "#ffffff",
  textSecondary: "#adaaaa",
  textMuted: "#777575",
  accent: "#00FF94",
  accentDim: "#00ed89",
  accentContainer: "#00fd93",
  accentBg: "#002213",
  gold: "#ffd709",
  goldBg: "#1a1404",
  goldBorder: "#705d00",
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      mapped_toast('All fields are required', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mapped_toast('Invalid email format', 'error');
      return;
    }

    if (password.length < 6) {
      mapped_toast('Password must be at least 6 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      mapped_toast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      mapped_toast('Registration successful!', 'success');
    } catch (error: any) {
      mapped_toast(error.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-hidden"
      style={{ background: T.bg, color: T.textSecondary }}
    >
      {/* ── Top nav — Neon Arena style ── */}
      <nav
        className="w-full flex items-center justify-between px-6 sm:px-10 py-4 relative z-10"
        style={{
          background: "rgba(14,14,14,0.9)",
          borderBottom: `1px solid ${T.borderSub}`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ background: T.accent, padding: 6, width: 32, height: 32 }}
          >
            <Command className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm leading-none font-space"
              style={{ color: T.textPrimary, letterSpacing: "-0.02em", fontFamily: "Space Grotesk, sans-serif" }}
            >
              Version 26
            </span>
            <div className="h-4 w-px" style={{ background: T.border }} />
            <span
              className="font-bold"
              style={{
                fontSize: 10,
                color: T.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Cognix
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main centered content ── */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-0">
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: 560,
            height: 560,
            background: "radial-gradient(circle, rgba(0,255,148,0.06) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* ── Register Card ── */}
        <div
          className="w-full max-w-[440px] p-8 sm:p-10 rounded-2xl relative animate-fade-up"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 0 48px rgba(0,255,148,0.04), 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Back to login link */}
          <Link
            to="/login"
            className="absolute top-7 left-7 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150"
            style={{
              background: T.surfaceLow,
              border: `1px solid ${T.border}`,
              color: T.textSecondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.accent + '50';
              e.currentTarget.style.color = T.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.color = T.textSecondary;
            }}
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="font-bold" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
              Back
            </span>
          </Link>

          <div
            className="absolute top-7 right-7 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: T.accentBg,
              border: `1px solid ${T.accent}25`,
            }}
          >
            <ShieldCheck className="w-3 h-3" style={{ color: T.accent }} />
            <span
              className="font-bold"
              style={{ fontSize: 9, color: T.accent, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}
            >
              Secure
            </span>
          </div>

          <div className="mb-8 text-center mt-2 flex flex-col items-center">
            <div
              className="mb-5 flex items-center justify-center rounded-xl"
              style={{
                background: T.accentBg,
                border: `1px solid ${T.accent}30`,
                width: 56,
                height: 56,
              }}
            >
              <Command className="w-6 h-6" style={{ color: T.accent }} strokeWidth={2.5} />
            </div>

            <p
              className="font-bold mb-2"
              style={{
                fontSize: 10,
                color: T.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Version 26 · Cognix
            </p>
            <h1 className="text-heading mb-2" style={{ color: T.textPrimary, fontFamily: "Space Grotesk, sans-serif" }}>
              Create Account
            </h1>
            <p className="text-body" style={{ color: T.textSecondary }}>
              Register to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-caption font-bold block"
                style={{ color: T.textPrimary, letterSpacing: "0.04em", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 rounded-xl text-sm transition-all duration-150"
                style={{
                  background: T.surfaceLow,
                  border: `1px solid ${T.border}`,
                  color: T.textPrimary,
                  fontFamily: "Manrope, sans-serif",
                }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-caption font-bold block"
                style={{ color: T.textPrimary, letterSpacing: "0.04em", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl text-sm transition-all duration-150"
                style={{
                  background: T.surfaceLow,
                  border: `1px solid ${T.border}`,
                  color: T.textPrimary,
                  fontFamily: "Manrope, sans-serif",
                }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-caption font-bold"
                style={{ color: T.textPrimary, letterSpacing: "0.04em", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl text-sm transition-all duration-150"
                style={{
                  background: T.surfaceLow,
                  border: `1px solid ${T.border}`,
                  color: T.textPrimary,
                  fontFamily: "Manrope, sans-serif",
                }}
              />
              <p className="text-xs" style={{ color: T.textSecondary, fontFamily: "Manrope, sans-serif" }}>
                Minimum 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-caption font-bold"
                style={{ color: T.textPrimary, letterSpacing: "0.04em", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11 rounded-xl text-sm transition-all duration-150"
                style={{
                  background: T.surfaceLow,
                  border: `1px solid ${T.border}`,
                  color: T.textPrimary,
                  fontFamily: "Manrope, sans-serif",
                }}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-6 rounded-xl font-bold text-sm border-none transition-all duration-200 hover:brightness-110"
              disabled={isSubmitting}
              style={{
                background: T.accent,
                color: "#000000",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <span className="mr-2 text-[8px]">●</span>
                  Create Account
                </>
              )}
            </Button>

            <div className="text-center mt-5">
              <p className="text-sm" style={{ color: T.textSecondary }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold transition-colors duration-150"
                  style={{ color: T.accent }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.accentDim; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.accent; }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <footer
        className="w-full py-5 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between text-xs font-medium"
        style={{
          color: T.textMuted,
          borderTop: `1px solid ${T.borderSub}`,
          fontFamily: "Manrope, sans-serif",
        }}
      >
        <p>&copy; {new Date().getFullYear()} Version 26 NITT · Cognix</p>
        <div className="flex gap-6 mt-3 sm:mt-0">
          {["Privacy", "Terms", "Contact"].map((link) => (
            <a
              key={link}
              href="#"
              className="transition-colors duration-150"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.textPrimary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.textMuted; }}
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Register;
