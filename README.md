# Ohana⁶ — ideiglenes UI-műhely

Ez az Ohana felületének különálló, publikus szerkesztői másolata. A cél: Tomi
agentje finomítsa a felületeket, majd a változásokat felülvizsgálatra visszaadja.
**Ez a repó nem települ az éles oldalra.**

Csak a megjelenéshez szükséges HTML, CSS, böngészős JavaScript, képek, betűk és
szintetikus demók szerepelnek itt. Nincs benne az eredeti privát Git-előzmény,
szerveroldali üzleti logika, éles API-kulcs, ügyféladat vagy telepítési hozzáférés.

## Indítás

Node.js 22 vagy újabb szükséges. A helyi előnézethez nem kell fiók vagy API-kulcs,
és nincs telepítendő npm-függőség.

```sh
git clone https://github.com/mcftira/ohana-ui-handoff.git
cd ohana-ui-handoff
npm start
```

Az előnézet csak a saját gépen fut. A pontos címeket a parancs kiírja.
A foglalási adatok és a fizetés szimulációk; ne használj valódi személyes adatot
vagy bankkártyát.

| Helyi előnézet | Cím |
| --- | --- |
| Főoldal | http://127.0.0.1:4173/ |
| Vendégfoglaló | http://127.0.0.1:4173/foglalas/ |
| Booking admin minta | http://127.0.0.1:4173/previews/booking-admin.html |
| CRM munkatér minta | http://127.0.0.1:4173/previews/crm.html |
| CRM belépőminta | http://127.0.0.1:4173/previews/crm-login.html |

Foglalt port esetén: `PORT=4174 npm start`.

A vendégfoglaló felső demósávjában választható sikeres, függőben lévő, ütköző,
hibás vagy nem elérhető állapot. Válassz egy jövőbeli napot és szabad sávot,
majd az adatlépésnél kattints a **Mintaadatok kitöltése** gombra. Az összegzésen
a **Próbafizetés tesztelőknek** részt kinyitva végigjárható a helyi fizetési
szimuláció. Az „Éles siker képernyő” is kizárólag szimuláció.

```sh
npm test
```

## Mit szerkessz?

| Felület | Fájlok |
| --- | --- |
| Főoldal | `website/index.html`, `website/venue.css`, `website/venue.js` |
| Vendégfoglaló | `website/foglalas/index.html`, `booking.css`, `booking.js` |
| Közös színek, tipográfia | `website/tokens.css` |
| Képek | `website/assets/`, `website/og-cover.jpg` |
| Booking admin arculat | `themes/librebooking/` |
| CRM arculat | `themes/crm/` |
| Admin és CRM demók | `previews/` |
| Helyi előnézet és szimuláció | `preview/` |

A főoldal és a vendégfoglaló az alkalmazás valódi felületi forrásából készült.
Az admin és CRM demók **reprezentatív minták**, nem teljes LibreBooking/EspoCRM
telepítések. A natív alkalmazásokban az átemelés előtt külön ellenőrizzük a
megjelenést és a működést. Az előnézeti fájlokat nem másoljuk az éles rendszerbe.

A HTML-ekben régebbi alapstílusok is vannak; az utánuk betöltött CSS-ek adják a
jelenlegi megjelenést. Ellenőrizd a kaszkádot, mielőtt újabb felülírást adsz hozzá.
A `website/booking-mode.js` feliratokat és vezérlőket igazít a kapott állapothoz;
az előnézet ezt kizárólag hamis adatokkal használja.

## Irány Tomi agentjének

- Magyar nyelv, Ohana⁶ név, meleg törtfehér felületek, meglévő házjel és valódi
  teremfotók. Kevés vizuális zaj, világos fő művelet, olvasható szövegek.
- Mobilon is használható, nagy érintési célok, billentyűzetes kezelés,
  jól látható fókusz, kontraszt és csökkentett mozgás támogatása.
- A vendégfoglalás sorrendje: **Dátum és idő → Adatok → Összegzés**.
  A programválasztás az összegzés része.
- Tartsd meg az árakat, négy fix sávot, kapacitásokat, lemondási feltételeket és
  elfogadott házirendet. Üzleti szövegváltoztatást külön javasolj.
- Őrizd meg a JavaScripthez kötött ID-ket, `data-*` attribútumokat, a
  validációt, hibajelzéseket és letiltott állapotokat. Ne rejts el hibákat
  pusztán CSS-sel. Ha szerkezeti módosítás kell, dokumentáld az érintett kötéseket.
- A demó „sikeres fizetés” állapota nem bizonyít éles fizetési működést.
- Ne adj hozzá analitikát, külső integrációt, titkos kulcsot, éles adatot,
  publikus preview-hostingot vagy telepítési workflow-t.

## Visszaadás

1. Forkold ezt a repót, és külön branchen dolgozz.
2. Küldj pull requestet erre a repóra, rövid változáslistával.
3. Mellékelj képeket legalább 390 px mobil- és 1440 px asztali nézetről; legyen
   kép a foglalás három lépéséről és a módosított hiba/üres/sikeres állapotokról.
4. Írd le, mely fájlok változtak, hogyan tesztelted, és van-e olyan elvárás,
   amelyhez szerveroldali változtatás kell.

Ha nem használsz forkot, az induló commit óta készült commitokat patchként is
visszaadhatod:

```sh
git format-patch --stdout "$(git rev-list --max-parents=0 HEAD)..HEAD" > ohana-ui.patch
```

ZIP is elfogadható a megváltozott fájlokkal és változáslistával. Élesítés előtt
mi nézzük át és emeljük át a megfelelő változásokat a privát projektbe.

## Forrás és jogok

A snapshot dátuma: **2026. október 20.** A fájlszintű kiinduló állapotot
`SOURCE-MANIFEST.json` rögzíti. Az éles rendszer közben tovább változhat, ezért
az átemelés mindig diff alapján történik.

Ez ideiglenes együttműködési repó, nem az éles alkalmazás forrásrepója.
A nyilvános elérhetőség nem jelent általános felhasználási engedélyt az Ohana
fotóira, márkajelzésére vagy saját forrásaira. A mellékelt külső komponensekre
és betűkre a mellettük található eredeti licencek érvényesek.
