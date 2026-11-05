// ==============================================
//  PŘÍSPĚVKY A UDÁLOSTI Z KLIENTSKÉ SEKCE
// ==============================================
// Výbor je píše v klientské sekci (Saltcorn → Výbor → Příspěvky na web).
// Web si zveřejněné příspěvky načte při sestavení a pak znovu v prohlížeči,
// takže nový příspěvek je vidět hned, bez dalšího zveřejňování webu.
// Tento soubor používají stránky (při sestavení) i skript v prohlížeči.

export interface Prispevek {
  id: number | string;
  typ: 'Aktualita' | 'Událost' | string;
  nadpis: string;
  perex: string;
  text: string;
  datum: string | null; // datum zveřejnění (YYYY-MM-DD)
  zacatek: string | null; // datum události (YYYY-MM-DD)
  cas: string; // čas události, např. 18:00
  misto: string;
  dulezite: boolean;
}

/** Adresa veřejného seznamu příspěvků v klientské sekci */
export const adresaApi = (zaklad: string) => `${zaklad.replace(/\/+$/, '')}/api/action/verejne_prispevky`;

/**
 * Načte zveřejněné příspěvky. Když klientská sekce není nastavená nebo nejde načíst,
 * vrátí null – web pak jen ponechá to, co už zobrazuje (nikdy kvůli tomu nespadne).
 */
export async function nacistPrispevky(zaklad: string, casovyLimitMs = 8000): Promise<Prispevek[] | null> {
  if (!zaklad) return null;
  try {
    const odpoved = await fetch(adresaApi(zaklad), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(casovyLimitMs),
    });
    if (!odpoved.ok) return null;
    const json = await odpoved.json();
    return Array.isArray(json?.data) ? json.data.filter((p: Prispevek) => p && p.nadpis) : null;
  } catch {
    return null;
  }
}

/** Při sestavení webu stačí příspěvky stáhnout jednou pro všechny stránky */
const pamet = new Map<string, Promise<Prispevek[] | null>>();
export const nacistPriSestaveni = (zaklad: string) => {
  if (!pamet.has(zaklad)) pamet.set(zaklad, nacistPrispevky(zaklad, 15000));
  return pamet.get(zaklad)!;
};

// ---------- Datumy (vše jako kalendářní dny, bez posunu časových pásem) ----------

/** "2026-11-04" z libovolného data v ISO tvaru */
export const den = (hodnota: string | null | undefined): string => (hodnota ? String(hodnota).slice(0, 10) : '');

/** Dnešní datum v Praze ve tvaru YYYY-MM-DD */
export const dnesVPraze = (): string =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague' }).format(new Date());

const jakoDatum = (d: string) => {
  const [r, m, dd] = d.split('-').map(Number);
  return new Date(Date.UTC(r, (m || 1) - 1, dd || 1));
};

/** 4. listopadu 2026 */
export const formatDen = (d: string): string =>
  d ? jakoDatum(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';

/** středa 11. listopadu 2026, 18:00 */
export const formatUdalosti = (p: Prispevek): string => {
  const d = den(p.zacatek);
  if (!d) return '';
  const tyden = jakoDatum(d).toLocaleDateString('cs-CZ', { weekday: 'long', timeZone: 'UTC' });
  return `${tyden} ${formatDen(d)}${p.cas ? `, ${p.cas}` : ''}`;
};

export const jeUdalost = (p: Prispevek) => p.typ === 'Událost';
export const jeNadchazejici = (p: Prispevek, dnes = dnesVPraze()) => jeUdalost(p) && den(p.zacatek) >= dnes;

/** Nadcházející události od nejbližší */
export const nadchazejiciUdalosti = (seznam: Prispevek[], dnes = dnesVPraze()) =>
  seznam.filter((p) => jeNadchazejici(p, dnes)).sort((a, b) => (den(a.zacatek) + a.cas).localeCompare(den(b.zacatek) + b.cas));

/** Proběhlé události od nejnovější */
export const probehleUdalosti = (seznam: Prispevek[], dnes = dnesVPraze()) =>
  seznam.filter((p) => jeUdalost(p) && den(p.zacatek) < dnes).sort((a, b) => den(b.zacatek).localeCompare(den(a.zacatek)));

/**
 * Klíč pro řazení aktualit od nejnovější: datum, při shodě novější příspěvek
 * (aktuality ze souborů mají při shodném datu nižší prioritu).
 */
export const klicRazeni = (datum: string, id: number | string = 0) => `${datum}|${String(id).padStart(10, '0')}`;

/** Aktuality (ne události) od nejnovější */
export const aktualityZKlientskeSekce = (seznam: Prispevek[]) =>
  seznam.filter((p) => !jeUdalost(p)).sort((a, b) => klicRazeni(den(b.datum), b.id).localeCompare(klicRazeni(den(a.datum), a.id)));

// ---------- Bezpečné vykreslení textu ----------

export const escapovat = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]!);

/** Odstavce oddělené prázdným řádkem, zalomení řádků a klikací odkazy http(s) */
export const textNaHtml = (text: string): string =>
  String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((odst) => odst.trim())
    .filter(Boolean)
    .map((odst) => {
      const html = escapovat(odst)
        .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)"']/g, (url) => `<a href="${url}" rel="noopener nofollow ugc">${url}</a>`)
        .replace(/\n/g, '<br />');
      return `<p>${html}</p>`;
    })
    .join('');

const celyText = (p: Prispevek) =>
  p.text ? `<details class="vice"><summary>Celý text</summary><div class="obsah">${textNaHtml(p.text)}</div></details>` : '';

/** Karta aktuality ze stejné šablony jako aktuality ze souborů */
export function kartaAktuality(p: Prispevek, skryta = false): string {
  const d = den(p.datum);
  return `<article class="karta aktualita${p.dulezite ? ' aktualita--dulezita' : ''}" data-razeni="${escapovat(klicRazeni(d, p.id))}" data-zdroj="klientska-sekce"${skryta ? ' hidden' : ''}>
  <div class="aktualita__hlava">${d ? `<time class="datum" datetime="${escapovat(d)}">${escapovat(formatDen(d))}</time>` : ''}${p.dulezite ? '<span class="stitek">Důležité</span>' : ''}</div>
  <h3>${escapovat(p.nadpis)}</h3>
  ${p.perex ? `<p>${escapovat(p.perex)}</p>` : ''}
  ${celyText(p)}
</article>`;
}

/** Karta události s datem v rohu */
export function kartaUdalosti(p: Prispevek): string {
  const d = den(p.zacatek);
  const datum = d ? jakoDatum(d) : null;
  const mesic = datum ? datum.toLocaleDateString('cs-CZ', { month: 'short', timeZone: 'UTC' }).replace('.', '') : '';
  return `<article class="karta udalost${p.dulezite ? ' udalost--dulezita' : ''}" data-datum="${escapovat(d)}" data-zdroj="klientska-sekce">
  <div class="udalost__datum" aria-hidden="true"><span class="udalost__den">${datum ? datum.getUTCDate() : ''}</span><span class="udalost__mesic">${escapovat(mesic)}</span></div>
  <div class="udalost__obsah">
    <h3>${escapovat(p.nadpis)}</h3>
    <p class="udalost__kdy"><time datetime="${escapovat(d)}">${escapovat(formatUdalosti(p))}</time>${p.misto ? ` · ${escapovat(p.misto)}` : ''}</p>
    ${p.perex ? `<p>${escapovat(p.perex)}</p>` : ''}
    ${celyText(p)}
  </div>
</article>`;
}
