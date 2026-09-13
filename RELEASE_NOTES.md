## Heating Plan Card 1.0.1

- Die Thermostatauswahl im Konfigurationseditor springt bei Home-Assistant-Statusupdates nicht mehr nach oben.
- Scrollposition und Eingabefokus bleiben auch beim Auswählen von Thermostaten erhalten. Unfertige Titel werden durch Statusupdates nicht überschrieben.
- Umbenannte Räume erscheinen weiterhin aktuell; die Liste wird nur bei tatsächlichen Änderungen neu aufgebaut.
- Die Texte „Zuhause wohlfühlen“ und „Deine Räume. Deine Zeiten.“ wurden aus dem Kartenkopf entfernt.

Nach dem HACS-Update das Frontend vollständig neu laden und den Karteneditor einmal neu öffnen. Die Scheduler-Integration und vorhandene Heizpläne bleiben unverändert.

Die Scrollkorrektur gilt auch für die Karte und ihre Vorschau: unveränderte Inhalte werden nicht mehr ersetzt; bei tatsächlichen Änderungen bleiben die Scrollpositionen der umgebenden Home-Assistant-Ansicht erhalten.
