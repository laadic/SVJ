// @ts-check
import { defineConfig } from 'astro/config';

// Adresa webu na GitHub Pages: https://<uživatel>.github.io/<název-repozitáře>/
// Pokud repozitář přejmenujete nebo použijete vlastní doménu, upravte "site" a "base".
// Vlastní doména (např. www.svj-example.cz): site: 'https://www.svj-example.cz', base: '/'
export default defineConfig({
  site: 'https://laadic.github.io',
  base: '/SVJ',
});
