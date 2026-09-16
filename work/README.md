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

`install-finalization.py`, `refine-finalization.py` et `polish-finalization.py` sont également des scripts de migration déjà appliqués. Ne pas les rejouer. Le module `finalization.js` est conservé pour lecture ; sa version active est intégrée dans `partant.template.html`. Modifier la source HTML puis lancer `build.py`.

Nouveaux tests : `test-finalization.cjs` (117 contrôles) et `test-finalization-dom.cjs` (24 parcours/assertions DOM). Ce dernier utilise jsdom : `npm ci --prefix work/qa-runtime`, puis `node work/test-finalization-dom.cjs`. Le HTML livré reste sans dépendance d’exécution.
