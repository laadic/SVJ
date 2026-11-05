// Skript v prohlížeči: po načtení stránky stáhne aktuální příspěvky z klientské sekce
// a překreslí přehledy událostí a aktualit. Nový příspěvek se tak ukáže hned.
import {
  aktualityZKlientskeSekce,
  kartaAktuality,
  kartaUdalosti,
  nacistPrispevky,
  nadchazejiciUdalosti,
  probehleUdalosti,
} from './prispevky';

export async function obnovitPrispevky(): Promise<void> {
  const zaklad = document.querySelector<HTMLElement>('[data-klientska-sekce]')?.dataset.klientskaSekce;
  if (!zaklad) return;
  const seznam = await nacistPrispevky(zaklad);
  if (!seznam) return; // klientská sekce je nedostupná – necháme obsah ze sestavení webu

  // Události (nadcházející nebo proběhlé)
  for (const box of document.querySelectorAll<HTMLElement>('[data-udalosti]')) {
    const limit = Number(box.dataset.limit) || Infinity;
    const vyber = (box.dataset.udalosti === 'probehle' ? probehleUdalosti(seznam) : nadchazejiciUdalosti(seznam)).slice(0, limit);
    const cil = box.querySelector('.udalosti');
    if (cil) cil.innerHTML = vyber.map((p) => kartaUdalosti(p)).join('');
    box.hidden = vyber.length === 0;
  }

  // Aktuality: ponechat ty ze souborů, vyměnit ty z klientské sekce, seřadit od nejnovější
  for (const box of document.querySelectorAll<HTMLElement>('[data-aktuality]')) {
    const limit = Number(box.dataset.limit) || Infinity;
    const cil = box.querySelector<HTMLElement>('.aktuality');
    if (!cil) continue;
    cil.querySelectorAll('[data-zdroj="klientska-sekce"]').forEach((e) => e.remove());
    const docasny = document.createElement('div');
    docasny.innerHTML = aktualityZKlientskeSekce(seznam).map((p) => kartaAktuality(p)).join('');
    const karty = [...cil.children, ...docasny.children] as HTMLElement[];
    karty.sort((a, b) => (b.dataset.razeni || '').localeCompare(a.dataset.razeni || ''));
    karty.forEach((karta, i) => {
      karta.hidden = i >= limit;
      cil.appendChild(karta);
    });
    const prazdne = box.querySelector<HTMLElement>('[data-prazdne]');
    if (prazdne) prazdne.hidden = karty.length > 0;
    const vice = box.querySelector<HTMLElement>('[data-vice]');
    if (vice) vice.hidden = karty.length <= limit;
  }
}
