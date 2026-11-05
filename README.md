# Web SVJ

Web pro společenství vlastníků jednotek postavený na [Astro](https://astro.build). Zveřejňuje se
zdarma přes GitHub Pages.

- **Veřejný web:** https://laadic.github.io/SVJ/ (úvod s událostmi a aktualitami, výbor
  a kontakty, dokumenty ke stažení, hlášení závad)
- **Klientská sekce:** https://svjlipova.saltcorn.com (neveřejné dokumenty, evidence
  jednotek, schvalování faktur, psaní příspěvků na web). Běží na Saltcornu.

## Návody

| Návod | Pro koho |
|---|---|
| **[NAVOD.md](NAVOD.md)** | Pro každého, kdo web upravuje. Úpravy na GitHubu krok za krokem, aktuality a události, texty a nové stránky, uvedení do ostrého provozu, řešení potíží. |
| **[saltcorn/README.md](saltcorn/README.md)** | Pro výbor a admina klientské sekce. Instalace, pozvání uživatelů, role, schvalování faktur, příspěvky na web, bezpečnost. |
| [saltcorn/vyvoj/README.md](saltcorn/vyvoj/README.md) | Pro vývojáře. Sestavení a automatické testy klientské sekce. |

Každá změna ve větvi `main` se do 1–2 minut sama zveřejní (GitHub Actions →
**Zveřejnit web**).

---

## Pro pokročilé: úpravy na vlastním počítači

Potřebujete [Node.js](https://nodejs.org) verze 22.23 nebo novější.

```bash
npm install
```

```bash
npm run dev
```

Web pak běží na http://localhost:4321/SVJ/ a po uložení souboru se sám obnoví.
`npm run build` vytvoří hotový web do složky `dist/`.

### Struktura projektu

```
public/                 soubory, které se zkopírují beze změny (dokumenty, ikona)
src/
  nastaveni.ts          základní údaje o SVJ, adresa formuláře a klientské sekce
  content/              obsah: aktuality (.md), výbor, kontakty, dokumenty (.yaml)
  pages/                stránky webu (.astro, případně textové stránky .md)
  layouts/              Layout.astro (hlavička, menu, patička), TextovaStranka.astro
  components/           karty aktualit, seznamy aktualit a událostí
  prispevky.ts          načtení a bezpečné vykreslení příspěvků z klientské sekce
  prispevky-klient.ts   obnovení příspěvků v prohlížeči (nový příspěvek je vidět hned)
  styles/global.css     vzhled a barvy
.github/workflows/      automatické zveřejnění na GitHub Pages
saltcorn/               klientská sekce: balíček pro Saltcorn, návod a vývojové skripty
```

Příspěvky z klientské sekce se načítají z `<klientskaSekce>/api/action/verejne_prispevky`.
Načtou se při sestavení webu (pro návštěvníky bez JavaScriptu) a znovu v prohlížeči.
Když klientská sekce neodpovídá, web ukáže stav z posledního sestavení.
