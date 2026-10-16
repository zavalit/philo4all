# Philo4all bearbeiten (für das Studi-Team)

Die Website zeigt euren Wegweiser als **eine Seite mit elf „Blättern“**: Titel, Inhaltsverzeichnis mit Studi-Team und die neun Themen. Aussehen, Farben und Illustrationen entstehen automatisch. Ihr bearbeitet in erster Linie **Texte und Links**.

1. Im GitHub-Repository den Ordner `src/content/topics/` öffnen. Jedes Thema hat eine `.mdx`-Datei, z. B. `05-technik.mdx`.
2. Auf den Stift (Edit) klicken. Text ändern, neue Listenpunkte mit `- ` ergänzen oder Links als `[sichtbarer Linktext](https://ziel.de)` einfügen.
3. Die Angaben zwischen den beiden `---`-Zeilen oben sind Metadaten. `order:` nur ändern, wenn sich die Reihenfolge der Themen wirklich ändern soll.
4. Jede farbige Karte steht zwischen `<Panel title="…">` und `</Panel>`. Den Kartentitel ändert ihr in `title="…"`. Die beiden Tags müssen stehen bleiben.
5. Änderung als Branch/„Pull Request“ vorschlagen. GitHub prüft Aufbau, Links und Barrierefreiheit. Erst nach bestandenen Prüfungen wird veröffentlicht.

## Karten (Panels) gestalten

Alle Angaben außer `title` sind optional:

| Angabe | Wirkung |
|---|---|
| `tone="pale"` / `"sage"` / `"forest"` | Hellgrün, Salbeigrün oder Dunkelgrün wie in der PDF |
| `span={6}` | Breite in Spalten von 12 (ohne Angabe: volle Breite) |
| `align="end"` | Karte steht rechts statt links |
| `rows={2}` | Hohe Karte neben zwei kleineren |
| `bleed="start"` / `"end"` / `"both"` | Karte läuft über den Blattrand |
| `lift` | Karte überlappt die Karte darüber |
| `squiggle` | Kleine Wellenlinie unter dem Titel |

Auf schmalen Bildschirmen stehen alle Karten automatisch untereinander.

## Illustrationen

Illustrationen aus der PDF stehen als erste Zeile in einer Karte, z. B.:

```mdx
<Panel title="Erasmus" tone="forest" span={7} align="end">
<Art name="globe" size={24} at="top-start" hang />

- [Erasmus+ an der FU](https://…).
</Panel>
```

- **`name`:** Dateiname in `src/assets/art/`, z. B. `mascot`, `book-stack`, `globe` oder `coins`.
- **`size`:** Breite in Prozent der Blattbreite.
- **`at`:** Position, z. B. `start`, `end`, `top-start` oder `bottom-end`.
- **`hang`:** Die Illustration ragt über den Kartenrand.

Ohne `hang` steht sie im Text. Die Ecken-Dekoration eines Blatts (Zweig oben, Büsche unten) wählt ihr in den Metadaten mit `decor: [leaf, bushes]`.

Weitere Dateien:
- `src/content/pages/intro.mdx`: Einleitungstext auf dem Titelblatt.
- `src/content/pages/studi-team.mdx`: Namen und Fotos des Studi-Teams.

## Redaktionelle Checkliste

- **Inhalt prüfen:** Ist alles noch korrekt? **Termine, URLs, Zuständigkeiten und Finanzierungsregeln prüfen.** Die Vorlage stammt von Mai 2025.
- **Linktexte:** Haben Links einen verständlichen Text? Nicht „hier klicken“, sondern das Ziel nennen.
- **Gendersternchen:** Stehen zwei davon in einer Zeile, mit Backslash schreiben: `Mentor\*innen und Tutor\*innen`. Sonst wird der Text kursiv.
- **Bilder:** nur mit geklärten Rechten verwenden.
- **Tests:** Automatische Tests helfen, ersetzen aber keine Prüfung mit Tastatur und Screenreader.

**Kontakt aus der Vorlage:** studienberatung@philosophie.fu-berlin.de
