/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'oklch(var(--border) / 1)',
        input: 'oklch(var(--input) / 1)',
        ring: 'oklch(var(--ring) / 1)',
        background: 'oklch(var(--background) / 1)',
        foreground: 'oklch(var(--foreground) / 1)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / 1)',
          foreground: 'oklch(var(--primary-foreground) / 1)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / 1)',
          foreground: 'oklch(var(--secondary-foreground) / 1)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / 1)',
          foreground: 'oklch(var(--accent-foreground) / 1)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / 1)',
          foreground: 'oklch(1 0 0 / 1)',
        },
        sidebar: {
          DEFAULT: 'oklch(var(--sidebar) / 1)',
          foreground: 'oklch(var(--sidebar-foreground) / 1)',
          primary: 'oklch(var(--sidebar-primary) / 1)',
          'primary-foreground': 'oklch(var(--sidebar-primary-foreground) / 1)',
          accent: 'oklch(var(--sidebar-accent) / 1)',
          'accent-foreground': 'oklch(var(--sidebar-accent-foreground) / 1)',
          border: 'oklch(var(--sidebar-border) / 1)',
          ring: 'oklch(var(--sidebar-ring) / 1)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
