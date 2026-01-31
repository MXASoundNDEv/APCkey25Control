# APC Key 25 Control – React + Electron (janvier 2026)

Front-end réécrit proprement en React + Vite, servi dans Electron pour piloter et visualiser l'Akai **APC Key 25** via l'API Web MIDI. Inclus : LEDs des pads, suivi des notes, mapping des knobs vers un synthé Web Audio intégré, oscilloscope et console temps réel.

## Pré-requis
- Node.js 18+  
- Windows / macOS / Linux avec un navigateur Chromium embarqué (Electron) supportant Web MIDI  
- Le contrôleur **Akai APC Key 25** branché en USB

## Démarrage rapide
```bash
cd apc-key25-gui
npm install          # installe React, Vite, Electron…
npm run dev          # lance Vite + Electron en mode dev
npm run build        # build React dans dist/
npm start            # ouvre l'app Electron en production (utilise dist/)
```

Scripts utiles :
- `npm run dev` : Vite (frontend) + Electron avec rechargement.
- `npm run build` : build React (dist/).
- `npm start` : Electron en pointant sur dist/ (assure-toi d'avoir fait le build).

## Fonctions principales
- **Sélection des ports MIDI** (entrée/sortie) directement dans l'UI.
- **Pads 5x8** : clic pour allumer/éteindre, réception des notes/pads, envoi des couleurs (codes LED internes APC).
- **Actions rapides** : nettoyage des LED, mode Rainbow, bascule de la vélocité, gestion du bouton Shift.
- **Knobs (CC 48–55)** : mappés vers les paramètres du synthé (ADSR, vibrato, filtre). Les mouvements hardware mettent à jour les sliders, et inversement.
- **Synthé Web Audio** : oscillateur (sine/square/saw/triangle), enveloppe ADSR, vibrato, filtre passe-bas, volume maître.
- **Oscilloscope** : affichage du signal audio généré.
- **Console temps réel** : journal des messages MIDI (status/note/velocity).

## Structure du nouveau code
- `apc-key25-gui/electron/main.js` : fenêtre Electron, menu minimal, chargement du preload.
- `apc-key25-gui/electron/preload.js` : contextIsolation actif, exposition d'infos de plateforme.
- `apc-key25-gui/src/` : React + hooks
  - `App.jsx` : logique principale (pads, actions, routing des messages MIDI).
  - `hooks/useMidi.js` : accès Web MIDI (ports, envoi, écoute).
  - `hooks/useSynth.js` : moteur audio + ADSR + vibrato + filtre.
  - `components/*` : UI (pads, knobs, oscilloscope, console, contrôles synthé).
- `apc-key25-gui/vite.config.js` : build Vite (base="./", alias `@` sur `src`).

## Codes LED utilisés (PadColors)
- 0: off, 1: vert, 2: vert clignotant, 3: rouge, 4: rouge clignotant, 5: orange, 6: orange clignotant.

## Notes
- L'application repose uniquement sur **Web MIDI** dans le renderer (plus besoin du paquet `midi` Node).
- En mode prod, assure-toi d'avoir un dossier `dist/` (via `npm run build`) avant de lancer `npm start`.
- Un warning TLS peut apparaître si `NODE_TLS_REJECT_UNAUTHORIZED` est défini à 0 ; retire cette variable pour des téléchargements sécurisés.

## Licence
Licence d'origine non commerciale conservée (Creative Commons BY-NC). Attribution requise, usage commercial interdit.
