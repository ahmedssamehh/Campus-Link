/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Inter',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'sans-serif',
                ],
            },
            colors: {
                // Blue-tinted cool neutrals (premium, matches brand reference)
                gray: {
                    50: '#F5F8FC',
                    100: '#EDF2F9',
                    200: '#DFE7F2',
                    300: '#C8D4E5',
                    400: '#94A3BC',
                    500: '#64748F',
                    600: '#475571',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F1B2D',
                    950: '#0A1220',
                },
                // Royal blue brand scale
                blue: {
                    50: '#EEF4FF',
                    100: '#DCE9FF',
                    200: '#BAD3FF',
                    300: '#8DB5FF',
                    400: '#5B8EFC',
                    500: '#3B6FF6',
                    600: '#2458E6',
                    700: '#1D46C2',
                    800: '#1C3B9B',
                    900: '#1C337A',
                    950: '#131F4D',
                },
                brand: {
                    dark: {
                        bg: '#0F1B2D',
                        surface: '#1E293B',
                        muted: '#64748F',
                        text: '#EDF2F9',
                    },
                    light: {
                        bg: '#F5F8FC',
                        surface: '#FFFFFF',
                        muted: '#C8D4E5',
                        text: '#0F1B2D',
                    },
                },
            },
            borderRadius: {
                md: '0.625rem',
                lg: '0.75rem',
                xl: '1rem',
                '2xl': '1.25rem',
                '3xl': '1.75rem',
            },
            boxShadow: {
                sm: '0 1px 2px 0 rgb(15 35 85 / 0.05)',
                DEFAULT: '0 1px 3px 0 rgb(15 35 85 / 0.07), 0 1px 2px -1px rgb(15 35 85 / 0.06)',
                md: '0 6px 16px -4px rgb(15 35 85 / 0.08), 0 2px 6px -2px rgb(15 35 85 / 0.05)',
                lg: '0 12px 32px -8px rgb(15 35 85 / 0.12), 0 4px 12px -4px rgb(15 35 85 / 0.06)',
                xl: '0 20px 48px -12px rgb(15 35 85 / 0.18)',
                '2xl': '0 32px 64px -16px rgb(15 35 85 / 0.22)',
                card: '0 2px 4px -2px rgb(15 35 85 / 0.05), 0 10px 28px -8px rgb(15 35 85 / 0.09)',
                glow: '0 8px 24px -6px rgb(36 88 230 / 0.40)',
            },
            keyframes: {
                'slide-in-right': {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'fade-up': {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            animation: {
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                'fade-up': 'fade-up 0.4s ease-out both',
            },
        },
    },
    plugins: [],
}
