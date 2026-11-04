// Pomocné funkce

/** Vytvoří odkaz s ohledem na "base" z astro.config.mjs */
export function url(cesta = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const c = cesta.replace(/^\//, '');
  return `${base}/${c}`;
}

/** Datum v českém formátu, např. 2. listopadu 2026 */
export function datum(d: Date): string {
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Telefon bez mezer pro odkaz tel: */
export function tel(t: string): string {
  return t.replace(/\s+/g, '');
}

/** Seřadí položky ze souborů YAML podle pořadí v souboru */
export function podlePoradi<T extends { data: { poradi: number } }>(polozky: T[]): T[] {
  return [...polozky].sort((a, b) => a.data.poradi - b.data.poradi);
}
