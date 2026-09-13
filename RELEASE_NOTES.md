## Heating Plan Card 1.0.0

Eigenständiger Heizplan-Manager für Home Assistant, veröffentlicht unter GNU GPL v3.

- Raumübersicht mit Ist- und Zieltemperatur, Heizstatus und Wochenübersicht.
- Großer Listen-Editor für Heizzeiten, am Handy bildschirmfüllend.
- Pläne erstellen, bearbeiten, kopieren, pausieren und mit Bestätigung löschen.
- Wochentage, Arbeitstage und freie Tage mit dem vorhandenen Arbeitskalender.
- Rückgängig für die letzte Bearbeitung, Prüfung auf Überschneidungen und zwischenzeitliche Änderungen.
- Bestehende Sonderregeln bleiben erhalten und sind bei nicht unterstützten Konfigurationen nur lesbar.
- Native Web Components, keine Laufzeit-Bibliotheken und kein übernommener Code aus Scheduler Card.

**Unterbau:** Die vorhandene Scheduler-Integration speichert und führt die Pläne aus. Sie muss installiert und eingerichtet sein.

**HACS:** `https://github.com/leoncode-hacs/heatingplan-card` als benutzerdefiniertes Repository vom Typ Dashboard/Lovelace hinzufügen. Kartenname: **Heating Plan Card**. YAML: `type: custom:heatingplan-card`.

Diese Karte kann neben Scheduler Card installiert werden. Home Assistant 2026.6.0 oder neuer erforderlich. Die Oberfläche ist zunächst auf Deutsch.

Automatisierte Tests und Browserprüfungen verwenden Beispieldaten. Eine Prüfung mit realen Heizgeräten ist nach der Installation im Zielsystem erforderlich. Direkte Temperaturänderungen sind keine zeitlich garantierten Boosts.
