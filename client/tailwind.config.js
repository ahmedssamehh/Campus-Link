/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                // Platform system font first: ships optical sizing and tuned tracking tables.
                sans: [
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"SF Pro Text"',
                    '"Segoe UI Variable Text"',
                    '"Segoe UI"',
                    'Roboto',
                    '"Helvetica Neue"',
                    'Arial',
                    'sans-serif',
                ],
            },
            colors: {
                // Neutral system greys
                gray: {
                    50: '#F5F5F7',
                    100: '#F2F2F7',
                    200: '#E5E5EA',
                    300: '#D1D1D6',
                    400: '#8E8E93',
                    500: '#6E6E73',
                    600: '#515154',
                    700: '#3A3A3C',
                    800: '#2C2C2E',
                    900: '#1C1C1E',
                    950: '#000000',
                },
                // Single accent: system blue
                blue: {
                    50: '#EEF5FF',
                    100: '#DCEBFF',
                    200: '#B8D6FF',
                    300: '#85B8FF',
                    400: '#409CFF',
                    500: '#0A84FF',
                    600: '#0071E3',
                    700: '#0062C4',
                    800: '#00509E',
                    900: '#003F7D',
                    950: '#002850',
                },
            },
            borderRadius: {
                md: '0.5rem',
                lg: '0.625rem',
                xl: '0.875rem',
                '2xl': '1.125rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
                DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
                md: '0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
                lg: '0 10px 30px -10px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
                xl: '0 18px 44px -14px rgb(0 0 0 / 0.18), 0 4px 10px -4px rgb(0 0 0 / 0.05)',
                '2xl': '0 28px 64px -18px rgb(0 0 0 / 0.26)',
                // Cards on a grouped background barely lift — separation comes from tone, not shadow.
                card: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
                // Kept as a token name for existing markup; deliberately neutral (no coloured glow).
                glow: '0 1px 2px 0 rgb(0 0 0 / 0.08)',
            },
            transitionTimingFunction: {
                DEFAULT: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            },
            transitionDuration: {
                DEFAULT: '180ms',
            },
            keyframes: {
                'slide-in-right': {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
            },
            animation: {
                'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            },
        },
    },
    plugins: [],
}
