# Audit UX/UI — Partant App et WebApp

**30 septembre 2026 · code examiné : `265fabe` · aucune modification de l’interface.**

## Avis général

Partant possède une identité convaincante : monochrome, typographie lisible, photographies humaines et boutons pilules. La découverte met effectivement les disponibilités au premier plan. Les adaptations ordinateur existent, et le parcours réservation → confirmation est réalisable.

La priorité n’est pas une refonte ni l’ajout de fonctionnalités. Elle est de **mieux conserver l’intention de recherche, hiérarchiser le quotidien du coach et rendre les formulaires plus prévisibles**. Deux points du parcours de réservation doivent être traités avant les prochains tests utilisateurs : la date recherchée perd sa priorité dans le profil, et les conditions d’annulation ne sont pas contextualisées avant confirmation.

Il s’agit d’une revue experte avec manipulations, captures et inspection du code ; pas d’une étude avec de vrais clients/coachs. Les recommandations de composition restent à confronter à leurs usages.

## Méthode et périmètre

- Exécution de l’interface partagée dans Chromium, données fictives isolées par contexte navigateur ; aucun compte réel modifié, aucun e-mail, paiement ou push envoyé.
- Formats principaux : **390 × 844** et **1440 × 1000** ; contrôle complémentaire des réglages à **1080 × 800** et **720 × 900**.
- Parcours : entrée/connexion de démonstration, préférences en trois étapes, recherche, filtre, profil, réservation et confirmation, états vides client, compte ; agenda coach dense, semaine/jour/plage, offres, lieux, dossier, réglages, messages et notifications.
- Deux réservations simulées menées à confirmation, une par format principal. Essai de formulaire invalide et conservation d’un brouillon entre deux rubriques.
- Contrôle axe rejoué sur **20 états à 320, 390, 820 et 1440 px** : zéro violation détectée, zéro débordement horizontal global et aucune exception JavaScript capturée dans cet échantillon.
- Inspection des composants communs pour distinguer les constats sur le web des conséquences probables sur le natif. Aucune évolution des sources produit depuis les corrections `6b681b3` ; les commits suivants concernent configuration Xcode et documentation.

**Limites :** le format mobile est ici le rendu React Native Web, pas une capture de l’iPhone. Clavier iOS, Dynamic Type, VoiceOver, gestes système, OAuth réel et pertes réseau sur appareil restent à vérifier. La revue n’est ni un nouvel audit de sécurité ni une recette de toutes les branches métier (litiges, toutes les variantes groupe, dossier refusé/expiré). Les preuves automatiques ne suffisent pas à déclarer l’accessibilité complète.

Preuves : [galerie locale](audits/2026-09-30-ux-ui/index.html), [observations initiales](audits/2026-09-30-ux-ui/observations.json), [parcours et brouillon](audits/2026-09-30-ux-ui/journeys.json), [édition d’offre](audits/2026-09-30-ux-ui/details.json), [contrôle axe](audits/2026-09-30-ux-ui/accessibility.json). La galerie s’ouvre dans un navigateur après clonage ; les PNG sont aussi consultables directement dans GitHub.

## Ce qu’il faut conserver

- La distinction **disponibilités / rendez-vous**, les plages compactes et le lien vers toutes les plages d’une journée.
- La progression **semaine → jour → plage**. Elle résout déjà une bonne partie de la densité ; il ne faut pas revenir à une longue liste de tous les champs ouverts.
- Les prix et horaires sur les cartes, le tarif total visible dans la réservation et le bouton principal fixe en bas du parcours client.
- La confirmation : date, coach, lieu, accès à la séance et ajout au calendrier. Le parcours a abouti sur les deux formats testés.
- Le dossier organisé en pièces communes puis qualifications par pratique, avec statut global. Le dossier validé du scénario était compréhensible ; les états refusé/expiré n’ont pas été rejoués ici.
- Une conversation par personne ; notifications séparées des messages, rubriques et pagination. Ne pas ajouter une seconde organisation concurrente.
- La conservation effective du brouillon d’offre lors d’un aller-retour vers les lieux : le texte saisi a été retrouvé. La proposition ci-dessous améliore sa visibilité, pas un effacement de saisie qui aurait été constaté.

## Constats et corrections proposées

**P1 :** à corriger avant la prochaine recette de réservation. **P2 :** amélioration importante avant une bêta élargie. **P3 :** finition et hypothèse à valider. Les numéros UX permettent de suivre les corrections indépendamment du backlog technique.

