import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

// Načte seznam ze souboru YAML, zachová pořadí ze souboru
// a každé položce sám přidělí id – v souborech ho tedy psát nemusíte.
// Všechny hodnoty čte jako text (telefon +420601111222 tak zůstane beze změny)
// a prázdná pole (např. "datum:" bez hodnoty) vynechá.
function seznam(text: string) {
  const polozky = (parse(text, { schema: 'failsafe' }) ?? []) as Record<string, unknown>[];
  return polozky.map((p, i) => ({
    ...Object.fromEntries(Object.entries(p).filter(([, v]) => v != null && v !== '')),
    id: String(i + 1),
    poradi: i,
  }));
}

// Aktuality – každá je jeden soubor .md ve složce src/content/aktuality
const aktuality = defineCollection({
  // Soubory začínající podtržítkem (např. _sablona.md) se na webu nezobrazí.
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/aktuality' }),
  schema: z.object({
    nadpis: z.string(),
    datum: z.coerce.date(),
    perex: z.string().optional(),
    dulezite: z.boolean().default(false),
  }),
});

// Členové výboru – soubor src/content/vybor.yaml
const vybor = defineCollection({
  loader: file('src/content/vybor.yaml', { parser: seznam }),
  schema: z.object({
    poradi: z.number(),
    jmeno: z.string(),
    funkce: z.string(),
    email: z.string().optional(),
    telefon: z.string().optional(),
    poznamka: z.string().optional(),
  }),
});

// Další důležité kontakty – soubor src/content/kontakty.yaml
const kontakty = defineCollection({
  loader: file('src/content/kontakty.yaml', { parser: seznam }),
  schema: z.object({
    poradi: z.number(),
    nazev: z.string(),
    popis: z.string().optional(),
    telefon: z.string().optional(),
    email: z.string().optional(),
    web: z.string().optional(),
  }),
});

// Dokumenty ke stažení – soubor src/content/dokumenty.yaml,
// samotné soubory patří do složky public/dokumenty
const dokumenty = defineCollection({
  loader: file('src/content/dokumenty.yaml', { parser: seznam }),
  schema: z.object({
    poradi: z.number(),
    nazev: z.string(),
    soubor: z.string(),
    kategorie: z.string(),
    datum: z.coerce.date().optional(),
    popis: z.string().optional(),
  }),
});

export const collections = { aktuality, vybor, kontakty, dokumenty };
