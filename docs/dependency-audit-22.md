# Audit des dépendances — livraison 22, 21 septembre 2026

## Résultat et limites

Les incompatibilités de versions Expo, les doublons de module natif et l’alerte npm identifiés ont été corrigés. Un avertissement C++ de safe-area-context a un correctif reproductible. Aucun masquage global des warnings, aucune montée majeure React Native, aucune réinitialisation du projet iOS.

Le build complet iPhone après ces changements reste à exécuter dans Xcode. Les contrôles automatisés ci-dessous ne remplacent pas cette validation. Le build précédent et Apple natif ont été validés par le propriétaire ; ce n’est pas une validation du nouveau binaire.

## Journal analysé

Journal Xcode fourni pour la livraison 21 : 1 783 occurrences au format fichier:ligne:colonne, soit **552 diagnostics distincts** avec le parseur livré (chemins normalisés, message et emplacement conservés). Ce ne sont pas 552 bugs : architectures, interfaces générées et dépendances produisent plusieurs diagnostics pour une même cause. Aucun diagnostic `error:` de compilation détecté, mais pas de marqueur final `BUILD SUCCEEDED` dans l’extrait.

Le relevé détaillé est dans [xcode-warnings-baseline-22.json](xcode-warnings-baseline-22.json). Il s’agit de l’état **avant corrections**, pas d’une mesure du build suivant. Les commandes et variables d’environnement du journal ne sont pas copiées.

## Corrections appliquées

| Élément | Avant | Après / justification |
| --- | --- | --- |
| Expo | 57.0.23 | 57.0.24, correctif attendu dans SDK 57 |
| Metro runtime | 57.0.15 | 57.0.16 |
| Image picker | 57.0.18 | 57.0.19 |
| Sharing | 57.0.20 | 57.0.21 |
| expo-constants | Plusieurs copies natives | Une copie 57.0.19 après déduplication |
| uuid dans l’outil xcode | 7.0.3 | Override **limité à xcode**, version 11.1.1 corrigée et compatible CommonJS |
| Safe area, C++ | Initialisation top/left/bottom/right | Ordre top/right/bottom/left identique au code généré, valeurs nommées inchangées |
| CocoaPods | Verrou précédent | `pod install` réussi, 99 pods, verrou synchronisé |

Le correctif safe area est appliqué au `postinstall`, limité à la version 5.7.0 et idempotent. Il n’est pas une modification manuelle perdue de node_modules. Le correctif existant du cache ExpoModulesJSI reste en place.

Les 11 alertes npm initiales étaient la propagation d’un même avis concernant uuid dans les outils de construction. L’outil xcode utilise v4, non concerné par le défaut décrit dans l’avis, mais remplacer la version retire également cette dépendance vulnérable. **Audit npm final : 0 vulnérabilité connue** au moment du contrôle. Cela ne constitue pas un audit de sécurité complet de l’application.

## Avertissements encore à suivre

| Famille | Analyse / décision |
| --- | --- |
| Headers umbrella React/Expo/JSI précompilés | Majorité du bruit, répété par architecture. Relève du packaging fournisseur. Ne pas modifier les frameworks générés ni masquer tous les warnings. |
| Swift Sendable, nullabilité, protocoles | Bibliothèques Expo et modules natifs. Une annotation `@unchecked Sendable` arbitraire pourrait cacher un vrai problème de concurrence ; pas de correction aveugle. |
| APIs iOS dépréciées | Expo, sélecteur de photos, WebView et SVG. Les versions attendues par SDK 57 sont conservées. Une API dépréciée n’est pas nécessairement retirée ni une panne actuelle. |
| Apple Authentication : switch non exhaustif | Nouveaux cas SDK ; présence du chemin `@unknown default`. Tester aussi annulation et refus sur appareil. Suivre le correctif fournisseur, sans remplacer le flux Apple natif validé. |
| WebView : conversions NSUInteger vers masque, initialisations | À suivre avec la prochaine version compatible Expo. Pas de cast masquant la perte de précision ni passage aveugle à une majeure différente. |
| MD2/MD4/MD5 dépréciés dans ExpoCrypto | APIs exposées par la bibliothèque ; Partant utilise SHA-256 pour son nonce Apple. Leur compilation seule ne prouve pas l’usage de ces algorithmes par Partant. |
| Globals JavaScript du bundle Hermes | Globals fournis par le runtime, à distinguer des références réellement absentes. Les tests de parcours passent ; essai du bundle natif toujours requis. |
| Scripts exécutés à chaque build / fichiers stale / symboles absents | Diagnostics de construction à distinguer des erreurs fonctionnelles. Les scripts natifs nécessaires sont conservés. |

