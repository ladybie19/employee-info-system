/**
 * Theme Manager for Employee Info System
 * Handles dynamic accent color changes
 */

const themeManager = {
    // Default theme colors
    defaults: {
        accent: '#bc13fe',
        accentLight: '#d882ff',
        accentDark: '#7b00cc',
        accentGlow: 'rgba(188, 19, 254, 0.25)',
        gradientPrimary: 'linear-gradient(135deg, #4d5ef0, #bc13fe, #ff00d4)',
        gradientSecondary: 'linear-gradient(135deg, #4d5ef0, #bc13fe)'
    },

    /**
     * Initialize theme - apply saved color and light/dark preference
     */
    init() {
        // Apply saved accent color
        const savedColor = localStorage.getItem('theme-accent-color');
        if (savedColor) {
            this.applyTheme(savedColor);
        }

        // Apply saved light/dark mode
        const savedTheme = localStorage.getItem('app-theme') || 'dark';
        this.setTheme(savedTheme);
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const target = current === 'dark' ? 'light' : 'dark';
        this.setTheme(target);

        // Re-apply accent color to handle background logic (apply/remove derived backgrounds)
        const savedColor = localStorage.getItem('theme-accent-color');
        if (savedColor) {
            this.applyTheme(savedColor);
        }
    },

    /**
     * Apply a new accent color to the entire UI
     * @param {string} hex - Hex color code (e.g., #ff0000)
     */
    applyTheme(hex) {
        if (!hex) return;

        const rgb = this.hexToRgb(hex);
        if (!rgb) return;

        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        // Derive variations
        const lightColor = this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 95));
        const darkColor = this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 15, 5));
        const deepDarkColor = this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 30, 5));
        const veryLightColor = this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 30, 95));
        
        const glowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
        const hoverColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
        
        // Derive Background Tints (More visible dark versions)
        const bgPrimary = this.hslToHex(hsl.h, Math.min(hsl.s, 15), 10);
        const bgSecondary = this.hslToHex(hsl.h, Math.min(hsl.s, 20), 14);
        const bgSidebar = this.hslToHex(hsl.h, Math.min(hsl.s, 12), 8);
        const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
        
        // Derive Background Glows
        const glow1 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
        const glow2 = `rgba(${Math.max(rgb.r-40, 0)}, ${Math.max(rgb.g-40, 0)}, ${Math.min(rgb.b+40, 255)}, 0.12)`; // shifted variant
        const glow3 = `rgba(${Math.min(rgb.r+40, 255)}, ${Math.max(rgb.g-20, 0)}, ${Math.max(rgb.b-20, 0)}, 0.08)`; // shifted variant

        // Set CSS variables
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme') || 'dark';

        root.style.setProperty('--accent', hex);
        root.style.setProperty('--accent-light', lightColor);
        root.style.setProperty('--accent-dark', darkColor);
        root.style.setProperty('--accent-glow', glowColor);
        root.style.setProperty('--bg-hover', hoverColor);
        root.style.setProperty('--border-color', borderColor);
        
        // Update backgrounds for "Overall" theme change - ONLY in dark mode
        if (currentTheme === 'dark') {
            root.style.setProperty('--bg-primary', bgPrimary);
            root.style.setProperty('--bg-secondary', bgSecondary);
            root.style.setProperty('--bg-sidebar', bgSidebar);
            
            // Set glow variables
            root.style.setProperty('--bg-glow-1', glow1);
            root.style.setProperty('--bg-glow-2', glow2);
            root.style.setProperty('--bg-glow-3', glow3);
        } else {
            // Remove override properties so light mode CSS takes over
            root.style.removeProperty('--bg-primary');
            root.style.removeProperty('--bg-secondary');
            root.style.removeProperty('--bg-sidebar');
            root.style.removeProperty('--bg-glow-1');
            root.style.removeProperty('--bg-glow-2');
            root.style.removeProperty('--bg-glow-3');
        }
        
        // Update gradients
        root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${deepDarkColor}, ${hex}, ${veryLightColor})`);
        root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${deepDarkColor}, ${hex})`);
        
        // Update Scrollbar thumb (optional but premium)
        const styleId = 'dynamic-theme-scroll';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = `
            ::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, ${darkColor}, ${hex}) !important;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, ${hex}, ${lightColor}) !important;
                box-shadow: 0 0 10px ${glowColor} !important;
            }
        `;

        localStorage.setItem('theme-accent-color', hex);
    },

    /**
     * Reset theme to original system defaults
     */
    resetTheme() {
        const root = document.documentElement;
        root.style.removeProperty('--accent');
        root.style.removeProperty('--accent-light');
        root.style.removeProperty('--accent-dark');
        root.style.removeProperty('--accent-glow');
        root.style.removeProperty('--bg-hover');
        root.style.removeProperty('--bg-primary');
        root.style.removeProperty('--bg-secondary');
        root.style.removeProperty('--bg-sidebar');
        root.style.removeProperty('--border-color');
        root.style.removeProperty('--bg-glow-1');
        root.style.removeProperty('--bg-glow-2');
        root.style.removeProperty('--bg-glow-3');
        root.style.removeProperty('--gradient-primary');
        root.style.removeProperty('--gradient-secondary');
        
        const styleEl = document.getElementById('dynamic-theme-scroll');
        if (styleEl) styleEl.remove();

        localStorage.removeItem('theme-accent-color');
    },

    // --- Helper Math Utilities ---

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    },

    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }
};

// Initialize on load
themeManager.init();
