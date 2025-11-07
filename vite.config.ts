import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "ocx-logo.png"],
      manifest: {
        name: "OCX - Encrypted Texts/Images Secure",
        short_name: "OCX",
        description: "Privacy-focused encrypted messaging and image application. Secure text encryption with local processing — no data stored, 100% private.",
        start_url: "/",
        lang: "en",
        dir: "ltr",
        scope: "/",
        theme_color: "#8B5CF6",
        background_color: "#0F172A",
        display: "standalone",
        orientation: "portrait",
        categories: ["utilities", "productivity", "security"],
        screenshots: [
          {
            src: "/screenshot-1.png",
            sizes: "1170x2532",
            type: "image/png",
            form_factor: "narrow",
            label: "Encrypt and decrypt messages securely"
          },
          {
            src: "/screenshot-2.png",
            sizes: "1170x2532",
            type: "image/png",
            form_factor: "narrow",
            label: "Image encryption with privacy"
          },
          {
            src: "/screenshot-3.png",
            sizes: "1170x2532",
            type: "image/png",
            form_factor: "narrow",
            label: "Ephemeral encrypted chat rooms"
          },
          {
            src: "/screenshot-4.png",
            sizes: "2048x2732",
            type: "image/png",
            form_factor: "wide",
            label: "Full encryption suite on tablet"
          }
        ],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        shortcuts: [
          {
            name: "Encrypt Message",
            short_name: "Encrypt",
            description: "Quickly encrypt a new message",
            url: "/#encrypt",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Decrypt Message",
            short_name: "Decrypt",
            description: "Decrypt a received message",
            url: "/#decrypt",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Image Encryption",
            short_name: "Images",
            description: "Encrypt or decrypt images",
            url: "/image-encryption",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Ephemeral Chat",
            short_name: "Chat",
            description: "Start a secure ephemeral chat",
            url: "/ephemeral-space",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
