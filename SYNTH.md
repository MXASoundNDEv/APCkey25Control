# Synthé interne (useSynth)

Ce document décrit le moteur audio implémenté dans le hook `useSynth` et la façon de le piloter depuis l’interface.

## Vue d’ensemble

Le synthé est un moteur polyphonique simple basé sur l’API Web Audio.
Chaque note déclenche une voix composée de :

- **Oscillateur principal** (forme `oscillatorType`)
- **Oscillateur harmonique** (octave supérieure) pour enrichir le timbre
- **Enveloppe ADSR** appliquée au gain
- **Filtre passe‑bas** suivi par la hauteur de note
- **Vibrato (LFO)** appliqué aux oscillateurs

Le flux audio est :

```
Oscillateurs -> Gain (ADSR) -> Filtre -> Master -> Analyser -> Destination
```

## Paramètres (params)

| Paramètre        | Type   | Rôle                                                    | Plage conseillée | Valeur par défaut |
| ---------------- | ------ | ------------------------------------------------------- | ---------------- | ----------------- |
| `master`         | number | Volume général (0‑1)                                    | 0.0 – 1.0        | 0.6               |
| `attack`         | number | Temps d’attaque (s)                                     | 0.001 – 1.0      | 0.02              |
| `decay`          | number | Temps de decay (s)                                      | 0.01 – 2.0       | 0.15              |
| `sustain`        | number | Niveau de sustain (0‑1)                                 | 0.0 – 1.0        | 0.75              |
| `release`        | number | Temps de release (s)                                    | 0.01 – 3.0       | 0.25              |
| `vibratoFreq`    | number | Fréquence du LFO (Hz)                                   | 0.1 – 12         | 5                 |
| `vibratoDepth`   | number | Profondeur du vibrato (cents approx.)                   | 0 – 50           | 8                 |
| `filterFreq`     | number | Fréquence de coupure (Hz)                               | 80 – 18000       | 9000              |
| `filterQ`        | number | Résonance du filtre                                     | 0.1 – 20         | 1.2               |
| `filterTracking` | number | Suivi de hauteur (0‑1)                                  | 0.0 – 1.0        | 0.4               |
| `harmonicMix`    | number | Niveau de l’harmonique (0‑1)                            | 0.0 – 1.0        | 0.35              |
| `harmonicTilt`   | number | Atténuation en hauteur                                  | 0.0 – 1.0        | 0.45              |
| `oscillatorType` | string | Forme d’onde (`sine`, `square`, `sawtooth`, `triangle`) | —                | `sawtooth`        |

> Les valeurs sont en unités Web Audio (secondes, Hz). Les plages conseillées sont des repères UI ; le moteur accepte toute valeur numérique raisonnable.

## Entrées / Sorties

### Entrées (API publique)

| Élément                                   | Type     | Description                                                                                 |
| ----------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `params`                                  | object   | État courant des paramètres. Clés identiques au tableau ci‑dessus.                          |
| `setParam(key, value)`                    | function | Met à jour un paramètre en temps réel. Voir la section ci‑dessous pour le contrat d’entrée. |
| `noteOn(note, velocity, velocityScaling)` | function | Démarre une note MIDI.                                                                      |
| `noteOff(note)`                           | function | Relâche une note MIDI.                                                                      |

### Sorties (audio & analyse)

| Élément    | Type                                                                   | Description                                                                             |
| ---------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Audio      | Flux Web Audio                                                         | Sortie stéréo vers `AudioContext.destination` via un gain maître et un filtre par voix. |
| `analyser` | `AnalyserNode`                                                         |
|            | Utilisé par l’oscilloscope/spectre. FFT configurée à `fftSize = 2048`. |

## Contrat d’entrée détaillé

### `setParam(key, value)`

- **Entrée**
	- `key` : string — nom d’un paramètre (`master`, `attack`, `filterFreq`, `oscillatorType`, …).
	- `value` : number | string — valeur à appliquer. Les paramètres numériques sont en secondes ou Hz selon leur rôle.
- **Effet**
	- Met à jour l’état React et resynchronise immédiatement toutes les voix actives.
- **Retour**
	- Aucun (`void`).

### `noteOn(note, velocity = 100, velocityScaling = true)`

- **Entrée**
	- `note` : number — numéro de note MIDI (0‑127).
	- `velocity` : number — vélocité MIDI (0‑127).
	- `velocityScaling` : boolean — si `true`, la vélocité module le gain de la voix.
- **Effet**
	- Crée une voix (oscillateurs + gain + filtre + LFO), applique l’ADSR, démarre la note.
- **Retour**
	- Aucun (`void`).

### `noteOff(note)`

- **Entrée**
	- `note` : number — numéro de note MIDI (0‑127).
- **Effet**
	- Lance la phase Release puis stoppe et nettoie la voix.
- **Retour**
	- Aucun (`void`).

## Fonctions publiques

### `setParam(key, value)`
Met à jour un paramètre du synthé en temps réel. Les voix actives sont immédiatement resynchronisées.

### `noteOn(note, velocity, velocityScaling)`
Démarre une note MIDI.

- `note` : numéro de note MIDI
- `velocity` : vélocité (0‑127)
- `velocityScaling` : si `true`, applique la vélocité au volume

### `noteOff(note)`
Relâche une note : applique la phase Release et nettoie la voix.

### `analyser`
Retourne un `AnalyserNode` pour affichage (oscilloscope/spectre).

## Détails de conception

### Oscillateur harmonique
Une seconde onde (triangle) à l’octave supérieure est mélangée au signal principal. Le gain est modulé par `harmonicMix` et `harmonicTilt` pour garder de la brillance autour du Do central.

### Filtre avec suivi de hauteur
La fréquence de coupure est modulée en fonction de la hauteur (`filterTracking`) pour conserver un timbre cohérent sur le clavier.

### Vibrato (LFO)
Un oscillateur basse fréquence module la fréquence des oscillateurs, créant un vibrato contrôlable (`vibratoFreq`, `vibratoDepth`).

## Exemple d’utilisation

```js
const { params, setParam, noteOn, noteOff } = useSynth();

setParam('oscillatorType', 'triangle');
setParam('filterFreq', 6000);
noteOn(60, 100, true); // Do central
noteOff(60);
```

## Fichiers associés

- Hook : `src/hooks/useSynth.js`
- UI : `src/components/SynthControls.jsx`
- Visualisation : `src/components/Oscilloscope.jsx`
