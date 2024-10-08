# APC Key 25 MIDI Controller

## Description
Ce projet permet de contrôler et visualiser l'**Akai APC Key 25** à l'aide de JavaScript et de l'API Web MIDI. Il gère les entrées MIDI, permet de jouer des notes avec vélocité, d'allumer/éteindre les LED des pads, et inclut la gestion de boutons spécifiques, tels que le bouton **Shift**.

Les fonctionnalités incluent :
- Lecture de notes MIDI avec gestion de la vélocité.
- Allumage et extinction des LED des **pads** et du **bouton Shift**.
- Contrôle de la couleur des pads (vert, rouge, orange, etc.).
- Gestion des potentiomètres (knobs) avec visualisation graphique.

## Fonctionnalités principales
- **Contrôle des notes** : Les touches du clavier MIDI envoient des messages Note On/Off pour déclencher la lecture de notes sonores.
- **Gestion des couleurs des pads** : Les pads peuvent s'allumer en différentes couleurs en fonction de la vélocité.
- **Bouton Shift** : Le bouton Shift est identifié par la note MIDI 98 et géré pour s'allumer en fonction de son état.
- **Contrôle des potentiomètres (knobs)** : Visualisation de la rotation des potentiomètres avec animation visuelle.

## Installation

1. **Prérequis** :
   - Node.js (si tu souhaites utiliser avec un serveur local).
   - Un navigateur supportant l'API Web MIDI (par exemple, Chrome).
   - Connexion d'un appareil **Akai APC Key 25** via USB.

2. **Installation du projet** :
   - Clone ce dépôt :
     ```bash
     git clone https://github.com/votre-utilisateur/apc-key25-midi-controller.git
     ```
   - Ouvre le fichier `index.html` dans ton navigateur (de préférence Chrome).

## Utilisation

1. **Lancer le projet** :
   - Ouvre simplement `index.html` dans ton navigateur.

2. **Fonctionnement** :
   - **Touches du clavier** : Appuie sur les touches du clavier MIDI. Les notes sont jouées en fonction de la vélocité.
   - **Bouton Shift** : Le bouton Shift (note MIDI 98) s'allume lorsque tu appuies dessus.
   - **Pads** : Les pads s'allument et changent de couleur en fonction de la vélocité du message MIDI.
   - **Potentiomètres** : Les potentiomètres (knobs) contrôlent des paramètres et sont visualisés avec des indicateurs de rotation.

## Paramétrage des couleurs des pads

Le projet utilise les codes de couleurs suivants pour les pads et les boutons :
- **Vert** : 1
- **Rouge** : 3
- **Orange** : 5
- **Blink Vert** : 2
- **Blink Rouge** : 4
- **Blink Orange** : 6

Les couleurs sont contrôlées en envoyant des messages MIDI spécifiques avec la vélocité correspondante. Tu peux personnaliser les couleurs en modifiant les valeurs dans le fichier `renderer.js`.

## Structure du projet

- `index.html` : Le fichier principal de l'interface utilisateur.
- `renderer.js` : Le fichier JavaScript qui gère les messages MIDI et les interactions avec le **Akai APC Key 25**.
- `style.css` : Fichier de style pour la présentation visuelle.

## Fonctionnalités à venir
- Ajout d'une interface graphique pour la configuration des couleurs des pads.
- Support avancé des modes de jeu personnalisés (mode séquenceur).

## Contributions
Les contributions sont les bienvenues ! Si vous trouvez des bugs ou souhaitez ajouter des fonctionnalités, n'hésitez pas à ouvrir une pull request ou une issue.

## Conditions d'utilisation
1. Ce projet est fourni gratuitement et ne peut pas être utilisé à des fins commerciales. Toute utilisation à but lucratif ou dans le cadre d'un produit ou service commercial est strictement interdite.

2. Si vous utilisez ce projet, que ce soit dans des projets personnels, éducatifs ou open-source, vous devez mentionner l'auteur en ajoutant une attribution dans le code source, la documentation ou tout autre support associé.

## Licence

Ce projet est distribué sous la licence [Creative Commons BY-NC](https://creativecommons.org/licenses/by-nc/4.0/).

### Conditions :
1. **Attribution** : Vous devez mentionner l'auteur original de ce projet.
2. **NonCommercial** : Ce projet ne peut pas être utilisé à des fins commerciales. Toute utilisation commerciale du projet est interdite.

Pour plus de détails, consultez le texte complet de la licence : [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).