# English Exam Trainer

Übungs-Schularbeiten und Lernmodus für Englisch, mit deutscher Oberfläche.
Der erste Stoff ist **Unit 2 – At the wildlife park** (47 Vokabeln und Phrasen,
Personalpronomen, Präpositionen, there is / there are).

## Starten

Einmalig [Node.js](https://nodejs.org) (Version 20 oder neuer) installieren, dann im Ordner:

```bash
npm install
npm run dev
```

Die App läuft dann unter http://localhost:5173. Alles bleibt lokal im Browser gespeichert
(kein Konto, kein Server). Für den Hördiktat-Teil braucht der Browser eine englische
Stimme; Chrome, Edge und Safari haben sie meistens schon.

Für eine fertige Version ohne Entwicklungsserver: `npm run build`, danach `npm run preview`.

## Was die App kann

**Übungs-Schularbeit (50 Minuten)**

| Zeit | Teil | Inhalt |
| --- | --- | --- |
| 0–5 | Aufwärmen | Multiple Choice Englisch → Deutsch, Zuordnen, Richtig/Falsch |
| 5–15 | Teil A: Vokabeln | Deutsch → Englisch schreiben, Hördiktat, Buchstabensalat |
| 15–25 | Teil B: Pronomen | Lückentexte, Satzteile ersetzen („Tom and I“ → we), Sätze bauen |
| 25–28 | Pause | Memory-Spiel ohne Wertung |
| 28–38 | Teil C: Präpositionen | Bildaufgaben (Wo ist die Katze?), there is / there are |
| 38–47 | Teil D: Boss-Runde | Gemischt, die Fehler aus Teil A–C kommen in anderer Form wieder |
| 47–50 | Auswertung | Note, Fehlerliste, verdiente XP |

- Ohne Hilfen, der Timer läuft sichtbar. Ist die Zeit eines Teils um, zählen offene Aufgaben als falsch.
- Rechtschreibung zählt: Ein Tippfehler ist ein Fehler, danach zeigt die App Buchstabe für Buchstabe den Unterschied.
  Groß-/Kleinschreibung zählt nur beim Wort „I“.
- Bei mehrdeutigem Deutsch (z. B. „sie“ = she / they) steht immer ein Hinweis dabei.
- Die Aufgaben werden jedes Mal neu gemischt; dieselbe Aufgabe oder derselbe Aufgabentyp kommt nicht zweimal hintereinander.
  Wörter, die oft falsch waren, kommen öfter dran.
- Die Beispielsätze sind eigene Sätze im Stil des Buches, nicht die Buchsätze.

**Lernmodus:** tägliche Runden (Standard 10 Minuten) nach dem Leitner-Prinzip mit 5 Fächern,
in beide Richtungen. Falsche Wörter aus der Prüfung landen automatisch in Fach 1.

**Motivation:** XP (nur für richtige Antworten und gute Noten), Level, Abzeichen und die persönliche Bestnote.

**Ziel:** zwei Prüfungen hintereinander mit Note 1, mit mindestens 90 % in beide Übersetzungsrichtungen.

**Eltern-Bereich** (mit PIN):
- Ergebnisse jeder Prüfung mit Datum, Note, beiden Richtungen und Fehlerliste
- Fehlerstatistik nach Thema (Vokabeln, Pronomen, Präpositionen, Rechtschreibung), Verlauf, häufigste Fehler
- Vokabeln bearbeiten und neue Units für den nächsten Stoff anlegen
- Notengrenzen anpassen (Standard: 1 ab 90 %, 2 ab 80 %, 3 ab 65 %, 4 ab 50 %), Länge der Lernrunde, Sprechtempo
- Sicherung herunterladen und auf einem anderen Computer wieder laden

## Für Entwickler

```bash
npm test          # Logik-Tests (Bewertung, Prüfungsaufbau, Leitner, Ergebnisse)
npm run build     # Typprüfung und Build
```

- `src/data/unit2.ts` – Vokabeln von Unit 2 mit eigenen Beispielsätzen
- `src/data/grammar.ts` – eigene Pronomen-Sätze, Tiere und Gegenstände für die Bildaufgaben
- `src/lib/` – Aufgaben, Prüfungsaufbau, Bewertung, Leitner, Belohnungen, Speicher
- `src/screens/` – Startseite, Prüfung, Auswertung, Lernmodus, Eltern-Bereich
