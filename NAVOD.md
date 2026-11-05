# Návod pro začátečníky: jak spravovat web SVJ

Tento návod je pro každého, kdo bude web SVJ upravovat, i bez zkušeností s programováním.
Všechno se dá udělat v prohlížeči, nic nemusíte instalovat.

**Obsah**

1. [Jak to celé funguje](#1-jak-to-celé-funguje)
2. [Úprava webu na GitHubu krok za krokem](#2-úprava-webu-na-githubu-krok-za-krokem)
3. [Co kde najdete](#3-co-kde-najdete)
4. [Aktuality a události](#4-aktuality-a-události)
5. [Texty na stránkách a nové stránky](#5-texty-na-stránkách-a-nové-stránky)
6. [Výbor, kontakty a dokumenty](#6-výbor-kontakty-a-dokumenty)
7. [Formulář pro hlášení závad](#7-formulář-pro-hlášení-závad)
8. [Uvedení do ostrého provozu](#8-uvedení-do-ostrého-provozu)
9. [Když se něco pokazí](#9-když-se-něco-pokazí)

---

## 1. Jak to celé funguje

Web SVJ má dvě části:

| Část | Adresa | Kdo ji vidí | Kde se upravuje |
|---|---|---|---|
| **Veřejný web** | https://laadic.github.io/SVJ/ | každý | soubory na GitHubu (tento návod) |
| **Klientská sekce** | https://svjlipova.saltcorn.com | jen přihlášení | přímo v ní ([návod](saltcorn/README.md)) |

Veřejný web funguje takto:

1. Všechny texty webu jsou v **souborech** uložených na GitHubu v **repozitáři** `laadic/SVJ`.
2. Když soubor upravíte a uložíte, spustí se automat **GitHub Actions**. Z vašich souborů
   pomocí nástroje **Astro** sestaví hotové webové stránky.
3. **GitHub Pages** stránky zveřejní. Celé to trvá 1–2 minuty.

Aktuality a události může výbor psát i v klientské sekci a na webu se ukážou hned
(viz [kapitola 4](#4-aktuality-a-události)).

### Slovníček

| Slovo | Co znamená |
|---|---|
| **GitHub** | Služba, kde jsou uložené soubory webu. Přihlašujete se svým účtem. |
| **Repozitář** | „Složka projektu“ na GitHubu. Náš se jmenuje `laadic/SVJ`. |
| **Commit** | Uložení změny. Každý commit má krátký popis, co se změnilo. |
| **Větev (branch)** | Samostatná verze souborů. Na webu je vždy větev **`main`**. |
| **Pull request** | Žádost o převzetí změn z jiné větve do `main`. Potvrzuje se tlačítkem **Merge**. |
| **Actions** | Záložka na GitHubu, kde vidíte, jestli se web právě sestavuje, sestavil, nebo selhal. |
| **Markdown** (`.md`) | Jednoduchý zápis textu: `**tučně**`, `- odrážka`, `## nadpis`. |
| **YAML** (`.yaml`) | Seznamy údajů (výbor, kontakty, dokumenty). Záleží v nich na odsazení. |
| **Astro** (`.astro`) | Soubory se stránkami webu. Obsahují text i značky (HTML). |

---

## 2. Úprava webu na GitHubu krok za krokem

### Upravit soubor

1. Otevřete https://github.com/laadic/SVJ a přihlaste se.
2. Proklikejte se ke **složce** a **souboru**, třeba `src` → `content` → `vybor.yaml`.
3. Vpravo nad obsahem souboru klikněte na ikonu **tužky** (*Edit this file*).
4. Text upravte.
5. Klikněte na zelené **Commit changes…**.
6. Do pole *Commit message* napište krátce, co jste změnili, třeba „Nový telefon předsedy“.
7. Nechte vybrané **Commit directly to the `main` branch** a klikněte na **Commit changes**.

Za 1–2 minuty je změna na webu. Pokud ji nevidíte, obnovte stránku (F5, v mobilu stáhnout dolů).

### Přidat nový soubor

Otevřete složku, kam soubor patří, a vpravo nahoře klikněte na **Add file**:

- **Create new file**: napíšete nový textový soubor (aktualitu, stránku…). Název souboru
  zadáte do pole nahoře.
- **Upload files**: nahrajete hotový soubor z počítače (PDF dokument).

Pak opět **Commit changes**.

### Smazat soubor

Otevřete soubor, vpravo nahoře klikněte na **…** (tři tečky) → **Delete file** → **Commit changes**.

### Zkontrolovat, že je změna na webu

Na GitHubu otevřete záložku **Actions**. Úplně nahoře je poslední běh **Zveřejnit web**:

| Značka | Význam |
|---|---|
| 🟡 žlutá tečka | web se právě sestavuje, počkejte |
| ✅ zelená fajfka | hotovo, změna je na webu |
| ❌ červený křížek | chyba, změna na web nešla (viz [kapitola 9](#9-když-se-něco-pokazí)) |

### Vrátit změnu zpět

1. Otevřete soubor a vpravo nahoře klikněte na **History**.
2. Najděte verzi před chybnou změnou a klikněte na ni.
3. Otevřete u ní soubor (**View file** v menu **…**) a zkopírujte jeho obsah.
4. Vložte ho do souboru přes tužku (viz výše) a uložte.

---

## 3. Co kde najdete

| Co chcete změnit | Kde |
|---|---|
| Název SVJ, adresa, IČO, e-mail, účet, havarijní telefon | `src/nastaveni.ts` |
| Aktuality a události | klientská sekce → **Výbor → Příspěvky na web**, nebo složka `src/content/aktuality/` |
| Členové výboru | `src/content/vybor.yaml` |
| Další kontakty (správce, havárie, výtah…) | `src/content/kontakty.yaml` |
| Seznam dokumentů ke stažení | `src/content/dokumenty.yaml` |
| Samotné soubory ke stažení (PDF…) | složka `public/dokumenty/` |
| Texty na stránkách | `src/pages/` (např. `index.astro` je úvodní stránka) |
| Menu a patička | `src/layouts/Layout.astro` |
| Barvy | začátek souboru `src/styles/global.css` |
| Odesílání formuláře závad | `src/nastaveni.ts` → `formularAdresa` |
| Volby „Kde se závada nachází“ | `src/pages/zavady.astro` → seznam `mista` |
| Adresa klientské sekce (tlačítko v menu) | `src/nastaveni.ts` → `klientskaSekce` |

Většina souborů má na začátku komentář s nápovědou (řádky začínající `//` nebo `#`).

---

## 4. Aktuality a události

### Doporučeno: v klientské sekci

Tohle je nejjednodušší cesta. Nepotřebujete GitHub a příspěvek je na webu hned.

1. Přihlaste se na https://svjlipova.saltcorn.com (jako člen výboru).
2. **Výbor → Příspěvky na web → Nový příspěvek nebo událost**.
3. Zvolte **Aktualita**, nebo **Událost**, vyplňte nadpis, krátké shrnutí a celý text.
   U události vyplňte i datum, čas (např. `18:00`) a místo.
4. **Uložit**. Na webu je příspěvek vidět hned po obnovení stránky.

Kde se příspěvky ukážou:

- **Aktuality** jsou na úvodní stránce. Nahoře je nejnovější a vidět je posledních 6.
  Starší jsou v přehledu **Aktuality a události**.
- **Události** jsou na úvodní stránce v části **Plánované události**. Po dni konání se samy
  přesunou mezi **Proběhlé události** v přehledu.
- Zaškrtnutím **Důležité** příspěvek zvýrazníte. Zaškrtnutý **Koncept** se na webu neukáže,
  dokud zaškrtnutí nezrušíte.

Podrobnosti najdete v [návodu ke klientské sekci](saltcorn/README.md#příspěvky-a-události-na-veřejném-webu).

### Jinak: jako soubor na GitHubu

Aktualita ze souboru má na webu i vlastní stránku s adresou, kterou lze poslat dál.

1. Otevřete složku `src/content/aktuality/` → **Add file** → **Create new file**.
2. Soubor pojmenujte třeba `2027-01-15-odstavka-vody.md`. Používejte malá písmena bez
   diakritiky, místo mezer pomlčky a na konci `.md`.
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

- `datum` pište ve tvaru **rok-měsíc-den**.
- Obsahuje-li nadpis nebo shrnutí dvojtečku, dejte ho do uvozovek (jako v ukázce).
- `dulezite: true` přidá štítek „Důležité“. Pokud ho nechcete, řádek smažte.

### Formátování textu (Markdown)

| Napíšete | Na webu |
|---|---|
| `**tučně**` | **tučně** |
| `*kurzíva*` | *kurzíva* |
| `- položka` | odrážka v seznamu |
| `## Mezititulek` | mezititulek |
| `[text odkazu](https://www.example.cz)` | odkaz na jiný web |
| `[hlášení závad](../../zavady/)` | odkaz na stránku tohoto webu (z aktuality) |
| `[stanovy](../../dokumenty/stanovy.pdf)` | odkaz na dokument (z aktuality) |

---

## 5. Texty na stránkách a nové stránky

### Upravit text na existující stránce

Stránky jsou ve složce `src/pages/`:

| Soubor | Stránka |
|---|---|
| `index.astro` | Úvod (uvítání, havarijní telefon, události, aktuality) |
| `vybor.astro` | Výbor a kontakty (úvodní text; osoby jsou v `vybor.yaml`) |
| `dokumenty.astro` | Dokumenty ke stažení (úvodní text; seznam je v `dokumenty.yaml`) |
| `zavady.astro` | Hlášení závad (texty a formulář) |
| `aktuality/index.astro` | Přehled aktualit a událostí |
| `404.astro` | Stránka „nenalezeno“ |

Soubor `.astro` má dvě části (zjednodušená ukázka, šipky v souboru nejsou):

```astro
---
import Layout from '../layouts/Layout.astro';    ← horní část mezi čarami ---
const POCET_AKTUALIT = 6;                         ← nastavení stránky, raději neměnit
---

<Layout titulek="Úvod">                           ← spodní část: obsah stránky
  <h1>Vítejte na webu {svj.kratkyNazev}</h1>      ← text můžete změnit
  <p>Aktuální informace z domu…</p>               ← text můžete změnit
</Layout>
```

**Pravidla, aby se nic nerozbilo:**

- Měňte jen **text** mezi značkami, třeba mezi `<p>` a `</p>` nebo `<h1>` a `</h1>`.
- Značky `<…>` nemažte, ani ty, které stránku zavírají (`</…>`).
- `{svj.kratkyNazev}` ve složených závorkách se nahradí údajem z `src/nastaveni.ts`. Nechte ho,
  nebo celé `{…}` nahraďte obyčejným textem.
- Text v uvozovkách za `titulek=` je název stránky v záložce prohlížeče.

**Příklad:** na úvodní stránce chcete jiné uvítání. Otevřete `src/pages/index.astro`, najděte
řádek `<p>Aktuální informace z domu, kontakty na výbor…</p>`, přepište text mezi `<p>`
a `</p>` a uložte.

### Přidat novou stránku (např. „Historie domu“)

Nové textové stránky se píšou v Markdownu, stejně jako aktuality:

1. Otevřete složku `src/pages/` → **Add file** → **Create new file**.
2. Soubor pojmenujte `historie.md`. Název souboru bude i adresou stránky:
   `https://laadic.github.io/SVJ/historie/`.
3. Vložte a upravte:

```markdown
---
layout: ../layouts/TextovaStranka.astro
titulek: Historie domu
---

Dům byl postaven v roce **1932**.

## Rekonstrukce

- 2015: zateplení fasády
- 2026: nová střecha
```

4. **Commit changes**. Stránka je za chvíli na webu, zatím ale není v menu.

### Přidat stránku do menu

1. Otevřete `src/layouts/Layout.astro` a najděte seznam `menu`:

```js
const menu = [
  { text: 'Úvod', href: url('') },
  { text: 'Výbor a kontakty', href: url('vybor/') },
  { text: 'Dokumenty', href: url('dokumenty/') },
  { text: 'Hlášení závad', href: url('zavady/') },
];
```

2. Před řádek `];` přidejte nový řádek a dodržte čárku na konci:

```js
  { text: 'Historie domu', href: url('historie/') },
```

3. **Commit changes**. Do menu se vejde zhruba 6 položek. Na mobilu se menu skládá samo.

### Patička a barvy

- **Patička** (dole na každé stránce) je na konci souboru `src/layouts/Layout.astro`, mezi
  `<footer` a `</footer>`. Údaje v ní se berou ze `src/nastaveni.ts`.
- **Barvy** jsou na začátku souboru `src/styles/global.css`, např.
  `--barva-hlavni: #0f766e;`. Barvu zadáte kódem (třeba `#1d4ed8` pro modrou). Kód barvy
  najdete, když vyhledáte „výběr barvy“.

---

## 6. Výbor, kontakty a dokumenty

### Výbor a kontakty

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

### Dokumenty ke stažení

1. Otevřete složku `public/dokumenty/` → **Add file** → **Upload files** a nahrajte soubor.
   Název souboru pište bez diakritiky a mezer, např. `zapis-shromazdeni-2027.pdf`.
2. Do `src/content/dokumenty.yaml` přidejte záznam:

```yaml
- nazev: Zápis ze shromáždění vlastníků 2027
  soubor: zapis-shromazdeni-2027.pdf
  kategorie: Shromáždění vlastníků
  datum: 2027-05-20
```

Dokumenty se na webu seskupí podle `kategorie`. Novou kategorii vytvoříte tak, že ji prostě
napíšete.

**Pozor:** dokumenty na veřejném webu si může stáhnout kdokoli. Neveřejné dokumenty (smlouvy,
vyúčtování, seznamy vlastníků) patří do klientské sekce: **Evidence → Správa dokumentů SVJ**.

### Pravidla pro soubory `.yaml`

- Odsazujte **mezerami**, ne tabulátorem.
- Obsahuje-li text dvojtečku s mezerou (`: `) nebo znak `#`, dejte ho do uvozovek:
  `popis: "Úklid: úterý a pátek"`.
- Datum pište jako `2027-05-20`.

---

## 7. Formulář pro hlášení závad

GitHub Pages umí jen zobrazovat stránky, e-maily sám neodešle. Formulář proto má dva režimy:

- **Bez nastavení (teď):** po vyplnění se návštěvníkovi otevře jeho e-mailový program
  s připravenou zprávou pro výbor. Návštěvník ji musí sám odeslat.
- **Se službou Formspree (doporučeno):** hlášení přijde výboru e-mailem hned po kliknutí
  na „Odeslat“.
  1. Zaregistrujte se na [formspree.io](https://formspree.io) e-mailem výboru.
  2. Vytvořte nový formulář (*New form*) a zkopírujte jeho adresu,
     např. `https://formspree.io/f/abcdwxyz`.
  3. V `src/nastaveni.ts` ji vložte do `formularAdresa`:
     `export const formularAdresa = 'https://formspree.io/f/abcdwxyz';`
  4. Uložte a po zveřejnění pošlete zkušební hlášení. Zkontrolujte i složku se spamem.

---

## 8. Uvedení do ostrého provozu

Web teď obsahuje **ukázkové údaje** (SVJ Lipová 123, vymyšlená jména a telefony, ukázková PDF).
Než ho oznámíte vlastníkům, projděte tento seznam.

### Veřejný web

- [ ] **Sloučit čekající změny.** Na GitHubu otevřete **Pull requests**. Pokud tam něco čeká,
      otevřete to a klikněte na **Merge pull request** → **Confirm merge**.
- [ ] **Základní údaje.** V `src/nastaveni.ts` doplňte skutečný název, adresu, IČO, e-mail,
      bankovní účet a havarijní telefon.
- [ ] **Výbor a kontakty.** Přepište `src/content/vybor.yaml` a `src/content/kontakty.yaml`.
- [ ] **Dokumenty.** Smažte ukázková PDF ve `public/dokumenty/`, nahrajte skutečná a upravte
      `src/content/dokumenty.yaml`.
- [ ] **Ukázkové aktuality.** Ve `src/content/aktuality/` smažte tři ukázkové soubory
      (`2026-…md`). Soubor `_sablona.md` nechte.
- [ ] **Formulář závad.** Nastavte Formspree (kapitola 7) a pošlete zkušební hlášení.
- [ ] **Kontrola.** Projděte všechny stránky na počítači i v mobilu a zkuste stáhnout dokument.
- [ ] *(Nepovinné)* **Vlastní doména**, např. `www.svj-lipova.cz`. V `astro.config.mjs`
      nastavte `site: 'https://www.svj-lipova.cz'` a `base: '/'`. Na GitHubu v **Settings →
      Pages → Custom domain** zadejte doménu a u registrátora domény nastavte DNS podle
      [návodu GitHubu](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

### Klientská sekce

Podrobnosti jsou v [návodu ke klientské sekci](saltcorn/README.md).

- [ ] **Heslo a dvoufaktorové ověřování** admina: **Uživatel → Nastavení uživatele**.
- [ ] **Odesílání e-mailů** (`/admin/email`) a odeslání testovacího e-mailu.
- [ ] **Nastavení schvalování**: kam posílat schválené faktury (**Výbor → Nastavení schvalování**).
- [ ] **Pozvat členy výboru a správce**, každý si zapne dvoufaktorové ověřování.
- [ ] **Zkušební faktura**: dva členové výboru ji schválí a ověří se, že e-mail dorazil.
- [ ] **Evidence**: jednotky, vlastníci a jejich propojení s účty.
- [ ] **Pozvat vlastníky a nájemníky.**
- [ ] **První příspěvek** na web (**Výbor → Příspěvky na web**).

### Oznámení vlastníkům

Napište vlastníkům adresu webu a že do klientské sekce jim přijde pozvánka e-mailem. Hodí se
připomenout, že výbor nikdy nebude chtít heslo e-mailem ani telefonem.

### Pravidelná údržba

- **Jednou měsíčně** si stáhněte zálohu klientské sekce (**Nastavení → O aplikaci → Záloha → Stáhnout zálohu**).
- Aktualizujte kontakty a dokumenty, když se změní (nový výbor, nový správce, zápis ze shromáždění).
- Občas otevřete záložku **Actions** a zkontrolujte, že poslední běhy mají zelenou fajfku.

---

## 9. Když se něco pokazí

### Web se po úpravě nezměnil

1. Počkejte 2 minuty a obnovte stránku.
2. Na GitHubu otevřete **Actions**. Je u posledního běhu **❌ červený křížek**? Klikněte na něj,
   pak na **build**. V červeném textu bývá název souboru a řádek s chybou.
3. Nejčastější příčiny:
   - v souboru `.yaml` chybí odsazení nebo je místo mezer tabulátor,
   - text s dvojtečkou není v uvozovkách,
   - datum není ve tvaru `2027-01-15`,
   - v `.astro` souboru se omylem smazala značka `<…>` nebo složená závorka `{` `}`,
   - dokument uvedený v `dokumenty.yaml` není nahraný ve `public/dokumenty/` (chyba to napíše česky).
4. Opravte soubor, nebo změnu vraťte (viz [Vrátit změnu zpět](#vrátit-změnu-zpět)).

Dokud chybu neopravíte, zůstává na webu poslední funkční verze. Pokažený soubor web nerozbije.

### Na webu nejsou příspěvky z klientské sekce

- Je příspěvek uložený bez zaškrtnutého **Koncept**?
- Obnovte stránku webu.
- Když je klientská sekce dočasně nedostupná, web ukáže příspěvky z doby svého posledního
  sestavení. Jakmile klientská sekce zase funguje, ukáže se vše aktuální.

### Nevím si rady

Napište, co jste upravovali a co se stalo. Pomůže i snímek obrazovky z **Actions** s červeným
textem chyby.

---

Pro pokročilé (úpravy na vlastním počítači, struktura projektu) je stručný popis v
[README.md](README.md).
