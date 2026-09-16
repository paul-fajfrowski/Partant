# Sources et historique de travail

## Fichiers actuels

- `partant.template.html` : source de référence actuelle du prototype.
- `build.py` : seul script nécessaire pour reconstruire le livrable autonome.
- `coaches.png` et `hanken*.ttf` : ressources embarquées par le build.
- `test-priority1.cjs`, `test-notifications.cjs`, `test-priority2.cjs` et `test-regression-p1.cjs` : suites actuelles, à lancer depuis la racine du dépôt.
- `communes-idf.json` : données utilisées pour construire le sélecteur de secteurs.

## Fichiers conservés pour l’historique

Les scripts `install-*`, `prepare-*`, `finish-*`, `adapt-*`, `refine-*`, `extend-*`, les fragments JavaScript/CSS et les sauvegardes `partant-before-*` / `partant-v1.template.html` décrivent des étapes antérieures. Ils ne sont pas nécessaires au lancement ou au build et ne doivent pas être rejoués sur la source actuelle : des corrections plus récentes y sont déjà intégrées.

Les suites `test-model.cjs` et `test-v2.cjs` sont historiques. Utiliser les quatre suites listées ci-dessus pour la version actuelle.

`install-finalization.py` est un **brouillon inachevé, non appliqué**. Il fait référence à `finalization.js`, qui n’a pas encore été créé. Il est conservé comme trace du travail interrompu pour effectuer la sauvegarde GitHub. Les fonctionnalités A1–A9 ne sont pas livrées dans cette version.