### UX-01 · P1 · Le profil perd la priorité de la date recherchée

**Reproduit sur les deux formats.** Explorer → « Demain » → profil de Thomas → « Prochain départ ». La recherche concernait le 1er octobre ; le profil propose le 30 septembre à 18 h 30, puis ouvre la réservation à cette date. La date n’est pas cachée, mais le parcours détourne l’intention initiale.

Le composant calcule le prochain créneau à partir d’aujourd’hui, indépendamment de la sélection de recherche : [ProductApp.tsx](../apps/mobile/src/product/ProductApp.tsx#L2358).

**Recommandation :** afficher d’abord les disponibilités correspondant à la date/heure recherchée. S’il n’y en a plus, expliquer l’absence et présenter un autre jour comme une alternative explicite. Même règle depuis les favoris, la carte et la comparaison lorsque ces entrées conservent une recherche.

**Critère de fin :** « Demain » reste demain jusqu’au récapitulatif, sauf changement volontaire ; un horaire précis conserve aussi son contexte. [Preuve recherche](audits/2026-09-30-ux-ui/journey-390-tomorrow.png) · [réservation obtenue](audits/2026-09-30-ux-ui/journey-390-date-mismatch.png).

### UX-02 · P1 · L’annulation n’est pas assez explicite au moment de réserver

**Reproduit.** Pour une séance réservée le jour même, le récapitulatif indique encore « Annulation gratuite jusqu’à 24 h avant votre séance ». Cette limite est déjà dépassée. À 390 × 844, cette information se trouve sous la première zone visible alors que le bouton de réservation est accessible.

Le texte est générique : [récapitulatif](../apps/mobile/src/product/ProductApp.tsx#L2764). Cette observation porte sur l’explication des conditions, pas sur une erreur démontrée dans le calcul du remboursement.

**Recommandation :** une phrase courte, calculée pour la séance, juste avant le bouton : date/heure limite si encore possible, sinon conditions applicables à une réservation tardive. Le détail reste accessible en second niveau. Ne pas inventer une règle de remboursement différente de celle du moteur.

**Critère de fin :** avant de confirmer, on sait si une annulation sera gratuite et jusqu’à quand, pour une réservation proche comme lointaine. [Capture](audits/2026-09-30-ux-ui/journey-390-checkout.png) · [texte complet](audits/2026-09-30-ux-ui/journey-390-checkout.txt).

### UX-03 · P2 · L’accueil coach fait passer les disponibilités avant les rendez-vous

**Observé avec un agenda rempli.** Sur mobile, grand en-tête, accès Messages/Notifications, deuxième rappel des notifications, sélecteur de dates et disponibilités occupent le premier écran. Aucun rendez-vous du jour n’est visible à l’ouverture, bien que quatre soient présents. Sur ordinateur, les disponibilités repoussent également les cartes des rendez-vous vers le bas.

**Recommandation :** réduire l’en-tête des utilisateurs récurrents ; faire apparaître le prochain rendez-vous ou les rendez-vous du jour en premier. Garder les disponibilités en résumé compact avec accès direct à leur configuration. Réserver le bandeau supplémentaire aux actions urgentes, plutôt qu’au simple nombre de notifications non lues.

**Critère de fin :** sur un écran de 390 × 844, le coach repère sans défilement son prochain rendez-vous, son heure et le client ; les heures ouvertes restent accessibles en un geste. Ne pas introduire de cadence imposée ni supprimer la liberté du planning. [Mobile](audits/2026-09-30-ux-ui/coach-390-home.png) · [ordinateur](audits/2026-09-30-ux-ui/coach-1440-home.png).

### UX-04 · P2 · Liste des offres et éditeur se concurrencent

**Observé avec quatre offres.** Une ligne cliquable et un lien « Modifier… » mènent au même éditeur situé après toute la liste. Après le clic, le champ du nom est à environ y=707 sur mobile et y=831 sur ordinateur ; le reste du formulaire est plus bas. Le changement est discret et cette position dépend du nombre d’offres.

**Recommandation :** une ligne par offre (nom, format, durée, prix, statut) et une entrée « Nouvelle offre ». L’édition ouvre une vue dédiée sur mobile ou un panneau sur ordinateur. Conserver le brouillon existant, annoncer clairement l’offre modifiée et rassembler les actions secondaires dans ce détail.

**Critère de fin :** avec quatre puis vingt offres, cliquer sur une offre affiche immédiatement son titre et les premiers champs sans traverser les autres offres. [Capture après clic](audits/2026-09-30-ux-ui/coach-1440-offer-edit-click.png).

### UX-05 · P2 · Les erreurs ne désignent pas précisément le champ à corriger

**Reproduit.** Dans l’offre existante, effacer uniquement le nom puis enregistrer produit « Vérifiez le nom, le prix, la durée et les places. » Le prix, la durée et les places étaient pourtant valides. Le message transitoire apparaît en bas, alors que le champ fautif est hors de la zone visible.

**Recommandation :** garder la validation serveur et ajouter des erreurs par champ, persistantes jusqu’à correction, avec focus/défilement vers la première erreur. Employer le message global pour les erreurs réseau ou serveur qui ne concernent pas un champ précis.

**Critère de fin :** « Donnez un nom à cette séance » apparaît près du champ concerné ; la saisie restante est conservée ; le lecteur d’écran reçoit l’information. Appliquer le même principe aux formulaires client et coach. [Preuve](audits/2026-09-30-ux-ui/coach-390-offer-error.png) · [validation actuelle](../apps/mobile/src/product/workflows.ts#L602).

### UX-06 · P2 · L’état vide de recherche donne parfois la mauvaise explication

**Reproduit.** Chercher « introuvablexyz » affiche « Aucun coach sur ce créneau », alors que le texte saisi suffit à expliquer l’absence de résultat. L’alerte de disponibilité est alors mise en avant. « Élargir ma recherche » appelle une réinitialisation globale (texte, sport, date, budget, etc.), bien plus large qu’une simple correction de recherche.

**Recommandation :** distinguer absence de correspondance textuelle, absence de coach dans le secteur et absence de créneau. Proposer l’action la plus ciblée : effacer le texte, changer la date ou élargir la zone ; conserver les autres choix. Une remise à zéro complète doit être nommée « Réinitialiser les filtres ».

**Critère de fin :** une faute de saisie n’envoie pas vers une alerte et sa correction ne change pas la date choisie. [Capture](audits/2026-09-30-ux-ui/client-390-empty-search.png) · [état vide](../apps/mobile/src/product/ProductApp.tsx#L2232) · [réinitialisation](../apps/mobile/src/product/ProductApp.tsx#L1068).

### UX-07 · P2 · La sauvegarde demande encore trop d’interprétation

**Observé.** « Appliquer à la journée » enregistre une étape du brouillon, puis « Enregistrer les modifications » valide la semaine. L’explication existe et les brouillons sont conservés : ce n’est pas un défaut de persistance. Mais le bouton d’enregistrement est également présent avant toute modification ; les autres formulaires utilisent plusieurs formulations et placements.

**Recommandation :** conserver le mécanisme de brouillon, homogénéiser la barre d’action et son état : inchangé, modifié, en cours, confirmé, échec. Dans l’éditeur de plage, « Valider cette plage » peut mieux indiquer une étape locale, accompagnée d’une phrase brève. Au niveau de la semaine, afficher une seule fois que les changements restent à enregistrer. Ne pas multiplier les rappels sur toutes les lignes.

**Critère de fin :** après chaque action, le coach distingue ce qui est saisi, conservé localement et réellement publié ; la confirmation n’apparaît qu’après succès serveur. [Semaine](audits/2026-09-30-ux-ui/coach-390-week.png) · [éditeur](audits/2026-09-30-ux-ui/coach-390-slot.png).

### UX-08 · P2 · Certaines pages desktop restent des écrans mobiles élargis

**Observé surtout sur le profil et le récapitulatif client.** La grande photo du profil occupe une forte part de l’écran et les informations de décision suivent en une longue colonne ; le bouton occupe presque toute la largeur. Dans les réglages coach à 1080 px, la navigation globale et la navigation de rubrique consomment environ la moitié de la largeur.

**Recommandation :** garder les composants et règles communs, mais adapter leur composition. Profil desktop : présentation à gauche, date/offre/lieu/tarif dans un panneau de réservation à droite. Réglages : réduire la navigation secondaire sur les petites largeurs desktop et limiter la largeur de lecture des longs formulaires. Garder les pilules pour les actions, pas nécessairement étirer chaque bouton sur toute la page.

**Critère de fin :** à 1440 px, coach, prix et contexte de disponibilité sont visibles ensemble ; à 1080 px et en largeur réduite, le formulaire conserve une place confortable sans supprimer la navigation. Pas de nouvelle source de données ni d’interface métier divergente. [Profil desktop](audits/2026-09-30-ux-ui/client-1440-profile.png) · [réglages 1080](audits/2026-09-30-ux-ui/coach-1080-day.png).

### UX-09 · P2 · Deux lieux indiscernables dans le choix de réservation de la démo

**Reproduit sur la fixture client.** « Square Maurice-Gardette » apparaît deux fois avec la même adresse dans le choix du lieu. La déduplication récente des libellés de la carte client ne couvre pas ce sélecteur.

**Recommandation :** nettoyer la fixture et empêcher les options visuellement indiscernables. Si deux formats/identifiants représentent réellement des prestations différentes, afficher ce qui les distingue. Ne pas fusionner aveuglément des lieux stockés qui possèdent des consignes ou droits différents.

**Critère de fin :** chaque option a un sens identifiable ; une adresse seule ne permet pas de confondre deux offres. Constat limité aux données fictives observées, pas une preuve de doublon dans un compte réel. [Capture](audits/2026-09-30-ux-ui/journey-390-date-mismatch.png).

### UX-10 · P3 · Quelques détails affaiblissent la cohérence de la DA

- Un interrupteur actif apparaît turquoise dans le formulaire d’offre web malgré la palette monochrome. Le `Switch` web possède un état de couleur actif distinct ; la couleur du pouce au repos ne suffit pas à le définir. Harmoniser tous les états et garder les indications de focus accessibles. [Capture](audits/2026-09-30-ux-ui/coach-390-offer-error.png) · [composant partagé](../apps/mobile/src/product/CoachConfiguration.tsx#L58).
- « Prochain départ », « amplitude » et « Appliquer à la journée » demandent davantage d’interprétation que « Prochain créneau », « de… à… » et un verbe indiquant la portée de validation. Garder la personnalité éditoriale dans les titres et des mots concrets dans les actions.
- Flèche Retour et croix Fermer coexistent sur de nombreuses pages ; leurs destinations ne sont pas évidentes visuellement. Conserver les deux lorsqu’elles ont deux effets utiles, avec libellés accessibles précis ; sinon simplifier après vérification du parcours. Aucun nouvel échec de retour n’a été démontré dans cette revue.
- « Trier » mesure environ 30 × 44 CSS px et la flèche de disponibilités environ 39 × 44 sur la carte mobile. Agrandir leur zone tactile sans épaissir visuellement les contrôles. Ce sont des recommandations de confort, **pas** une conclusion de non-conformité WCAG.

**Critère de fin :** mêmes états de bouton/interrupteur sur web et natif, vocabulaire uniforme et actions compréhensibles sans essai-erreur.

## Plan de correction conseillé

1. **Sécuriser l’intention et la décision de réserver : UX-01 et UX-02.** Rejouer date/heure, réservation tardive, alternatives et retour arrière.
2. **Simplifier le quotidien du coach : UX-03, UX-04, UX-05 et UX-07.** Conserver le dossier initial et la liberté complète des horaires ; tester une journée chargée et vingt offres.
3. **Affiner la découverte et le desktop : UX-06, UX-08 et UX-09.** Aucun besoin de réécrire le domaine partagé.
4. **Finition : UX-10**, puis validation tactile, grandes polices, VoiceOver et clavier sur le dernier build iPhone.

Proposition de test avec de vrais utilisateurs : quelques coachs et clients découvrant l’app, invités à réserver demain à une heure précise, configurer une journée chargée, modifier une offre puis expliquer ce qui est enregistré. Observer les hésitations et reprises avant de décider une réduction de l’onboarding ou une modification majeure des notifications. Aucun résultat utilisateur de ce type n’est revendiqué ici.

## Références méthodologiques

La visibilité de l’état, la cohérence et l’explication des erreurs sont les principes retenus pour prioriser les frictions. [Nielsen Norman Group — heuristiques d’utilisabilité](https://www.nngroup.com/articles/ten-usability-heuristics/).

Le seuil WCAG 2.2 AA de taille de cible est de 24 × 24 CSS px, avec exceptions ; 44 px constitue ici un objectif de confort plus exigeant. Les dimensions seules ne permettent pas de conclure à une violation sans examiner l’espacement et les exceptions. [W3C — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Le redimensionnement du texte doit être vérifié jusqu’à 200 % sans perte de contenu ou de fonctionnalité. Une fenêtre de 720 CSS px ne remplace pas à elle seule cette vérification ni Dynamic Type sur iPhone. [W3C — Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).
