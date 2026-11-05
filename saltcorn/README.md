# Klientská sekce SVJ (Saltcorn)

Neveřejná část webu pro vlastníky, nájemníky, správce a výbor. Běží na
[Saltcornu](https://saltcorn.com) a instaluje se ze souboru
[`svj-klientska-sekce.json`](svj-klientska-sekce.json) (tzv. balíček / pack).
Ověřeno na Saltcornu 1.6.4 a 1.7.0-beta.3 (hostovaná verze na saltcorn.com).

Co umí:

- **Oznámení** pro všechny přihlášené.
- **Neveřejné dokumenty SVJ** pro vlastníky a **interní dokumenty výboru**.
- **Evidenci jednotek a vlastníků**. Vlastník vidí jen svou jednotku a sám si upraví kontakt.
- **Schvalování faktur výborem**. Faktura se schválí, až ji schválí aspoň dva různí členové
  výboru. Pak se sama přesune mezi schválené a odešle e-mailem s PDF v příloze.
- **Příspěvky a události pro veřejný web**. Výbor je píše tady a na webu SVJ se ukážou hned.

---

## Role a oprávnění

| | Nájemník | Vlastník | Správce | Výbor | Admin |
|---|---|---|---|---|---|
| Oznámení | číst | číst | číst | psát a mazat | vše |
| Dokumenty SVJ | – | číst a stahovat | nahrávat a mazat | nahrávat a mazat | vše |
| Interní dokumenty výboru | – | – | – | nahrávat a mazat | vše |
| Evidence jednotek a vlastníků | – | jen svoje (kontakt může upravit) | spravovat | spravovat | vše |
| Faktury | – | – | – | nahrávat a schvalovat | vše |
| Příspěvky a události na web | – | – | – | psát a mazat | vše |
| Uživatelské účty | svůj | svůj | svůj | svůj | zakládat a spravovat |

V Saltcornu se role jmenují `najemnik`, `vlastnik`, `spravce`, `vybor` a `admin`.

- Účet s rolí `user` (bez přidělené role) nevidí nic. Uživatel dostane jen informaci, ať se ozve výboru.
- Roli `staff` nepoužívejte.
- **Admin se při schvalování faktur počítá jako člen výboru.** Účet admina proto dávejte jen
  členovi výboru.

---

## Příspěvky a události na veřejném webu

**Výbor → Příspěvky na web → Nový příspěvek nebo událost**:

- **Aktualita**: nadpis, krátké shrnutí a celý text. Na webu se ukáže na úvodní stránce
  v části *Aktuality*. Celý text si návštěvník rozbalí tlačítkem „Celý text“.
- **Událost**: navíc datum, čas (např. `18:00`) a místo. Na webu se ukáže v části
  *Plánované události*. Po jejím dni se sama přesune mezi *Proběhlé události*.
- **Důležité** příspěvek na webu zvýrazní.
- **Koncept** se na webu neukáže, dokud zaškrtnutí nezrušíte. Hodí se pro rozepsané texty.
- V textu oddělte odstavce prázdným řádkem. Webové adresy (`https://…`) se samy změní v odkazy.

Uložený příspěvek je na webu vidět hned. Stačí stránku webu obnovit, nic dalšího se
zveřejňovat nemusí. Smazáním příspěvku z přehledu zmizí i z webu.

---

## Schvalování faktur

1. Člen výboru nahraje fakturu: **Výbor → Nahrát fakturu** (dodavatel, částka, splatnost, PDF).
2. Faktura se objeví ve **Výbor → Faktury ke schválení**. Každý člen ji otevře tlačítkem
   **Rozhodnout**, prohlédne si PDF a zvolí **Schvaluji**, nebo **Zamítám** (s důvodem).
3. Jakmile fakturu schválí potřebný počet **různých** členů výboru (nejméně 2):
   - stav se změní na **Schváleno** a faktura se přesune do **Schválené faktury**,
   - automaticky odejde e-mail s PDF v příloze na adresu z **Nastavení schvalování**,
   - u faktury se uloží, kdo a kdy schválil a kdy a kam se poslala.
4. Stačí jedno zamítnutí a faktura je **Zamítnutá**. Nic se neposílá a zůstává v přehledu
   **Zamítnuté faktury**.

Pojistky (všechny jsou ověřené automatickými testy, i proti pokusům obejít formuláře):

- Každý člen rozhoduje **jen svým jménem a jen jednou**. Nelze schválit za kolegu ani dvakrát.
- O fakturách rozhodují jen členové výboru se **zapnutým dvoufaktorovým ověřováním**.
- Stav „Schváleno“ nastavuje jen systém. Ručně ho nastavit nejde.
- Po prvním rozhodnutí už fakturu nikdo nezmění (nevymění PDF ani částku). Rozhodnutou fakturu
  ani rozhodnutí nelze smazat. Smí to jen admin.
- Přijímá se jen PDF.
- Když e-mail napoprvé neodejde (třeba kvůli chybnému nastavení e-mailu), použijte v detailu faktury
  tlačítko **Odeslat e-mail znovu**.

---

## Instalace na saltcorn.com (jednou, asi 20 minut)

Níže `https://vase-aplikace.saltcorn.com` nahraďte adresou své aplikace.

1. **Založte aplikaci.** Na saltcorn.com si vytvořte novou, prázdnou aplikaci a přihlaste se do ní
   jako admin. Do aplikace, kterou už používáte, balíček neinstalujte, protože by se přepsaly
   role s čísly 20, 30, 60 a 70.
2. **Nainstalujte balíček.** Otevřete `https://vase-aplikace.saltcorn.com/packs/install`.
   Do pole vložte celý obsah souboru `svj-klientska-sekce.json`. Na GitHubu soubor otevřete,
   klikněte na **Raw** a zkopírujte vše (Ctrl+A, Ctrl+C). Potvrďte tlačítkem **Instalovat**.
3. **Spusťte počáteční nastavení** (lze kdykoli zopakovat, vrátí menu do výchozího stavu klientské sekce). Otevřete `https://vase-aplikace.saltcorn.com/actions`,
   u triggeru `pocatecni_nastaveni` klikněte na **Testovací běh**. Nastaví se tím:
   - menu a domovské stránky podle rolí,
   - vypnutá veřejná registrace (účty jen na pozvánku),
   - dvoufaktorové ověřování pro admina, výbor a správce,
   - čeština.
4. **Nastavte e-mail.** Otevřete `https://vase-aplikace.saltcorn.com/admin/email` a vyplňte
   odesílací (SMTP) server od svého poskytovatele e-mailu. U Seznamu je to například
   `smtp.seznam.cz`, port 465, jméno je celá e-mailová adresa. Pak klikněte na
   **Odeslat testovací e-mail**. Bez tohoto kroku nepůjdou pozvánky ani faktury.
5. **Zapněte si dvoufaktorové ověřování.** V menu **Uživatel → Nastavení uživatele →
   Dvoufaktorové ověřování** naskenujte QR kód aplikací v telefonu (Google Authenticator,
   Microsoft Authenticator apod.).
6. **Vyplňte nastavení schvalování.** V menu **Výbor → Nastavení schvalování** klikněte na
   **Vyplnit nastavení**. Zadejte e-mail, kam se mají schválené faktury posílat (třeba účetní),
   a počet potřebných schválení (nejméně 2).
7. **Pozvěte uživatele** (viz níže) a **vyplňte evidenci**.
8. **Propojte veřejný web.** V souboru `src/nastaveni.ts` vyplňte
   `klientskaSekce: 'https://vase-aplikace.saltcorn.com'`. Na webu se pak objeví tlačítko
   **Klientská sekce**.

---

## Pozvání uživatelů

**Nastavení → Uživatelé a zabezpečení → Uživatelé → Vytvořit uživatele**
(`https://vase-aplikace.saltcorn.com/useradmin/new`):

1. Vyplňte e-mail, **Jméno a příjmení** a roli (`vybor`, `spravce`, `vlastnik`, `najemnik`).
2. Zaškrtněte **Nastavit náhodné heslo** a **Odeslat e-mail pro resetování hesla**.
   Uživateli přijde e-mail s odkazem, kde si nastaví vlastní heslo.
3. U **vlastníka** ještě otevřete **Evidence → Vlastníci**, u jeho záznamu klikněte na
   **Upravit** a v poli **Účet v portálu** vyberte jeho účet. Teprve pak uvidí svou jednotku.

Když člen výboru skončí nebo vlastník prodá byt, změňte mu roli, případně účet zakažte nebo
smažte. U vlastníka upravte i evidenci.

---

## Evidence jednotek a vlastníků

- **Evidence → Jednotky → Přidat jednotku**: číslo, typ, podlaží, plocha, podíl na
  společných částech, počet osob.
- **Evidence → Vlastníci → Přidat vlastníka**: jméno, kontakty, případně účet v portálu.
- Vlastníka k jednotce přiřadíte v **detailu jednotky → Přidat vlastníka k jednotce**
  (podíl na jednotce: 1/1, 1/2, SJM…). Spoluvlastníků může mít jednotka víc.
- Vlastník v **Moje jednotka** vidí jen své jednotky a kontakt. Upravit si může e-mail,
  telefon a doručovací adresu. Ostatní údaje mění jen správce a výbor.

---

## Dokumenty a oznámení

- **Evidence → Správa dokumentů SVJ**: vidí je všichni vlastníci (nájemníci ne).
- **Výbor → Interní dokumenty**: vidí jen výbor.
- **Výbor → Správa oznámení**: oznámení vidí všichni přihlášení včetně nájemníků.
- Soubory jsou chráněné. Odkaz na soubor nefunguje nepřihlášeným ani rolím bez oprávnění.

---

## Bezpečnost

Už je nastaveno:

- Veřejná registrace je vypnutá a účty zakládá jen admin.
- Každá role vidí jen to, co má. Ověřeno i proti přímým dotazům přes API Saltcornu.
- Vlastník má k evidenci přístup jen pro čtení (kromě vlastního kontaktu).
- Admin, výbor a správce jsou po přihlášení vyzváni k nastavení dvoufaktorového ověřování.

Pohlídejte si:

- **Dvoufaktorové ověřování u výboru a správce.** Saltcorn ho při přihlášení vyžádá, ale výzvu
  jde přeskočit. Schvalování faktur ho proto vyžaduje sám, u ostatních funkcí dohlédněte,
  aby si ho všichni zapnuli.
- **Zálohy.** Jednou měsíčně si stáhněte zálohu: **Nastavení → O aplikaci → Záloha → Stáhnout zálohu**.
- **Osobní údaje (GDPR).** Evidence obsahuje osobní údaje vlastníků a SVJ je jejich správcem.
  Ověřte si u provozovatele saltcorn.com podmínky zpracování a kde jsou data uložena.
  Do dokumentů pro vlastníky nedávejte osobní údaje jiných lidí bez právního důvodu.

---

## Úpravy

Živá aplikace se od instalace upravuje přímo v administraci Saltcornu. Soubor
`svj-klientska-sekce.json` slouží jen pro novou instalaci.

- **Menu**: `https://vase-aplikace.saltcorn.com/menu`.
- **Kategorie dokumentů a typy jednotek**: Nastavení → Tabulky → `dokumenty` (pole
  *kategorie*), případně `jednotky` (pole *typ*) → upravit možnosti.
- **Texty stránek**: Nastavení → Stránky (úvod, nápovědy).
- Před většími úpravami si stáhněte zálohu.

Jak aplikaci sestavit znovu a otestovat na vlastním počítači, popisuje
[vyvoj/README.md](vyvoj/README.md).
