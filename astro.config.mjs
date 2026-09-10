import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    // Astro 5 otherwise converts private import.meta.env references to runtime
    // process.env. FBC's protected server routes need build-only values inlined.
    // Do not import the FBC private variables from any browser/client module.
    experimental: { staticImportMetaEnv: true },
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [react()],
    adapter: netlify({
        devFeatures: {
            environmentVariables: true
        }
    })
});
