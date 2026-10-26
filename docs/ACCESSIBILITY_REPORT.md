# Philo4all besser zugänglich machen

## Vergleich des FU-Wegweisers als PDF und als Webseite

**Stand der Prüfung: 26. Oktober 2026**

Der Wegweiser Philo4all bündelt wichtige Informationen für Studierende. Diese Informationen sollten auch Menschen gut erreichen, die eine Sehbeeinträchtigung haben, Texte stark vergrößern oder sich Inhalte von einem Programm vorlesen lassen.

Die Prüfung zeigt **konkrete Barrieren in der bisherigen PDF-Datei**. Besonders deutlich sind zu schwache Farbkontraste und eine teilweise unpassende Zuordnung von Überschriften. Die untersuchte Webfassung verbessert diese Punkte. Sie zeigt außerdem, wie sich der Wegweiser auf schmalen Bildschirmen darstellen und mit der Tastatur bedienen lässt.


## Was wurde verglichen?

Verglichen wurden die [von der FU veröffentlichte PDF-Datei](https://www.geisteswissenschaften.fu-berlin.de/we01/studieren/studienberatung/philo4all/Kopie-von-Philo4all_aktuell_Juli_2025.pdf) und die neueste Fassung eines unabhängig entwickelten Web-Beispiels. Die PDF umfasst zwölf Seiten und trägt auf dem Titelblatt den Stand Mai 2025.

Mit „Webfassung“ ist eine normale Webseite gemeint, die direkt im Browser gelesen werden kann. Sie orientiert sich an der Gestaltung des PDFs und übernimmt dessen neun Themenbereiche. Eine [öffentliche Demo](https://philo4all.zavalit.workers.dev/) veranschaulicht den Ansatz. Die Ergebnisse dieses Berichts beziehen sich auf die neueste, im Projekt geprüfte Fassung. Der aktuelle Stand der öffentlichen Demo wurde bei dieser sprachlichen Überarbeitung nicht erneut geprüft.

Die Prüfung orientiert sich an den internationalen Richtlinien für barrierefreie Webinhalte, kurz WCAG, auf Stufe AA. Eine Zertifizierung eines der beiden Angebote ist damit nicht verbunden.

## Die wichtigsten Ergebnisse

Die folgenden Bewertungen unterscheiden zwischen **nachgewiesenen Problemen**, **noch zu prüfenden Risiken** und **erfolgreich geprüften Funktionen**.

| Bereich | Bisherige PDF-Datei | Neueste Webfassung und Bewertung |
| --- | --- | --- |
| **Lesbarkeit durch Farbkontrast** | Auf Seite 7 heben sich die hellen Überschriften „WLAN & VPN“ und „Drucken“ zu wenig vom grünen Hintergrund ab. Der gemessene Kontrast liegt bei **2,25:1**. Er bleibt damit unter dem Mindestwert von **3:1 für große Schrift**. | Dunkle Schrift auf dem grünen Hintergrund erreicht **5,32:1**. Das erfüllt auch den strengeren Mindestwert für kleinere Schrift. **Die Verbesserung ist nachgewiesen.** Gemessen wurden diese Beispiele, nicht sämtliche Texte beider Fassungen. |
| **Orientierung über Überschriften** | Der Unterabschnitt „Software“ ist in der PDF-Datei als übergeordnete Überschrift gespeichert, obwohl er zum Kapitel „Technik“ gehört. Vorleseprogramme nutzen solche Angaben zur Orientierung. Eine falsche Zuordnung kann die Navigation erschweren. | Kapitel und Unterabschnitte sind in einer passenden Reihenfolge ausgezeichnet. **Die Struktur wurde geprüft.** Wie gut die Navigation mit einem Vorleseprogramm tatsächlich funktioniert, muss noch praktisch getestet werden. |
| **Bilder und Lageplan** | Bei 55 als Bilder geführten Elementen wurden keine eigenen Textbeschreibungen gefunden. Ein Teil davon ist bloße Dekoration und braucht keine Beschreibung. Raumbezeichnungen des Lageplans sind auch als Text vorhanden. **Welche wichtigen Bildinformationen zusätzlich beschrieben werden müssen, bleibt zu prüfen.** | Wichtige Bilder haben Textbeschreibungen; reine Dekoration wird für Vorleseprogramme ausgeblendet. Raumangaben stehen außerdem in einem eigenen Absatz. **Diese Vorkehrungen sind vorhanden.** Ob die Beschreibungen ausreichend helfen, sollte mit betroffenen Studierenden geprüft werden. |
| **Lesen auf kleinen Bildschirmen und mit größerer Schrift** | Die PDF hat feste Seiten. Wie gut einzelne PDF-Programme Vergrößerung und eine angepasste Darstellung ermöglichen, wurde nicht getestet. | In den geprüften schmalen Ansichten bricht der Text passend um. Auch die Prüfung mit verdoppelter Grundschriftgröße und veränderten Textabständen bestand die Webfassung. **Diese Funktionen wurden erfolgreich geprüft.** |
| **Bedienung ohne Maus** | Die PDF enthält bereits Links innerhalb des Dokuments und zu anderen Angeboten. Ihre Bedienung mit der Tastatur wurde in einem PDF-Programm nicht geprüft. | Kapitelwahl, Sprung zum Hauptinhalt und sichtbare Markierung der ausgewählten Links wurden mit der Tastatur geprüft. **Die getestete Bedienung funktioniert.** Daraus folgt keine Aussage über die ungeprüfte PDF-Bedienung. |
| **Vorlesen englischer Abschnitte** | Die Hauptsprache Deutsch ist gespeichert. Bei dem englischen Abschnitt auf Seite 11 muss noch geprüft werden, ob Vorleseprogramme die Sprache richtig erkennen. | Der englische Abschnitt ist ausdrücklich als Englisch gekennzeichnet. **Die Kennzeichnung wurde geprüft; die tatsächliche Aussprache noch nicht.** |

### Beispiel: dieselbe Überschrift in beiden Fassungen

Ein höherer Kontrastwert bedeutet einen deutlicheren Unterschied zwischen Schrift und Hintergrund. Die Ausschnitte zeigen den Unterschied; die Werte wurden aus den verwendeten Farben berechnet.

| PDF: 2,25:1 – zu geringer Kontrast | Webseite: 5,32:1 – Mindestwert erfüllt |
| --- | --- |
| ![PDF-Ausschnitt: helle Überschrift auf grünem Hintergrund mit zu geringem Kontrast.](accessibility-evidence/pdf-page-07-heading-contrast.png) | ![Web-Ausschnitt: dunkle Überschrift auf grünem Hintergrund mit ausreichendem Kontrast.](accessibility-evidence/html-latest-heading-contrast.png) |


## Was bereits feststeht – und was noch offen ist

**Nachgewiesen sind** der zu geringe Kontrast der untersuchten PDF-Überschriften, die unpassende Überschriftenzuordnung und die beschriebenen Verbesserungen der Webfassung. Für die Webseite wurden zusätzlich automatische Prüfungen, Tastaturtests und Ansichten mit veränderten Bildschirmbreiten und Texteinstellungen durchgeführt. Die dabei gefundenen Probleme der Webfassung wurden behoben.


**Noch erforderlich sind gemeinsame Nutzungstests mit betroffenen Studierenden**, insbesondere mit Vorleseprogrammen, sogenannten Screenreadern. Auch verschiedene PDF-Programme, weitere Browser und die dort eingebaute Vergrößerung müssen einbezogen werden. Eine vollständige Barrierefreiheit beider Fassungen ist mit den bisherigen Prüfungen nicht belegt.

## Vorschlag für die nächsten Schritte an der FU

1. **Eine zuständige Ansprechperson benennen.** Studi-Team, verantwortliche Webredaktion und zuständige Stelle für digitale Barrierefreiheit sollten die Überarbeitung gemeinsam abstimmen.
2. **Die belegten PDF-Probleme korrigieren.** Zuerst die schwachen Kontraste und die Überschriftenstruktur überarbeiten; anschließend wichtige Bilder und die Lesereihenfolge prüfen.
3. **Die Webfassung fachlich abgleichen.** Gekürzte Texte, Links, Raumangaben und Bildnachweise gemeinsam prüfen. Das vorhandene Beispiel kann als Ausgangspunkt für eine offizielle Fassung dienen.
4. **Beide Fassungen mit Studierenden testen.** Beispielsweise ein Beratungsthema finden, eine Kontaktstelle aufrufen und die Raumangaben verstehen. Dabei PDF und Webseite unter denselben Bedingungen vergleichen.
5. **Eine geprüfte Webfassung veröffentlichen und aktuell halten.** Auf der offiziellen Philo4all-Seite eine direkt lesbare Webfassung und eine überarbeitete PDF anbieten. Für beide sollten Änderungen und Zuständigkeiten klar geregelt sein.

**Die Bitte an die zuständigen FU-Stellen lautet:** Die dokumentierten Barrieren aufgreifen und prüfen, ob Philo4all gemeinsam als Beispiel für besser zugängliche Studieninformationen weiterentwickelt werden kann. Ein funktionsfähiger Web-Ansatz und nachvollziehbare Prüfergebnisse liegen dafür bereits vor.

## Quellen und Prüfnachweise

- [Offizielle Philo4all-Seite der FU](https://www.geisteswissenschaften.fu-berlin.de/we01/studieren/studienberatung/philo4all/index.html) und [untersuchte PDF-Datei](https://www.geisteswissenschaften.fu-berlin.de/we01/studieren/studienberatung/philo4all/Kopie-von-Philo4all_aktuell_Juli_2025.pdf).
- [Prüfnachweise und ausführlicher Inhaltsvergleich](ACCESSIBILITY_PRUEFNACHWEISE.md): genaue Messungen, Prüfverfahren, Grenzen und wiederholbare Prüfschritte für die fachliche oder technische Nachprüfung.
- [Technische Aufzeichnung der Prüfung und Korrekturen der Webseite, auf Englisch](ACCESSIBILITY_IMPLEMENTATION_AUDIT.md): ergänzende Dokumentation der bereits beibehaltenen Verbesserungen.
