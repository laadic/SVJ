# Web SVJ

Jednoduchý web pro společenství vlastníků jednotek, postavený na [Astro](https://astro.build)
a zveřejněný zdarma přes GitHub Pages.

Stránky: **Úvod s aktualitami**, **Výbor a kontakty**, **Dokumenty ke stažení**, **Hlášení závad**.

Adresa webu: **https://laadic.github.io/SVJ/**

---

## Kde co upravit

Všechny texty jsou v obyčejných textových souborech. Programovat nemusíte.

| Co chcete změnit | Soubor |
|---|---|
| Název SVJ, adresa, IČO, e-mail, účet, havarijní telefon | `src/nastaveni.ts` |
| Aktuality | složka `src/content/aktuality/` (jeden soubor = jedna aktualita) |
| Členové výboru | `src/content/vybor.yaml` |
| Další kontakty (správce, havárie, výtah…) | `src/content/kontakty.yaml` |
| Seznam dokumentů | `src/content/dokumenty.yaml` |
| Samotné soubory ke stažení (PDF…) | složka `public/dokumenty/` |
| Odesílání formuláře závad | `src/nastaveni.ts` → `formularAdresa` |
| Volby „Kde se závada nachází“ | `src/pages/zavady.astro` → seznam `mista` |
| Barvy webu | začátek souboru `src/styles/global.css` |

Každý soubor má na začátku komentář s návodem.

---

## Jak web upravit přímo na GitHubu (nic neinstalujete)

1. Otevřete repozitář na github.com a proklikejte se k souboru (např. `src/content/vybor.yaml`).
2. Vpravo nahoře klikněte na ikonu **tužky** (Edit this file).
3. Text upravte.
4. Klikněte na zelené **Commit changes…** a potvrďte.
5. Za 1–2 minuty se změna sama objeví na webu.

Průběh zveřejnění uvidíte v záložce **Actions**: žlutá tečka znamená, že se web právě
sestavuje, zelená fajfka hotovo, červený křížek chybu (viz [Když se web neaktualizuje](#když-se-web-neaktualizuje)).

### Přidat aktualitu

1. Otevřete složku `src/content/aktuality/` → **Add file** → **Create new file**.
2. Soubor pojmenujte např. `2027-01-15-odstavka-vody.md`. Použijte malá písmena
   bez diakritiky a místo mezer pomlčky. Na konci musí být `.md`.
3. Zkopírujte obsah souboru `_sablona.md` ze stejné složky a přepište ho:

```markdown
---
nadpis: "Upozornění: odstávka vody"
datum: 2027-01-15
perex: Krátké shrnutí, které se ukáže na úvodní stránce.
dulezite: true
---

Text aktuality. Odstavce oddělte prázdným řádkem.
```

- `datum` pište ve tvaru **rok-měsíc-den**. Aktuality se řadí od nejnovější.
- `dulezite: true` přidá oranžový štítek „Důležité“. Pokud ho nechcete, řádek smažte.
- Na úvodní stránce se zobrazí 6 nejnovějších aktualit, ostatní najdete v jejich přehledu.

**Smazání aktuality:** otevřete její soubor → menu **…** vpravo nahoře → **Delete file**.

### Formátování textu (Markdown)

| Napíšete | Na webu |
|---|---|
| `**tučně**` | **tučně** |
| `*kurzíva*` | *kurzíva* |
| `- položka` | odrážka v seznamu |
| `## Mezititulek` | mezititulek |
| `[text odkazu](https://www.example.cz)` | odkaz na jiný web |
| `[hlášení závad](../../zavady/)` | odkaz na stránku tohoto webu |
| `[stanovy](../../dokumenty/stanovy.pdf)` | odkaz na dokument |

### Upravit výbor nebo kontakty

Otevřete `src/content/vybor.yaml` nebo `src/content/kontakty.yaml`. Každá osoba nebo kontakt
začíná pomlčkou, ostatní řádky jsou odsazené **dvěma mezerami**:

```yaml
- jmeno: Jan Novák
  funkce: Předseda výboru
  email: predseda@svj-lipova.cz
  telefon: +420 601 111 222
```

Na webu se zobrazí ve stejném pořadí jako v souboru. Nepovinné řádky (e-mail, telefon,
poznámka…) můžete smazat.

### Přidat dokument

1. Otevřete složku `public/dokumenty/` → **Add file** → **Upload files** a nahrajte soubor.
   Název souboru pište bez diakritiky a mezer, např. `zapis-shromazdeni-2027.pdf`.
2. Do `src/content/dokumenty.yaml` přidejte záznam:

```yaml
- nazev: Zápis ze shromáždění vlastníků 2027
  soubor: zapis-shromazdeni-2027.pdf
  kategorie: Shromáždění vlastníků
  datum: 2027-05-20
```

Dokumenty se na webu seskupí podle `kategorie`. Novou kategorii vytvoříte tak, že ji
prostě napíšete.

Ukázkové PDF ve složce `public/dokumenty/` nahraďte skutečnými dokumenty, nebo je smažte
i se záznamy v `dokumenty.yaml`.

**Pozor:** dokumenty na webu může stáhnout kdokoli. Nezveřejňujte nic s osobními údaji
(seznamy vlastníků, telefony, dlužníky…), pokud k tomu nemáte souhlas.

### Pravidla pro soubory `.yaml`

- Odsazujte **mezerami**, ne tabulátorem.
- Obsahuje-li text dvojtečku s mezerou (`: `) nebo znak `#`, dejte ho do uvozovek:
  `popis: "Úklid: úterý a pátek"`.

---

## Formulář pro hlášení závad

GitHub Pages umí zobrazovat jen hotové stránky a e-maily sám neodešle. Proto má formulář
dva režimy:

- **Bez nastavení (výchozí):** po vyplnění se otevře e-mailový program návštěvníka
  s připravenou zprávou na e-mail výboru. Funguje hned, ale návštěvník musí zprávu
  sám odeslat.
- **Se službou Formspree (doporučeno):** hlášení přijde výboru e-mailem rovnou
  po kliknutí na „Odeslat“.
  1. Zaregistrujte se na [formspree.io](https://formspree.io) e-mailem výboru.
     Bezplatný tarif stačí pro desítky hlášení měsíčně.
  2. Vytvořte nový formulář (New form) a zkopírujte jeho adresu,
     např. `https://formspree.io/f/abcdwxyz`.
  3. V `src/nastaveni.ts` ji vložte do `formularAdresa`:
     `export const formularAdresa = 'https://formspree.io/f/abcdwxyz';`
  4. Uložte změnu a po zveřejnění odešlete zkušební hlášení. Ověřte, že dorazilo
     (zkontrolujte i složku se spamem).

---

## První zveřejnění webu (jen jednou)

1. Na GitHubu otevřete **Settings** → **Pages**.
2. U **Source** vyberte **GitHub Actions**.
3. Změny musí být ve větvi `main`. Web se zveřejní automaticky po každé změně v `main`
   (spustit ručně ho můžete v **Actions** → **Zveřejnit web** → **Run workflow**).

### Vlastní doména (nepovinné)

Chcete-li adresu typu `www.svj-lipova.cz`:

1. V `astro.config.mjs` nastavte `site: 'https://www.svj-lipova.cz'` a `base: '/'`.
2. V **Settings** → **Pages** → **Custom domain** zadejte doménu a u svého registrátora
   domény nastavte DNS podle [návodu GitHubu](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) (anglicky).

---

## Když se web neaktualizuje

Otevřete záložku **Actions** a klikněte na poslední běh s červeným křížkem, pak na krok
**build**. V popisu chyby najdete soubor a řádek, kde je problém. Nejčastější příčiny:

- chybí odsazení nebo je použit tabulátor v souboru `.yaml`,
- text s dvojtečkou není v uvozovkách,
- datum není ve tvaru `2027-01-15`,
- dokument uvedený v `dokumenty.yaml` není nahraný ve `public/dokumenty/` (chyba to napíše česky).

Dokud chybu neopravíte, zůstává na webu poslední funkční verze. Nic se nerozbije.

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
public/            soubory, které se zkopírují beze změny (dokumenty, ikona)
src/
  nastaveni.ts     základní údaje o SVJ a adresa formuláře
  content/         obsah: aktuality, výbor, kontakty, dokumenty
  pages/           jednotlivé stránky webu
  layouts/         společná hlavička, menu a patička
  styles/          vzhled (CSS)
.github/workflows/ automatické zveřejnění na GitHub Pages
```
