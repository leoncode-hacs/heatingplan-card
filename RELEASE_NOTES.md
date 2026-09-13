## Heating Plan Card 1.2.0

- Eine gemeinsame Wochenansicht für feste Wochentage und Arbeitskalender-Pläne.
- Pausierte Pläne bleiben sichtbar, grau dargestellt und mit **Pausiert** gekennzeichnet. Sie erscheinen nicht mehr als fehlender Tagesplan.
- Konkrete Daten und Navigation zwischen Wochen machen die Zuordnung nachvollziehbar.
- Feiertage werden über die Datumsabfrage des Workday-Sensors berücksichtigt. Bei fehlenden Kalenderantworten bleiben mögliche Pläne mit **Zuordnung noch offen** sichtbar.
- Ohne den vom Scheduler verwendeten Workday-Sensor gilt dessen Standardwoche (Montag bis Freitag), ausdrücklich gekennzeichnet.
- Auf sehr schmalen Handys bleibt das Datum in der Tagesüberschrift, damit alle sieben Tagestasten Platz haben.

Die Änderung betrifft die Darstellung. Vorhandene Heizpläne bleiben erhalten; Bearbeiten verändert weiterhin den wiederkehrenden Plan. Nach dem HACS-Update das Home-Assistant-Frontend vollständig neu laden.
