# Livraison 34 — améliorations UX/UI partagées

30 septembre 2026. Suite à l’accord du propriétaire sur les dix recommandations de l’[audit UX/UI](audit-ux-ui-2026-09-30.md).

Les corrections sont dans `apps/mobile/src/product`, source commune de l’application native et de la WebApp, pour les modes connecté et démonstration. Le prototype HTML archivé et le projet de référence Project-H restent inchangés. Les captures de l’audit initial décrivent l’état **avant** cette livraison.

## Corrections

| Audit | Comportement livré |
| --- | --- |
| UX-01 | Le profil reprend le jour, l’heure, la période et le lieu de la recherche. Le raccourci propose un créneau correspondant ; une autre disponibilité est présentée explicitement comme une alternative. Le choix de l’offre pertinente est conservé à l’ouverture du profil. |
| UX-02 | La limite d’annulation gratuite est calculée pour la séance et affichée juste avant la confirmation. Si elle est dépassée, la séance restant due est explicitée. Les cours collectifs utilisent leur propre délai enregistré. Les règles de remboursement du domaine ne sont pas changées. |
| UX-03 | En-tête coach mobile compact ; rendez-vous avant les disponibilités ; rendez-vous non terminés prioritaires dans le fil mobile. Le deuxième bandeau est réservé aux actions à traiter, sans répéter les simples notifications non lues. Les rendez-vous passent aussi en premier dans les colonnes desktop. |
| UX-04 | Une ligne par offre et bouton « Nouvelle offre ». L’édition se fait dans une fenêtre dédiée, quelle que soit la longueur de la liste. Le brouillon est conservé lors d’un passage vers les lieux. La mise en pause est accessible dans le détail. |
| UX-05 | Erreurs persistantes près des champs, avec focus sur le premier champ invalide : nom, durée, tarif et capacité de l’offre ; informations requises du profil coach ; adresse e-mail et adresse de séance à domicile côté client. Les validations serveur restent nécessaires et inchangées. |
| UX-06 | Une recherche textuelle vide de résultats affiche le texte recherché et propose de l’effacer sans perdre les autres critères. Le rétablissement général est clairement nommé « Réinitialiser les filtres ». |
| UX-07 | La validation d’une plage modifie le brouillon ; le bouton principal enregistre les modifications. Les réglages inchangés ne peuvent pas être renvoyés inutilement. Suppression des boutons de sauvegarde en double dans les règles et consignes. L’éditeur d’offre connecté attend l’accusé serveur pour se fermer et conserve sa saisie en cas d’échec. |
| UX-08 | Profil ordinateur en deux colonnes : présentation et panneau de réservation. Récapitulatif ordinateur : séance et confirmation côte à côte. Entre 1080 et 1279 px, un sélecteur de rubrique remplace la seconde barre latérale des réglages. Navigation mobile conservée sous le seuil desktop. |
| UX-09 | Le type de lieu distingue les options de même nom/adresse dans la réservation et le profil (parc, studio, domicile…). Aucun identifiant de lieu, accès ou consigne n’est fusionné ou supprimé arbitrairement. |
| UX-10 | Interrupteurs monochromes sur le web, zones tactiles « Trier » et flèche des disponibilités agrandies, vocabulaire concret et retours/fermetures distincts conservés uniquement lorsqu’ils ont une destination utile. Les repères de focus restent présents. Le rôle accessible des portraits est explicite. |

## Vérification

**Résultats consolidés : 42/42 suites métier/DOM et 9/9 suites navigateur réussies, après les reprises ciblées documentées dans les rapports.** La nouvelle suite navigateur comporte 46 contrôles, dont axe sur 11 écrans modifiés ; la suite de règles ajoute 20 assertions. Deux réservations ont été menées jusqu’à confirmation (390 et 1440 px). TypeScript et les deux exports passent.

Les scénarios utilisent des données fictives isolées. Aucun e-mail, paiement, push ou changement de compte réel n’est effectué par cette recette.

- TypeScript et exports WebApp / JavaScript iOS Hermes.
- Régressions métier, interfaces DOM et navigateur via `scripts/qa-33.cjs`.
- Nouvelle suite `test-experience-34.cjs` : frontière exacte du délai d’annulation, changement d’heure Paris, délai propre à la réservation et limites des champs d’offre.
- Nouvelle suite `test-experience-browser-34.cjs` : recherche sans résultat, conservation de demain et d’une heure précise jusqu’à la confirmation, deux réservations complètes, vingt offres, focus des erreurs, reprise de brouillon, sauvegarde active uniquement après modification, réglages à 1080 px.
- `test-settings-24.cjs` étendu à l’éditeur d’offre connecté avec réponses serveur contrôlées : attente, refus et reprise.
- Contrôle axe et débordement horizontal sur 20 états aux largeurs 320, 390, 820 et 1440 px. Captures complémentaires des écrans modifiés.

Les résultats consolidés et captures de cette livraison sont dans [le dossier de recette](audits/2026-09-30-ux34/). Les résultats ne doivent pas être assimilés à une certification d’accessibilité ou à une recette sur iPhone physique.

## Reproduction

Après installation des dépendances décrites dans le README :

```sh
npm --prefix apps/mobile run typecheck
cd apps/mobile
npx expo export --platform web --platform ios --output-dir dist --max-workers 1
cd ../..
node scripts/qa-33.cjs
```

Servir `apps/mobile/dist` localement, installer Chromium avec Playwright, puis :

```sh
PARTANT_QA_URL=http://127.0.0.1:8081 node scripts/qa-33.cjs --browser
npm --prefix apps/web run build
```

Les dépendances QA sont dans `tools/qa`. `PARTANT_QA_CHROME` permet de choisir un exécutable Chrome local ; en CI, le Chromium installé par Playwright est utilisé.

## Xcode et limites restantes

Ouvrir `Ouvrir Partant.command` depuis la copie mise à jour, puis recompiler le schéma partagé Partant. Aucun changement de CocoaPods ni de configuration de signature n’est requis par cette livraison : elle modifie les composants TypeScript partagés.

Le bundle Hermes a été généré, mais **le nouveau build signé et la recette sur iPhone physique ne sont pas déclarés validés**. Restent notamment à vérifier le clavier, Dynamic Type, VoiceOver et les gestes système. Le build natif précédent avait manqué d’espace disque ; aucune nouvelle compilation Xcode complète n’est annoncée ici.

Cette livraison ne finalise pas les sujets commerciaux reportés : paiement, domaine/SMTP, habilitation équipe, obligations opérationnelles de confidentialité, recette réelle agenda/push et distribution. Aucune intégration externe n’a été activée ou redéployée pour ces ajustements d’interface.
