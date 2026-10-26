# Prüfnachweise zum Vergleich von Philo4all als PDF und Webseite

Dieser Anhang ergänzt den [deutschsprachigen Bericht für die FU](ACCESSIBILITY_REPORT.md). Er dokumentiert die Grundlagen für eine fachliche oder technische Nachprüfung. Die sprachliche Überarbeitung des Berichts fügt keine neuen Testergebnisse hinzu. Sämtliche nachfolgend genannten Prüfungen fanden am **26. Oktober 2026** statt.

## Geprüfte Fassungen

| Merkmal | Original-PDF | Neueste HTML-Fassung |
| --- | --- | --- |
| Herkunft | [PDF auf der FU-Webseite](https://www.geisteswissenschaften.fu-berlin.de/we01/studieren/studienberatung/philo4all/Kopie-von-Philo4all_aktuell_Juli_2025.pdf) | Lokaler Produktionsstand dieses Projekts einschließlich der beibehaltenen Barrierefreiheitskorrekturen |
| Versionsangabe | Titelblatt: Mai 2025; Dateierstellung: 29. Juli 2025 | Geprüfte Fassung einschließlich der dokumentierten Barrierefreiheitskorrekturen; ursprünglicher Ausgangsstand der Überarbeitung: `5640013fc2f635e233b9ea3cc860dccbb042b282` |
| Umfang | Zwölf Seiten, ungefähr 810 × 1440 PDF-Punkte; 10.651.836 Bytes | Ein Dokument mit elf Blättern: Titel, Inhaltsverzeichnis mit Team und neun Kapitel |
| SHA-256-Prüfsumme | `88e7e7b09c330014cc395f71122cd7d71c65c08b3a792faf954f5b9370266b86` | `9ef800c65b12a51f6aab4cb0798b3446045018a00b7c7cdcb96a20ac0b781904` für `dist/client/index.html` |

Prüfsummen kennzeichnen den genauen untersuchten Dateistand. Bei einer geänderten Datei müssen die betroffenen Vergleiche wiederholt werden.

Die [öffentliche Demo](https://philo4all.zavalit.workers.dev/) wurde zuvor einmal in einer Desktopansicht geprüft. Die Ergebnisse zur neuesten HTML-Fassung beziehen sich auf den im Projekt erzeugten und geprüften Stand. Der aktuelle Veröffentlichungsstand der Demo wurde bei dieser sprachlichen Überarbeitung nicht erneut abgeglichen. Die [offizielle FU-Projektseite](https://www.geisteswissenschaften.fu-berlin.de/we01/studieren/studienberatung/philo4all/index.html) diente als Quelle und Kontext; sie selbst wurde nicht auf Barrierefreiheit geprüft.

## Wie die Aussagen eingeordnet werden

- **Nachgewiesenes Problem:** Eine Messung oder eine unmittelbar feststellbare Dokumenteigenschaft belegt den beschriebenen Mangel.
- **Noch zu prüfendes Risiko:** Es gibt einen begründeten Hinweis. Für eine abschließende Bewertung fehlen jedoch weitere Prüfungen.
- **Erfolgreich geprüfte Funktion:** Die genannte Prüfung wurde in der beschriebenen Umgebung bestanden. Daraus folgt keine vollständige Barrierefreiheit des gesamten Angebots.
- **Nicht geprüft:** Daraus wird weder ein Fehler noch ein Vorteil des jeweiligen Formats abgeleitet.

Als Maßstab dienen die [Web Content Accessibility Guidelines, WCAG 2.2](https://www.w3.org/TR/WCAG22/), Stufe AA, soweit anwendbar. Der Bericht ist keine vollständige WCAG-Konformitätsbewertung, keine PDF/UA-Prüfung und keine Zertifizierung.

## Messungen und Befunde

### 1. Kontrast der untersuchten Überschriften

Auf PDF-Seite 7 wurden die Überschriften „WLAN & VPN“ und „Drucken“ untersucht. Die Textfarben wurden aus den Farbanweisungen des PDFs ausgelesen. Der Hintergrund wurde dem entsprechenden grünen Feld auf der gerenderten Seite zugeordnet. In der HTML-Fassung wurden die tatsächlich vom Browser berechneten Text- und Hintergrundfarben erfasst.

| Messung | Original-PDF | HTML, helle Ansicht | HTML, dunkle Ansicht |
| --- | --- | --- | --- |
| Textfarbe, gerundete RGB-Werte | 247, 244, 230 | 38, 51, 44 | 38, 51, 44 |
| Hintergrundfarbe, gerundete RGB-Werte | 144, 172, 142 | 144, 172, 142 | 144, 172, 142 |
| Berechneter Kontrast | **2,25:1** | **5,32:1** | **5,32:1** |
| Bewertung nach WCAG 1.4.3 | Unter 3:1 und unter 4,5:1: Die Stichproben unterschreiten die Mindestwerte für große wie auch für normale Schrift. | Über 4,5:1: Mindestwert auch für normale Schrift erfüllt. | Über 4,5:1: Mindestwert auch für normale Schrift erfüllt. |

Berechnet wurde mit den ungerundeten PDF-Farbwerten. Dies ist eine **nachgewiesene Kontrastverletzung in den untersuchten PDF-Beispielen**, keine Kontrastprüfung sämtlicher Seiten. Weitere Texte, Bilder und Überlagerungen müssen gesondert bewertet werden.

Belege: [PDF-Analyse](accessibility-evidence/pdf-inspection.json), [direkter PDF/HTML-Vergleich](accessibility-evidence/pdf-html-comparison.json), [PDF-Ausschnitt](accessibility-evidence/pdf-page-07-heading-contrast.png), [HTML-Ausschnitt](accessibility-evidence/html-latest-heading-contrast.png).

### 2. Überschriften und Dokumentaufbau

Die PDF-Tags, also die gespeicherten Angaben zum Aufbau, ordnen auf Seite 7 „Technik“ der Ebene H2 und „Software“ der Ebene H1 zu. Visuell und inhaltlich gehört Software als Unterabschnitt zum Kapitel Technik. Die gespeicherten Ebenen bilden dieses Verhältnis daher nicht passend ab. Das betrifft die Darstellung von Zusammenhängen nach WCAG 1.3.1 und kann die Orientierung über Überschriften erschweren.

In der HTML-Fassung ist Technik eine Kapitelüberschrift der Ebene H2 und Software eine Unterüberschrift der Ebene H3. Im Hauptinhalt gibt es eine H1-, zehn H2- und 39 H3-Überschriften. Die Prüfung fand dort keine übersprungenen Ebenen. Die tatsächliche Navigation mit einem Screenreader wurde in keinem der beiden Formate getestet.

Dass das PDF insgesamt mehrere H1-Überschriften enthält, wird hier nicht allein als Fehler gewertet. Der konkrete Befund ist die unpassende Beziehung zwischen Kapitel und Unterabschnitt.

### 3. Bilder, Sprache und vorhandene PDF-Funktionen

Die PDF-Analyse fand 55 als `Figure` gespeicherte Bildelemente. Keines hatte einen eigenen Wert in den Feldern `/Alt` oder `/ActualText`. Fünf dieser Elemente liegen auf der Seite mit dem Lageplan. Da ein Teil der Bilder Dekoration ist und Raumbezeichnungen auch aus dem PDF als Text ausgelesen werden können, ist damit **keine pauschale Verletzung für 55 Bilder** belegt. Für wichtige Bilder müssen Zweck, gleichwertige Informationen im Umfeld und nötige Beschreibungen geprüft werden. Bezug: WCAG 1.1.1.

Die HTML-Fassung enthält für alle Bilder im Hauptinhalt eine Alternativtext-Angabe. Dekorative Illustrationen werden für unterstützende Technik ausgeblendet. Lageplan und Gebäudefoto haben Beschreibungen; Raumangaben stehen zusätzlich als Absatz daneben. Das Vorhandensein dieser Angaben wurde geprüft, ihre Eignung als vollständige Orientierungshilfe noch nicht.

Das PDF ist mit Deutsch (`de-DE`) als Dokumentensprache ausgezeichnet. Auf Seite 11 steht auch englischer Text. In den Strukturangaben wurden keine abweichenden Sprachkennzeichnungen gefunden. Dies wird als **noch zu prüfendes Risiko** behandelt, da die Untersuchung keine vollständige Prüfung aller möglichen Sprachangaben im PDF ersetzt. In der HTML-Fassung ist der entsprechende englische Abschnitt ausdrücklich als Englisch (`lang="en"`) gekennzeichnet; der Browser bestätigt diese Zuordnung. Ein Vorlesetest zur tatsächlichen Aussprache fehlt in beiden Formaten. Bezug: WCAG 3.1.1 und 3.1.2.

Das PDF enthält außerdem auslesbaren Text auf allen zwölf Seiten, 202 Verweise auf externe Adressen und 104 interne Sprungverweise. Vorhandene Tags, Sprache und Links werden ausdrücklich anerkannt. Es wird weder als reines Bilddokument noch als grundsätzlich unbedienbar eingestuft.

## Inhaltlicher Abgleich

Alle neun Themenbereiche sind in der ursprünglichen Reihenfolge vertreten. Auch der Einleitungszweck und die vier genannten Teammitglieder sind enthalten. Der Abgleich erfolgte auf Themenebene durch Gegenüberstellung der ausgelesenen PDF-Texte und der Inhaltsdateien der Webseite. Eine wortgetreue redaktionelle Freigabe liegt nicht vor.

| PDF-Seite(n) | Abschnitt der Webseite | Ergebnis und Unterschiede |
| --- | --- | --- |
| 1 | Titel und Einstieg | Einleitung und Kontaktzweck vorhanden; Kontaktlink führt zu einer anderen Adresse. |
| 2 | Inhaltsverzeichnis und Team | Neun Themen und vier Namen vorhanden; Beschreibungen gekürzt. |
| 3 | 1. Studienalltag & Zurechtfinden | Allgemeine Unterstützung, Angebote für Erstsemester und Campusinformationen vorhanden. |
| 4 | 2. Studienorganisation | Studienorganisation, Lehramt sowie ABV- und Sprachangebote vorhanden. |
| 5 | 3. Institutsleben | Institutsangebote, Veranstaltungen und Räume vorhanden. PDF-Raumbezeichnungen sind auslesbar; die Webseite enthält zusätzlich einen Absatz mit Raumangaben. Keine der beiden Darstellungen wurde als vollständige barrierefreie Wegbeschreibung bestätigt. |
| 6 | 4. Wissenschaftliches Schreiben | Dokumente, Schreibberatung und Bibliotheken vorhanden; auf der Webseite kein eigener Flyer-Eintrag. |
| 7 | 5. Technik | Netz, Lernplattformen, Drucken, Software und Hilfsangebote vorhanden. Die Webseite ergänzt bei der Aussage zum Druckguthaben von 5 Euro den Hinweis, aktuelle Bedingungen zu prüfen. |
| 8–9 | 6. Beratungsstellen | Beide PDF-Seiten in einem Webkapitel zusammengefasst. Allgemeine, psychologische, AStA- und spezialisierte Angebote vorhanden. |
| 10 | 7. Wohnen & Finanzieren | Finanzierung, Jobs, Wohnen und After Work vorhanden. Ein veranstaltungsspezifischer Link wurde durch eine allgemeine Kursübersicht ersetzt. |
| 11 | 8. Internationales | Internationale Angebote und Erasmus vorhanden; Erläuterung für Austauschstudierende gekürzt. |
| 12 | 9. Über die Uni hinaus | Sport, Werkstätten, Musik, Engagement und Nachhaltigkeit vorhanden; mehrere Beschreibungen und Ziele unterscheiden sich. |

Die maschinelle Bestandsaufnahme ergab **139 unterschiedliche PDF-Linkadressen**, **138 unterschiedliche externe beziehungsweise E-Mail-Adressen in der HTML-Fassung** und **120 genaue Übereinstimmungen**. 19 PDF-Adressen und 18 HTML-Adressen kommen jeweils nur in einem der beiden Bestände vor. Verglichen wurden genaue Zeichenfolgen; nur umgebende Leerzeichen aus dem PDF wurden entfernt. Weiterleitungen, unterschiedliche Protokolle oder Sprungmarken und inhaltlich gleichwertige Zielseiten wurden nicht zusammengeführt. Aus den Zahlen folgt daher nicht, dass 19 Angebote fehlen.

Die vollständigen Abweichungslisten stehen in der [PDF-Analyse](accessibility-evidence/pdf-inspection.json). Die ältere [Link-Dokumentation vom 23. Oktober 2026](../LINK-STATUS.md) nennt bereits zwei redaktionelle Fragen zu After Work und FUndgrube/fainin. Diese Zielseiten wurden bei dieser Prüfung nicht erneut validiert. Im PDF sichtbare Bildnachweis-Links fehlen im HTML-Linkbestand und sollten redaktionell geprüft werden.

Die zusätzlich dokumentierte [Inhaltsprüfung vor und nach den HTML-Korrekturen](accessibility-evidence/content-preservation.json) bestätigt unveränderte Haupttexte, Linkziele und Bildquellen beziehungsweise Alternativtexte zwischen diesen beiden HTML-Ständen. Sie belegt **keine vollständige inhaltliche Gleichheit zwischen PDF und Webseite**.

## Prüfverfahren und Ergebnisse für die Webseite

| Prüfung | Durchgeführt und festgestellt | Grenze der Aussage |
| --- | --- | --- |
| Automatische Prüfung mit axe/Playwright | Helle und dunkle Ansicht, 390 und 1280 Bildpunkte breite Fenster sowie normale und reduzierte Bewegung: acht Kombinationen. In Leseransicht und den geprüften Chat-Zuständen wurden keine automatischen Regelverstöße gemeldet. | Automatische Prüfungen können nicht alle Barrieren erkennen. Der optionale Chat hat kein Gegenstück im PDF; seine Antworten wurden für die Tests simuliert. |
| Erweiterte Browserprüfung | **46 von 46 festgelegten Prüfschritten bestanden**, darunter acht weitere automatische Prüfungen bei 320 und 1280 Bildpunkten Breite in beiden Farbdarstellungen. | Die Zahl beschreibt Prüfschritte in mehreren Einstellungen, keinen Erfüllungsgrad sämtlicher WCAG-Anforderungen. [Ergebnisdatei](accessibility-evidence/after.json). |
| Bedienung mit Tastatur | 164 erreichbare Elemente bei 390 × 850 Bildpunkten, jeweils 174 bei 1920 × 1080 und 1280 × 300. Die geprüften Markierungen waren vorhanden; nach Ende des Scrollens wurde kein vollständig verdecktes ausgewähltes Element festgestellt. | Die Sichtbarkeit wurde an ausgewählten Punkten des Elements geprüft. Dies ersetzt keine vollständige menschliche Sichtprüfung und keinen Screenreadertest. |
| Textanpassung | Prüfung bei 320 Bildpunkten Fensterbreite, verdoppelter Grundschriftgröße bei 1280 Bildpunkten sowie vergrößerten Zeilen-, Absatz-, Buchstaben- und Wortabständen. Die festgelegten Prüfungen bestanden. | Die eingebaute Zoomfunktion des Browsers wurde nicht bedient. Der Texttest prüft vor allem waagerechtes Abschneiden; nicht jede mögliche senkrechte Überlagerung. |
| Direkter PDF/HTML-Vergleich | Ausgewählte Überschriftenebenen und Farben sowie die Sprachzuordnung des englischen HTML-Abschnitts wurden verglichen. | Die Farbmessung betrifft die genannten Beispiele, nicht das gesamte PDF. [Vergleichsdatei](accessibility-evidence/pdf-html-comparison.json). |
| Funktions- und Projektprüfungen | Erzeugung der Webseite, Prüfungen der Typen, Inhalte, Gestaltungsvorgaben und internen Links sowie 30 Chat-Tests bestanden. | Die externen Angebote und die Live-Antwortqualität des Chats wurden damit nicht geprüft. [Prüfprotokoll](accessibility-evidence/verification.txt). |

Für die Abstandstests wurden 1,5-facher Zeilenabstand, 2em Absatzabstand, 0,12em Buchstabenabstand und 0,16em Wortabstand eingestellt. Die 320 Bildpunkte breite Ansicht entspricht hinsichtlich der verfügbaren Breite einer 1280 Bildpunkte breiten Ansicht bei 400 Prozent Vergrößerung. Das ist eine Annäherung für die Umbruchprüfung und kein tatsächlich ausgeführter Browser-Zoomtest.

Die automatische Prüfung meldete bei einigen Kontrastfragen **unvollständige Bewertungen**. Diese werden weder als bestandene Prüfung noch als nachgewiesener Fehler gezählt. Betroffene Elemente sind in der Ergebnisdatei erhalten. Die zusätzlichen Farbmessungen und Sichtprüfungen ergänzen diese Ergebnisse.

Die Aufzeichnung der früheren HTML-Fehler, ihrer Korrekturen und der Vorher-nachher-Prüfung bleibt im [englischsprachigen technischen Prüfbericht](ACCESSIBILITY_IMPLEMENTATION_AUDIT.md) erhalten. Alle dort beschriebenen Korrekturen sind weiterhin Bestandteil der untersuchten HTML-Fassung.

## Verfahren und Grenzen der PDF-Prüfung

Untersucht wurden Dateiangaben, Strukturinformationen, Text auf allen zwölf Seiten und Linkverweise. Die Seiten 5, 7 und 11 wurden auch als gerenderte Seiten angesehen. Die ausgewählten Kontrastmessungen beziehen sich auf Seite 7. Die Reihenfolge beim Auslesen von PDF-Text wurde nicht als Beleg für die tatsächliche Lesereihenfolge eines Screenreaders verwendet.

Nicht durchgeführt wurden eine PDF/UA-Prüfung, ein Screenreadertest im PDF, eine Tastaturprüfung im PDF-Programm sowie Tests der dort verfügbaren Umbruch-, Vergrößerungs- oder Dunkelmodus-Funktionen. Aus diesen offenen Punkten werden keine PDF-Verstöße abgeleitet.

Auch für die Webseite fehlen praktische Tests mit Screenreadern, Braillezeilen, Sprachsteuerung oder Schaltersteuerung. Weitere Browser, echte Mobilgeräte, die eingebaute Vergrößerung und besondere Kontrasteinstellungen müssen einbezogen werden.

## Prüfumgebung

Verwendet wurden macOS 26.6.2, Node.js 22.23.3, pnpm 11.25.0, Astro 7.4.0, Playwright 1.64.1, Chromium 156.0.8078.4 ohne sichtbares Browserfenster, axe-core beziehungsweise @axe-core/playwright 4.14.0, Poppler 26.10.0 und pypdf 6.21.2. Die Bildschirmgrößen wurden im Browser nachgebildet; echte Mobilgeräte wurden nicht verwendet. Zusätzliche JavaScript-Pakete wurden nicht benötigt. pypdf wurde in einer vorübergehenden Python-Umgebung installiert.

Die Ausführungsumgebung hatte lokale Server und Browserprozesse zunächst blockiert. Nach erlaubter erneuter Ausführung liefen die Prüfungen. Diese anfänglichen Einschränkungen waren kein nachgewiesener Fehler des Angebots. Weitere Einzelheiten stehen im [Prüfprotokoll](accessibility-evidence/verification.txt).

## Wiederholbare Prüfschritte für die technische Nachprüfung

Die folgenden Befehle sind für die betreuende IT gedacht. Sie sind zum Lesen des Hauptberichts nicht erforderlich. Ausführung im Hauptverzeichnis des Projekts; nach Quelltextänderungen die Webseite neu erzeugen.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm run check
pnpm run test:chat
pnpm run build
node scripts/check-internal-links.mjs
pnpm run test:a11y

# Weitere HTML-Ergebnisse und Bildschirmbilder separat speichern.
A11Y_OUTPUT=docs/accessibility-evidence A11Y_PHASE=current \
  node tests/accessibility-audit.mjs
```

Für die PDF-Analyse werden zusätzlich Poppler und die vorübergehende Python-Umgebung benötigt:

```sh
mkdir -p /tmp/philo4all-pdf-review
curl -fL 'https://www.geisteswissenschaften.fu-berlin.de/we01/studieren/studienberatung/philo4all/Kopie-von-Philo4all_aktuell_Juli_2025.pdf' \
  -o /tmp/philo4all-pdf-review/original.pdf
shasum -a 256 /tmp/philo4all-pdf-review/original.pdf
pdfinfo /tmp/philo4all-pdf-review/original.pdf
pdftotext -layout /tmp/philo4all-pdf-review/original.pdf /tmp/philo4all-pdf-review/original.txt
python3 -m venv /tmp/philo4all-pdf-review/venv
/tmp/philo4all-pdf-review/venv/bin/pip install pypdf==6.21.2
/tmp/philo4all-pdf-review/venv/bin/python scripts/inspect-source-pdf.py \
  /tmp/philo4all-pdf-review/original.pdf dist/client/index.html \
  > docs/accessibility-evidence/pdf-inspection.json
node scripts/compare-pdf-html.mjs

# Gezeigten Ausschnitt aus PDF-Seite 7 erzeugen.
pdftoppm -f 7 -l 7 -r 72 -x 81 -y 193 -W 285 -H 100 -png -singlefile \
  /tmp/philo4all-pdf-review/original.pdf /tmp/philo4all-pdf-review/page-07-heading
```

Der direkte Vergleich speichert `pdf-html-comparison.json` und den HTML-Überschriftenausschnitt im Nachweisordner. Bestehende Ergebnisse vor einer Wiederholung sichern; für weitere HTML-Tests eine neue Phasenbezeichnung verwenden. Wenn sich die PDF-Prüfsumme ändert, muss der untersuchte Seiten- und Farbausschnitt erneut überprüft werden.

## Bezug zu den Richtlinien

Die Hauptbefunde beziehen sich auf WCAG 2.2: [Kontrast, 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum), [Informationen und Beziehungen, 1.3.1](https://www.w3.org/TR/WCAG22/#info-and-relationships), [Nicht-Text-Inhalte, 1.1.1](https://www.w3.org/TR/WCAG22/#non-text-content), [Umbruch, 1.4.10](https://www.w3.org/TR/WCAG22/#reflow), [Textabstände, 1.4.12](https://www.w3.org/TR/WCAG22/#text-spacing) und [Sprache einzelner Abschnitte, 3.1.2](https://www.w3.org/TR/WCAG22/#language-of-parts). Bei den Tastaturtests sind insbesondere 2.1.1, 2.4.1, 2.4.3, 2.4.7 und 2.4.11 relevant.

Die bloße Existenz einer dunklen Ansicht ist keine WCAG-AA-Anforderung. Das PDF ist statisch; es wurde kein Bewegungsproblem im PDF nachgewiesen. Die Webfassung fügt Bewegung hinzu und berücksichtigt dafür die Einstellung zur Bewegungsreduktion. Diese Unterscheidungen bleiben Teil der Bewertung.
