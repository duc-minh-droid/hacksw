/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                secondary: "#ECD2CA", // Soft Pink
                primary: "#F95952", // Red
                primary_dark: "#c82821", // Dark Red
                accent: "#563C51", // Light Purple
                dark: "#371D32", // Dark Purple
            },
        },
    },
    plugins: [],
};