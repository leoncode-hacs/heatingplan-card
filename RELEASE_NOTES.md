## Heating Plan Card 1.4.2

**Automatische Namen für Heizpläne**

- Der Name eines Heizplans ist jetzt **optional**. Bleibt das Feld leer, zeigt die Card einen Namen aus **Raum und Tagen**, zum Beispiel „Wohnzimmer · Mo–Fr“, „Bad · Wochenende“ oder „Küche · Arbeitstage“.
- Der automatische Name wird nicht gespeichert, sondern immer neu gebildet. Änderst du die Tage, passt er sich von selbst an.
- Im Editor steht der Vorschlag als Platzhalter im Namensfeld und ändert sich sofort mit der Tagesauswahl.
- Bestehende Pläne ohne Namen erscheinen nicht mehr als „Heizplan“, sondern ebenfalls mit ihrem automatischen Namen.
- Neue Pläne bekommen keinen vorgegebenen Namen mehr. Eine Kopie eines unbenannten Plans bleibt unbenannt.

Nach dem HACS-Update das Home-Assistant-Frontend vollständig neu laden.

## Heating Plan Card 1.4.1

Weitere Verbesserungen für Bedienung und Handy.

**Editor**

- Neue **Tageszeitleiste** über den Abschnitten: zeigt den ganzen Tag von 0 bis 24 Uhr und ändert sich beim Bearbeiten sofort.
- **Abschnitt einfügen** direkt zwischen zwei Abschnitten: Das kleine **+** auf der Trennlinie teilt den Abschnitt darüber in der Mitte.
- **Schnellwahl für Temperaturen:** Die in diesem Raum am häufigsten verwendeten Temperaturen lassen sich mit einem Tipp übernehmen.
- **Einfachere Tagesauswahl:** ein einziges Menü (Montag bis Freitag, Samstag und Sonntag, Jeden Tag, Arbeitstage bzw. freie Tage laut Arbeitskalender, Eigene Auswahl). Die einzelnen Wochentage erscheinen nur bei **Eigene Auswahl**.

**Übersicht und Steuerung**

- Am Handy wechselst du den Tag durch **Wischen** nach links oder rechts; am Wochenende bzw. Wochenanfang geht es in die nächste bzw. vorherige Woche.
- Der **Heute**-Button erscheint nur, wenn du nicht schon den heutigen Tag ansiehst.
- **Heizung steuern** zeigt, bis wann die Einstellung gilt und welchen Wert der Heizplan danach setzt.
- Die **Gesamtübersicht** ist am Handy kompakter: ein Raum pro Zeile mit nächster Schaltung rechts, Bearbeiten-Buttons in **Wiederkehrende Pläne** nur als Symbol.

Nach dem HACS-Update das Home-Assistant-Frontend vollständig neu laden.
