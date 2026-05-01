import type { Config } from "tailwindcss";

// =============================================================================
// AI Hub - Tailwind CSS Configuration
// Corporate Design Tokens
// =============================================================================

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      // -----------------------------------------------------------------------
      // Brand Colors
      // -----------------------------------------------------------------------
      colors: {
        // Primary - Brand Green
        brand: {
          primary: {
            50: "#E6F7ED",
            100: "#C0EBD4",
            200: "#96DEB8",
            300: "#6BD19C",
            400: "#4BC887",
            500: "#00A651", // Primary Brand Green
            600: "#009548",
            700: "#00823E",
            800: "#006837", // Dark Green
            900: "#004D29",
            950: "#003A1F",
          },
          // Secondary - Brand Gold
          accent: {
            50: "#FBF6E8",
            100: "#F5E9C5",
            200: "#EFDB9E",
            300: "#E8CD77",
            400: "#D4B85E",
            500: "#C7A84E", // Primary Brand Gold
            600: "#B59540",
            700: "#9E8035",
            800: "#876B2B",
            900: "#6B5422",
            950: "#4F3E19",
          },
        },

        // Neutral / Background
        surface: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          400: "#BDBDBD",
          500: "#9E9E9E",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#212121",
          950: "#121212",
        },

        // Semantic Colors
        success: {
          light: "#E6F7ED",
          DEFAULT: "#00A651",
          dark: "#006837",
        },
        warning: {
          light: "#FFF8E1",
          DEFAULT: "#FFA726",
          dark: "#E65100",
        },
        error: {
          light: "#FFEBEE",
          DEFAULT: "#EF5350",
          dark: "#C62828",
        },
        info: {
          light: "#E3F2FD",
          DEFAULT: "#42A5F5",
          dark: "#1565C0",
        },

        // AI Provider Accent Colors
        ai: {
          gemini: "#4285F4",
          claude: "#D97706",
          openai: "#10A37F",
          copilot: "#6366F1",
        },
      },

      // -----------------------------------------------------------------------
      // Typography
      // -----------------------------------------------------------------------
      fontFamily: {
        sans: [
          "var(--font-plus-jakarta)",
          "Plus Jakarta Sans",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        heading: [
          "var(--font-plus-jakarta)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-dm-sans)",
          "DM Sans",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "monospace",
        ],
      },

      fontSize: {
        // Custom type scale
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-sm": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "headline-lg": ["2rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "headline": ["1.75rem", { lineHeight: "1.3" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.35" }],
        "title-lg": ["1.25rem", { lineHeight: "1.4" }],
        "title": ["1.125rem", { lineHeight: "1.45" }],
        "title-sm": ["1rem", { lineHeight: "1.5" }],
        "body-lg": ["1rem", { lineHeight: "1.6" }],
        "body": ["0.875rem", { lineHeight: "1.6" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5" }],
        "caption": ["0.75rem", { lineHeight: "1.5" }],
        "overline": ["0.6875rem", { lineHeight: "1.5", letterSpacing: "0.08em" }],
      },

      // -----------------------------------------------------------------------
      // Spacing & Layout
      // -----------------------------------------------------------------------
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        "sidebar": "280px",
        "sidebar-collapsed": "72px",
        "header": "64px",
      },

      // -----------------------------------------------------------------------
      // Border Radius
      // -----------------------------------------------------------------------
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      // -----------------------------------------------------------------------
      // Shadows (Brand style - subtle, layered)
      // -----------------------------------------------------------------------
      boxShadow: {
        "card": "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 10px 30px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)",
        "elevated": "0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06)",
        "inner-glow": "inset 0 1px 4px rgba(0, 166, 81, 0.1)",
        "brand-primary": "0 4px 14px rgba(0, 166, 81, 0.25)",
        "brand-accent": "0 4px 14px rgba(199, 168, 78, 0.25)",
      },

      // -----------------------------------------------------------------------
      // Transition Utilities
      // -----------------------------------------------------------------------
      transitionDuration: {
        "1500": "1500ms",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      // -----------------------------------------------------------------------
      // Animations (Framer Motion compatible tokens)
      // -----------------------------------------------------------------------
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "fade-up": "fadeUp 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      // -----------------------------------------------------------------------
      // Background images & gradients
      // -----------------------------------------------------------------------
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #00A651 0%, #006837 100%)",
        "brand-gradient-gold": "linear-gradient(135deg, #C7A84E 0%, #9E8035 100%)",
        "brand-gradient-subtle": "linear-gradient(135deg, #E6F7ED 0%, #C0EBD4 100%)",
        "brand-mesh": "radial-gradient(at 40% 20%, #E6F7ED 0px, transparent 50%), radial-gradient(at 80% 0%, #FBF6E8 0px, transparent 50%), radial-gradient(at 0% 50%, #E3F2FD 0px, transparent 50%)",
      },

      // -----------------------------------------------------------------------
      // Z-Index Scale
      // -----------------------------------------------------------------------
      zIndex: {
        "dropdown": "1000",
        "sticky": "1100",
        "fixed": "1200",
        "modal-backdrop": "1300",
        "modal": "1400",
        "popover": "1500",
        "tooltip": "1600",
        "toast": "1700",
      },

      // -----------------------------------------------------------------------
      // Screens (Breakpoints)
      // -----------------------------------------------------------------------
      screens: {
        "xs": "475px",
        "3xl": "1920px",
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("tailwindcss-animate"),
  ],
};

export default config;
