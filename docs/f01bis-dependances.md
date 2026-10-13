# F01 bis Correction des dépendances de développement

13 octobre 2026. Correctif isolé sur `feature/01bis-dependances`, à partir de la livraison 38 (`38ac3bd`). Le contrôle de sécurité existant passe à nouveau après correction des deux avis supplémentaires constatés pendant F01.

## Changements

| Dépendance | Avant | Après | Installation concernée |
| --- | --- | --- | --- |
| `shell-quote` | 1.10.0 | 1.12.0 | App mobile et outils React Native |
| `source-map-js` | 1.2.1 | 1.2.2 | App mobile et outils QA |

Les versions corrigées sont verrouillées dans `apps/mobile/package-lock.json` et `tools/qa/package-lock.json`. Elles respectent les plages déjà demandées par leurs dépendances ; aucun override supplémentaire ni paquet direct ajouté. Expo, React Native, Supabase, les modules natifs et les fichiers `package.json` restent aux mêmes versions.

Le [test ciblé](../scripts/test-dependency-security-f01.cjs) rejoint la recette standard dans `qa-suites.json`. Il vérifie que les quatre séparateurs de ligne dangereux après un commentaire sont refusés par le mécanisme de citation shell. Il vérifie aussi les source maps indexées normales et le refus des offsets excessifs, négatifs, fractionnaires et cumulés dans l'app et les outils QA. Les tests ne lancent aucune commande shell et ne développent aucune carte gigantesque.

Les anciens correctifs du postinstall, dont `braces`, `node-forge`, safe-area-context et React Native Web, sont conservés. Aucune exception n'a été ajoutée à la liste d'avis acceptés.

Sources : [avis shell-quote](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), [avis source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). L'avis shell-quote indique une correction à partir de 1.11.0 ; le registre npm propose 1.12.0 au contrôle et cette version compatible a été retenue.

## Résultats

- Réinstallation depuis les lockfiles corrigés et postinstall : réussis.
- Contrôle `check-dependencies-36.cjs` : réussi. Les deux nouveaux avis ont disparu ; aucun avis dans les outils QA ni Calendar au contrôle. L'app conserve les deux anciens avis amont de `braces` et `node-forge`, avec les mitigations et leurs 43 régressions vérifiées. Ce résultat ne signifie pas zéro vulnérabilité annoncée par npm.
- Régressions ciblées sur les dépendances : 15 vérifications réussies.
- TypeScript : réussi.
- Recette métier et DOM : 48 suites sur 48 réussies, dont la nouvelle suite.
- Recette navigateur : 12 suites sur 12 réussies.
- Export web et bundle iOS Hermes : réussis.
- Construction WebApp connectée et export production : réussis ; exclusion des paramètres/comptes de démonstration et retrait des lanceurs de recette vérifiés par le test existant.
- Contrôle des secrets : réussi.

Les preuves détaillées restent locales dans `work/f01bis/`, ignoré par Git. Les essais utilisent les fixtures QA ; aucune donnée métier réelle n'a été modifiée. La WebApp connectée reste servie localement sur le port 8081.

## Portée et suite

Le correctif change les dépendances et leur recette, sans modifier les écrans, les règles métier ou les fonctions serveur. Aucun déploiement Supabase n'est requis. Les réglages iOS locaux et le checksum CocoaPods dépendant du chemin de la machine sont exclus du lot.

La validation physique iPhone demeure ouverte dans F01 : accès à l'équipe Apple de Paul, signature et appareil. Aucun nouveau build signé ou test physique n'est revendiqué pour F01 bis.
