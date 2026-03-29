import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";


export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: "hsl(var(--gold))",
        silver: "hsl(var(--silver))",
        bronze: "hsl(var(--bronze))",
        // Wizardly Obsidian teal accent — direct access
        teal: {
          DEFAULT: "#7cebd6",
          dim: "#69d9c4",
          container: "#5ecfba",
          deep: "#00564a",
          void: "#00201b",
        },
        // Surface depth tokens
        surface: {
          DEFAULT: "#131313",
          low: "#1b1b1b",
          lowest: "#0e0e0e",
          high: "#2a2a2a",
          highest: "#353535",
          bright: "#393939",
        },
      },
      borderRadius: {
        // Wizardly uses ROUND_FULL — pills everywhere
        lg: "var(--radius)", // 12px
        md: "calc(var(--radius) - 2px)", // 10px
        sm: "calc(var(--radius) - 4px)", // 8px
        // named overrides
        "2xl": "20px",
        "3xl": "28px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Wizardly micro-animation: subtle fade-up
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Teal pulse glow
        "teal-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(94, 207, 186, 0)" },
          "50%": { boxShadow: "0 0 8px 2px rgba(94, 207, 186, 0.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.3s ease-out",
        "teal-pulse": "teal-pulse 2s ease-in-out infinite",
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        // Wizardly teal ambient glow
        teal: "0 0 20px rgba(94, 207, 186, 0.15), 0 0 48px rgba(124, 235, 214, 0.05)",
        "teal-sm": "0 0 8px rgba(94, 207, 186, 0.2)",
      },
      fontFamily: {
        // Wizardly uses Sora — modern geometric sans-serif
        sans: [
          "Sora",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      letterSpacing: {
        display: "-0.04em",
        headline: "-0.02em",
        label: "0.12em",
      },
      fontSize: {
        /* Semantic type scale for dashboard readability */
        display: [
          "clamp(2.5rem, 5vw + 1rem, 4rem)",
          { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "800" },
        ],
        heading: [
          "clamp(1.5rem, 2vw + 0.5rem, 2rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        subheading: [
          "clamp(1.125rem, 1vw + 0.5rem, 1.25rem)",
          { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "body-lg": [
          "1.125rem",
          { lineHeight: "1.5", letterSpacing: "-0.01em", fontWeight: "500" },
        ],
        body: [
          "1rem",
          { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" },
        ],
        label: [
          "0.875rem",
          { lineHeight: "1.4", letterSpacing: "0", fontWeight: "600" },
        ],
        caption: [
          "0.75rem",
          { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" },
        ],
        metric: [
          "1.25rem",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "metric-lg": [
          "clamp(1.5rem, 2vw + 0.5rem, 2.25rem)",
          { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "800" },
        ],
      },
    },
  },
  plugins: [tailwindAnimate],

} satisfies Config;
