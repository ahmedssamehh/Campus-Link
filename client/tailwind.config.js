/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: {
                        bg: '#222831', // Darkest - Background in dark mode
                        surface: '#393E46', // Dark gray - Cards/Sidebar in dark mode
                        muted: '#948979', // Muted gray-green - Borders/Tags in dark mode
                        text: '#DFD0B8', // Light beige - Text in dark mode
                    },
                    light: {
                        bg: '#DFD0B8', // Light beige - Background in light mode (reversed)
                        surface: '#948979', // Muted gray-green - Cards/Sidebar in light mode
                        muted: '#393E46', // Dark gray - Borders/Tags in light mode
                        text: '#222831', // Darkest - Text in light mode
                    },
                },
            },
            keyframes: {
                'slide-in-right': {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
            },
            animation: {
                'slide-in-right': 'slide-in-right 0.3s ease-out',
            },
        },
    },
    plugins: [],
}