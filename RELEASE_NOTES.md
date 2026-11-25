## Heating Plan Card 1.3.2

- Bestehende Heizpläne lassen sich wieder zuverlässig bearbeiten. Zuvor erschien teils „Der Speicherauftrag wurde gesendet, konnte aber noch nicht bestätigt werden“.
- Heizpläne ohne Namen können jetzt gespeichert werden, ohne einen Namen eintragen zu müssen.
- Der Name eines bestehenden Plans ist schreibgeschützt. Die Scheduler-Integration (v3.3.9) entfernt beim Umbenennen den Schalter des Plans, sodass er bis zum Neustart nicht mehr ausgeführt wird. Einen neuen Namen vergibst du über **Kopieren**.
- Kopien namenloser Pläne heißen „Heizplan · Kopie“.

Falls ein Plan nach einem fehlgeschlagenen Speicherversuch nicht mehr ausgeführt wird, Home Assistant einmal neu starten. Nach dem HACS-Update das Home-Assistant-Frontend vollständig neu laden.