Aucun diagnostic de warning n’a été attribué au code natif propre `ios/Partant` dans cet extrait. Des avertissements demeureront donc vraisemblablement : **le nombre après correction n’est pas encore mesuré**.

## Vérifications exécutées

- `expo install --check` : dépendances conformes au SDK.
- Expo Doctor : 20/21 contrôles réussis ; reste l’avis de synchronisation app.json / répertoires natifs versionnés.
- Cet avis n’est pas désactivé : en présence du dossier iOS, modifier app.json ne suffit pas à modifier le projet Xcode. Identifiant, équipe, entitlement Apple, schéma de retour, version, apparence et réglage de script ont été comparés par le test ; les icônes et orientations restent à vérifier visuellement lors d’une évolution de configuration.
- TypeScript : réussi.
- `npm audit` : 0 vulnérabilité connue.
- Export web Expo : réussi.
- Tests du remplacement uuid : génération de 1 000 IDs Xcode distincts et valides, lecture/écriture/relecture du projet sans changement sémantique.
- Correctif safe area : idempotence vérifiée ; compilation et exécution d’un test C++ avec les champs réels du code généré, `-Werror=reorder-init-list`, valeurs de marges conservées.
- Connexion native : 19 contrôles avec réponses des fournisseurs simulées.
- Parcours e-mail : 10 contrôles DOM ; retours de navigation : 29 ; reprise de réservation : 8. Ce ne sont pas des tests physiques iPhone ni des connexions OAuth réelles.

### Limite de compilation locale

`xcodebuild -list` échoue avant compilation : détection du type de workspace par Xcode et connexion CoreSimulator indisponible dans l’environnement d’exécution. Reproduit sur une copie temporaire du workspace ; ce résultat ne démontre pas une erreur du code Partant. Le projet est analysable par l’outil xcode et CocoaPods l’intègre correctement. Aucun changement de configuration à l’aveugle pour contourner cette limitation.

### Recette Xcode à effectuer

1. Ouvrir `apps/mobile/ios/Partant.xcworkspace`, sélectionner Partant et l’iPhone.
2. Relancer le build avec la configuration utilisée lors du dernier succès. Les pods sont déjà installés dans le dossier local ; sur un autre clone, installer les dépendances avec `npm ci` puis les pods.
3. Vérifier lancement, marges de l’écran, Apple, Google, lien e-mail, photo de profil et navigation.
4. Exporter le nouveau journal pour comparer les avertissements, sans confondre le relevé initial avec le résultat final.

Compatibilité supplémentaire à vérifier : le projet conserve le cycle AppDelegate déjà validé sur l’appareil du propriétaire. Expo documente une activation UIScene spécifique dans SDK 57 pour les builds ciblant iOS 27 ; ce changement de cycle de vie n’est pas introduit dans cet audit sans recette native des liens de connexion. Vérifier les versions Xcode/iOS de l’appareil cible avant livraison sur cette cible.

## Rejouer l’audit

Depuis la racine du projet, après installation des dépendances et pods :

```sh
node scripts/test-dependencies-22.cjs
node scripts/audit-xcode-warnings-22.cjs /chemin/du/journal.txt > /tmp/partant-warnings.json
```

Le parseur ne couvre pas toutes les catégories possibles de sorties Xcode ; il regroupe les diagnostics de compilation explicitement localisés. Les lignes non structurées et le résultat final du build restent à lire séparément.

## Sources officielles

- [Mise à jour d’un SDK Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) : alignement des versions et diagnostic.
- [Expo SDK 57](https://expo.dev/changelog/sdk-57) : compatibilité React Native et cycle de vie iOS.
- [Cycle de vie UIScene](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md).
- [Avis uuid GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) : versions corrigées et fonctions concernées.
