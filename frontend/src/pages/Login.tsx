import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Command, ShieldCheck, Trophy, CalendarDays, GraduationCap } from 'lucide-react';
import { mapped_toast } from "@/lib/toast_map.ts";
import { Link } from 'react-router-dom';

/* ── Design tokens (Wizardly Obsidian) ── */
const T = {
  bg: "#0d0d0d",
  surface: "#131313",
  surfaceLow: "#1b1b1b",
  border: "#222224",
  borderSub: "#1e1e20",
  textPrimary: "#e3e3e3",
  textSecondary: "#6b7280",
  teal: "#7cebd6",
  tealContainer: "#5ecfba",
  tealDeep: "#1a3d37",
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (error) {
      mapped_toast('Invalid credentials', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-hidden"
      style={{ background: T.bg, color: T.textSecondary }}
    >
      {/* ── Top nav — Wizardly floating pill style ── */}
      <nav
        className="w-full flex items-center justify-between px-6 sm:px-10 py-4 relative z-10"
        style={{
          background: "rgba(13,13,13,0.9)",
          borderBottom: `1px solid ${T.borderSub}`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Brand badge */}
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ background: "#ffffff", padding: 6, width: 30, height: 30 }}
          >
            <Command className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm leading-none"
              style={{ color: T.textPrimary, letterSpacing: "-0.02em" }}
            >
              Version 26
            </span>
            <div className="h-3 w-px" style={{ background: T.border }} />
            <span
              className="font-bold"
              style={{
                fontSize: 10,
                color: T.tealContainer,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Cognix
            </span>
          </div>
        </div>

        <div className="flex gap-5 text-xs font-medium" style={{ color: T.textSecondary }}>
          {([
            { label: "Leaderboard", icon: <Trophy className="h-3.5 w-3.5" /> },
            { label: "Events",      icon: <CalendarDays className="h-3.5 w-3.5" /> },
            { label: "Colleges",    icon: <GraduationCap className="h-3.5 w-3.5" /> },
          ]).map(({ label, icon }) => (
            <Link
              key={label}
              to={`/${label.toLowerCase()}`}
              className="flex items-center gap-1.5 transition-colors duration-150"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.textPrimary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.textSecondary; }}
            >
              {icon}{label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Main centered content ── */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-0">

        {/* Teal ambient glow — Wizardly signature */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: 560,
            height: 560,
            background: "radial-gradient(circle, rgba(94,207,186,0.06) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* ── Login Card ── */}
        <div
          className="w-full max-w-[400px] p-8 sm:p-10 rounded-2xl relative animate-fade-up"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 0 48px rgba(94,207,186,0.04), 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Secure badge — top right */}
          <div
            className="absolute top-7 right-7 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: T.tealDeep,
              border: `1px solid ${T.tealContainer}25`,
            }}
          >
            <ShieldCheck className="w-3 h-3" style={{ color: T.teal }} />
            <span
              className="font-bold"
              style={{ fontSize: 9, color: T.teal, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              Secure
            </span>
          </div>

          {/* Brand icon + Heading */}
          <div className="mb-8 text-center mt-2 flex flex-col items-center">
            <div
              className="mb-5 flex items-center justify-center rounded-xl"
              style={{
                background: T.tealDeep,
                border: `1px solid ${T.tealContainer}30`,
                width: 48,
                height: 48,
              }}
            >
              <Command className="w-5 h-5" style={{ color: T.teal }} strokeWidth={2.5} />
            </div>

            {/* Wizardly hierarchy: small cap label above main heading */}
            <p
              className="font-bold mb-2"
              style={{
                fontSize: 10,
                color: T.tealContainer,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Version 26 · Cognix
            </p>
            <h1
              className="text-2xl font-bold mb-2 leading-tight"
              style={{ color: T.textPrimary, letterSpacing: "-0.03em" }}
            >
              Sign in to Dashboard
            </h1>
            <p className="text-sm font-medium" style={{ color: T.textSecondary }}>
              Enter your credentials to access the portal
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-bold block"
                style={{ color: T.textPrimary, letterSpacing: "0.04em" }}
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
                className="h-10 rounded-xl text-sm transition-all duration-150"
                style={{
                  background: T.surfaceLow,
                  border: `1px solid ${T.border}`,
                  color: T.textPrimary,
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold"
                  style={{ color: T.textPrimary, letterSpacing: "0.04em" }}
                >
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs font-medium transition-colors duration-150"
                  style={{ color: T.textSecondary }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.teal; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.textSecondary; }}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 rounded-xl text-sm transition-all duration-150"
                style={{
                  background: T.surfaceLow,
                  border: `1px solid ${T.border}`,
                  color: T.textPrimary,
                }}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 mt-4 rounded-xl font-bold text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <span className="mr-2 text-[8px]">●</span>
                  Continue
                </>
              )}
            </Button>

            {/* Register link */}
            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: T.textSecondary }}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold transition-colors duration-150"
                  style={{ color: T.tealContainer }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.teal; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.tealContainer; }}
                >
                  Create account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer
        className="w-full py-5 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between text-xs font-medium"
        style={{
          color: T.textSecondary,
          borderTop: `1px solid ${T.borderSub}`,
        }}
      >
        <p>&copy; {new Date().getFullYear()} Version 26 NITT · Cognix</p>
        <div className="flex gap-6 mt-3 sm:mt-0">
          {["Privacy", "Terms", "Contact"].map((link) => (
            <a
              key={link}
              href="#"
              className="transition-colors duration-150"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.textPrimary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.textSecondary; }}
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Login;
