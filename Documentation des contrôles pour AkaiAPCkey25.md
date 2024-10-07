### Documentation des contrôles pour Akai APC Key25 MK1

---

#### 1. **Touches (clavier 25 touches)**
Chaque touche envoie un message MIDI avec une **note** et une **vélocité**.

- **Note On** : 144 + numéro de la note
- **Note Off** : 128 + numéro de la note
- **Vélocité** : Valeur entre 0 et 127

| Touche      | Numéro de Note MIDI |
|-------------|---------------------|
| C3          | 48                  |
| C#3         | 49                  |
| D3          | 50                  |
| D#3         | 51                  |
| E3          | 52                  |
| F3          | 53                  |
| F#3         | 54                  |
| G3          | 55                  |
| G#3         | 56                  |
| A3          | 57                  |
| A#3         | 58                  |
| B3          | 59                  |
| C4          | 60                  |
| ...         | ...                 |

---

#### 2. **Pads (8 pads lumineux)**
Les pads envoient des messages MIDI pour le contrôle des clips dans Ableton ou pour déclencher des actions dans d'autres logiciels.

- **Note On** : 144 + numéro du pad
- **Note Off** : 128 + numéro du pad
- **Vélocité** : Valeur entre 0 et 127 (0 = éteint, 127 = allumé)

| Pad         | Numéro de Note MIDI |
|-------------|---------------------|
| Pad 1       | 64                  |
| Pad 2       | 65                  |
| Pad 3       | 66                  |
| Pad 4       | 67                  |
| Pad 5       | 68                  |
| Pad 6       | 69                  |
| Pad 7       | 70                  |
| Pad 8       | 71                  |

---

#### 3. **Potentiomètres (8 potentiomètres rotatifs)**
Les potentiomètres envoient des messages MIDI de **contrôle continu (CC)**.

- **Message CC** : 176 + numéro du contrôle
- **Valeur** : 0 à 127 (position du potentiomètre)

| Potentiomètre | Numéro de CC |
|---------------|--------------|
| Potentiomètre 1 | 48         |
| Potentiomètre 2 | 49         |
| Potentiomètre 3 | 50         |
| Potentiomètre 4 | 51         |
| Potentiomètre 5 | 52         |
| Potentiomètre 6 | 53         |
| Potentiomètre 7 | 54         |
| Potentiomètre 8 | 55         |

---

#### 4. **Boutons de lancement de scène (5 boutons)**
Ces boutons sont utilisés pour déclencher des scènes dans Ableton Live. Ils envoient également des messages **Note On** et **Note Off**.

- **Note On** : 144 + numéro de la note
- **Note Off** : 128 + numéro de la note

| Bouton      | Numéro de Note MIDI |
|-------------|---------------------|
| Bouton 1    | 82                  |
| Bouton 2    | 83                  |
| Bouton 3    | 84                  |
| Bouton 4    | 85                  |
| Bouton 5    | 86                  |

---

#### 5. **Boutons de navigation et de transport**
L'APC Key25 dispose de boutons supplémentaires pour la navigation et le contrôle du transport dans Ableton Live. Ces boutons envoient également des messages MIDI.

- **Message CC** : 176 + numéro du contrôle

| Bouton              | Numéro de CC |
|---------------------|--------------|
| Octave Up           | 87           |
| Octave Down         | 88           |
| Shift               | 98           |
| Stop All Clips      | 81           |
| Play/Stop           | 91           |

---

#### 6. **Messages de LED**
Pour contrôler les LEDs des pads et boutons, tu dois envoyer des messages MIDI correspondants aux **numéros de note** des pads ou boutons, avec une **vélocité** spécifique pour choisir la couleur :

- **LED éteinte** : 0
- **LED allumée (couleur par défaut)** : 127

Exemple pour allumer le **Pad 1** :
```javascript
const message = [144, 64, 127]; // Note On, Note 64 (Pad 1), Vélocité 127 (allumé)
output.send(message);
```

---

### Exemple d'implémentation en JavaScript (Web MIDI API)

Voici un exemple pour envoyer des messages MIDI pour allumer un pad :

```javascript
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function onMIDISuccess(midiAccess) {
  const output = [...midiAccess.outputs.values()].find(output => output.name.includes("APC Key 25"));
  
  // Allumer le Pad 1
  const message = [144, 64, 127]; // Note On, Pad 1, Vélocité 127
  output.send(message);
}

function onMIDIFailure() {
  console.log("Échec d'accès au MIDI.");
}
```