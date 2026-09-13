## Heating Plan Card 1.1.0

### Handy-Bedienung

- iPhone-Statusleiste und Home-Indikator werden durch sichere Bildschirmränder berücksichtigt.
- Uhrzeit und Heizungssteuerung stehen auf schmalen Bildschirmen untereinander; native iPhone-Zeitfelder überlagern die Tasten nicht mehr.
- Dialogkopf und Speichern-Leiste bleiben außerhalb des scrollbaren Inhalts, ohne zusammenzuschieben.

### Heizung ausschalten

- Unter **Heizung steuern** zwischen **Heizen** und **Heizung aus** wählen und bestätigen.
- Jeder Heizplan-Abschnitt kann ebenfalls auf **Heizung aus** gestellt werden.
- In Plänen mit Aus-Abschnitten aktivieren spätere Temperaturabschnitte ausdrücklich den Heizmodus.
- Unterstützte Modi werden anhand des Thermostats geprüft. Vorhandene Sonderregeln bleiben geschützt.

Nach dem HACS-Update das Frontend vollständig neu laden und geöffnete Dialoge neu öffnen. Direktes Ausschalten pausiert den Heizplan nicht; eine spätere Schaltung kann die Heizung wieder einschalten.
