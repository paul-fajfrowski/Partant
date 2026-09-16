# Priorité 2 — 16 septembre 2026

**64 contrôles ciblés passent**, ainsi que les suites existantes de 26 contrôles notifications, 79 contrôles priorité 1 et 168 contrôles de régression. Les suites se recoupent ; il s’agit de vérifications du modèle et du rendu simulé, complétées par les essais navigateur ci-dessous.

## Modèle et rendus vérifiés

- Propositions de prochaines séances aux tarifs et durées actuels, conservation du coach et absence d’achat avant confirmation.
- Transfert plus cher et moins cher, libération et occupation des capacités, maintien de la référence et de la conversation, remplacement des consignes et réinitialisation du mémo de préparation.
- Refus de paiement, cours devenu complet ou fermé, tarif ou réservation modifiés entre le récapitulatif et la confirmation, conflit avec une autre séance : aucune mutation de réservation ni de paiement.
- Annulation partielle remboursable ou hors délai, maintien des places restantes, puis annulation complète sans double remboursement.
- Accès limité au propriétaire dans les nouveaux parcours, conservation après rechargement et notifications liées aux changements.
- Aperçu du remboursement coach limité au solde restant ; export CSV contrôlé avec paiements et remboursements cumulés, commission et net correspondants.

## Parcours navigateur

1. Thomas conserve un cours mercredi à 20 €/personne et ouvre un cours vendredi à 30 €/personne.
2. Alex passe de trois à deux places sur mercredi : remboursement de 20 €, net de 40 €.
3. Le récapitulatif de transfert vers vendredi annonce deux places à 60 € et un supplément de 20 €.
4. Le paiement refusé simulé conserve mercredi et les places initiales. Une nouvelle tentative confirmée déplace les deux places à vendredi.
5. La séance conserve sa référence et affiche 80 € de paiements cumulés, 20 € remboursés, soit 60 € net.
6. Le coach retrouve la notification de transfert. Ses cours affichent chacun 2/6 inscrits : Nina reste mercredi, Alex est vendredi.
7. Depuis l’ancienne séance de Sarah, Alex choisit une proposition mardi à 09 h ; offre à 45 €, récapitulatif et confirmation vérifiés.
8. Le transfert et les montants sont conservés après rechargement. L’activité du coach reflète les remboursements et les soldes.

Récapitulatif de transfert et écran Garder le rythme inspectés à 390 px. Activité inspectée à 320 px, sans débordement horizontal du document ; les montants ne sont pas coupés sur plusieurs lignes. Aucune erreur JavaScript relevée pendant cette passe.

Les remboursements vers un cours moins cher, les changements de conditions pendant une confirmation et les annulations hors délai sont vérifiés dans le modèle, pas tous reproduits manuellement dans le navigateur. L’export CSV est contrôlé dans le modèle ; le téléchargement n’a pas été répété dans cette passe.

Les intégrations réelles, la concurrence entre appareils et l’ouverture directe file:// restent en dehors de cette validation navigateur, réalisée sur l’aperçu HTTP local. Les assets embarqués restent autonomes.

---

# Correctif notifications — 15 septembre 2026

**26 contrôles supplémentaires passent** : génération après réservation et report, ancien/nouveau créneau, absence de doublons, séparation des destinataires, lecture, préférences silencieuses, annulation avec remboursement, persistance, migration sans fausses alertes historiques et réinitialisation. Les suites de 79 et 168 contrôles passent également après ce correctif.

Dans le navigateur : réservation fictive de Nina avec Thomas à 10 h → modification à 15 h → retour sur Thomas → compteur de deux événements et aperçu du report dans l’agenda → rechargement → historique conservé → ouverture de la séance à 15 h → état Lu → fiche client Nina. Le centre de notifications a été inspecté à 390 px. Il s’agit de notifications internes au prototype, sans envoi externe.

---

# Vérification de la priorité 1 — 15 septembre 2026

**79 contrôles ciblés et 168 contrôles de régression passent** sur le modèle JavaScript et le rendu avec un DOM simulé. Les suites se recoupent ; ces nombres ne représentent pas autant de parcours indépendants réalisés dans un navigateur.

Les contrôles ciblés couvrent les comptes distincts, la configuration de plusieurs coachs, les conflits de créneaux, le partage des places d’un groupe, la propriété des conversations et leur lecture, les avis/réponses/modération, les filtres de format, les profils groupe uniquement, l’inscription, la persistance après rechargement et la réinitialisation. La régression vérifie notamment les offres, prix et règles conservés, les pauses, indisponibilités, annulations, alertes, préparation et assistance.

Dans le navigateur, sur l’aperçu HTTP local :

- Alex réserve 3 places à 20 €, puis Nina 2 places dans le même cours de 6 personnes : total Nina de 40 €, une place restante.
- Nina écrit à Thomas ; Thomas voit le non-lu et répond dans la même conversation, sans duplication.
- La séance de Nina est simulée terminée ; son avis est publié, le profil Thomas passe de 86 à 87 avis, puis la réponse du coach s’affiche.
- Le compte coach et ses données sont conservés après rechargement.
- Modification de l’introduction et choix d’un portrait de galerie : la saisie est conservée, l’enregistrement affecte la prévisualisation publique.
- Recherche et profil contrôlés à 390 px ; absence de débordement horizontal du document vérifiée également à 320 px.

L’import de fichier photo est implémenté, mais le sélecteur de fichier du navigateur n’a pas fait l’objet d’un test manuel dans cette passe. Les badges et décisions de modération sont des états fictifs, pas des contrôles effectués par une équipe réelle.

Les réservations simultanées sur plusieurs appareils, la sécurité d’accès côté serveur et les services externes ne sont pas couverts. Les validations historiques ci-dessous décrivent les étapes antérieures et leurs limites, pas des contrôles supplémentaires de cette livraison.

---

# Vérification des parcours prioritaires et groupes — 14 septembre 2026

Cette étape précédente passait **168 contrôles de logique et de rendu**. Les 106 contrôles du socle sont complétés par les alertes (doublons, fermeture de créneau, mise en pause, conversion), les consignes conservées, les demandes d’assistance sans annulation automatique, les remboursements plafonnés et non rejouables, les cours datés, la capacité, les conflits et les annulations de groupe.

Dans le navigateur : alerte mardi à 19 h → réservation Thomas 50 € → préparation → demande d’assistance → décision de remboursement 50 € visible dans le dossier. Offre groupe créée à 20 €/personne, maximum 6, cours mercredi à 18 h ; inscription client de 3 personnes à 60 €, puis vérification côté coach de 3/6 participants. Les capacités et remboursements sont également contrôlés dans le modèle.

La validation est locale et ne prouve pas la résistance à des réservations simultanées entre plusieurs utilisateurs réels.

---

# Vérification V2 — 14 septembre 2026

La V2 passe **106 contrôles de modèle et de rendu** : connexion et code invalide, onboarding et retour entre étapes, préférences, sélection de coachs, offres et durées personnalisées, prix conservés, conflits, pauses, temps tampon, règles conservées, publication, indisponibilités, annulation coach, notes privées, messages et rendu des nouveaux écrans.

Dernier audit : recherche à toutes les demi-heures, refus des plages trop courtes pour les offres, garde de publication et réinitialisation complète des préférences. Recherche du mardi 15 septembre à 09:30 également vérifiée dans le navigateur : Thomas est proposé avec réservation directe.

Ajout du 14 septembre : objectifs running puis yoga vérifiés dans le navigateur, retrait de l’objectif incompatible, recherche de Versailles par 78000 et filtre Yvelines, conservation du budget de 80 €, résumé de préférences actualisé. Sélecteur contrôlé visuellement à 390 px ; Saint-Denis est classé avant les communes dont seul le département correspond. Le modèle contrôle également la couverture des huit départements, les arrondissements, les recherches sans accents et la bascule vers la visio.

Parcours supplémentaires exercés dans le navigateur :

- Création coach vérifiée dans le modèle : checklist affichée, publication bloquée tant que le dossier est incomplet.
- Connexion client avec refus de 000000 puis acceptation du code fictif 123456.
- Onboarding Pilates / mobilité / budget de 50 € / visio : résultat correspondant, Sarah.
- Passage à l’espace coach et persistance du rôle après rechargement.
- Modification de l’offre individuelle en 90 minutes à 65 €.
- Configuration d’une semaine type avec pause quotidienne.
- Réservation de cette offre : 18:00–19:30, total 65 €, confirmation.
- Annulation côté coach : remboursement intégral de 65 €, net prévisionnel remis à zéro.

La configuration du planning a aussi été contrôlée visuellement à 320 px, sans débordement horizontal.

Les vérifications V1 ci-dessous restent l’historique du socle. Le script V2 remplace les attentes V1 basées exclusivement sur des séances de 60 minutes. Le fichier reste autonome ; la vérification visuelle utilise l’aperçu HTTP local. Les services réels (authentification, paiement, documents, notifications et synchronisation) ne sont pas testés car ils ne sont pas implémentés.

---

# Vérification du prototype Partant

Vérifications effectuées le 12 septembre 2026.

## Parcours exercés dans le navigateur

- Choix de demain puis filtre exact à 19:00 ; passage direct vers la séance de Thomas avec conservation du jour et de l’heure.
- Passage en duo : le prix passe à 70 €, conservé au récapitulatif et dans la réservation.
- Paiement simulé, confirmation, détail de séance.
- Modification vers mercredi 16 septembre à 18:30 : date actualisée, prix conservé.
- Message fictif enregistré et affiché dans la conversation locale.
- Ajout aux favoris.
- Annulation : remboursement de 70 € annoncé avant confirmation, puis séance dans l’historique.
- Avis sur la séance passée de Sarah.
- Ouverture de l’espace coach et fermeture du créneau de Thomas à 18:00 : le résultat client ne propose plus cette heure.
- Bascule carte et liste.
- Filtre Pilates dans un rayon de 2 km : état vide, puis récupération via « Élargir ma recherche ».
- Comparaison de Thomas et Idriss.
- Réinitialisation des données de test.

## Mise en page

- Largeurs vérifiées : 320, 390, 768 et 1280 pixels.
- Aucun débordement horizontal du document aux largeurs contrôlées.
- À 390 × 844, le premier portrait, le nom, le tarif et les premiers créneaux sont visibles avant la navigation inférieure.
- Fenêtre de filtres contrôlée à 320 px ; comparatif contrôlé à 768 px ; présentation desktop contrôlée à 1280 px.
- Portraits intégrés avec proportions conservées et recadrage CSS.
- Police et images chargées depuis le fichier, sans hébergement externe.
- Pas d’erreur ou d’avertissement JavaScript relevé dans la console lors du parcours principal.

## Contrôles du modèle

Un script de vérification exécute la logique JavaScript avec un DOM minimal simulé : recherche temporelle, discipline, budget, distance, ville sans offre, visio, prix duo, création de réservation, conflit client, occupation d’un créneau coach, annulation et remboursement, fermeture/réouverture coach, conservation des tarifs déjà payés, repos du dimanche et rendu de toutes les pages.

Les contrôles passent sur la version livrée. Ils complètent les interactions réellement exercées dans le navigateur ; ils ne remplacent pas un test d’application en production.

## Accessibilité et outils

- Boutons natifs, libellés des actions iconographiques, champs étiquetés, focus visible.
- Modales avec l’élément HTML `dialog`, fermeture et navigation clavier natives.
- Notification des changements via une zone de statut ; préférence de réduction des animations respectée.
- Deux outils WebMCP optionnels testés dans le navigateur compatible : lecture des coachs correspondant aux filtres et ouverture d’une séance. Entrée valide vérifiée ; créneau invalide refusé sans réservation.

## Limites de validation

Le navigateur intégré a bloqué l’accès direct à une URL `file://` par sa politique de sécurité. Le parcours visuel a donc été vérifié via un serveur HTTP local. L’autonomie du fichier a été contrôlée dans le code : aucun script, stylesheet, image ou police externe ; aucune requête réseau nécessaire au fonctionnement. L’ouverture directe du fichier dans Safari, Chrome, Firefox ou Edge reste un contrôle à effectuer par le destinataire.

Pas d’audit exhaustif WCAG, de test de lecteur d’écran, de paiement réel, d’intégration d’agenda, de géolocalisation, de validation des justificatifs ou de concurrence multiutilisateur. Le stockage local et la carte simulée ne représentent pas une infrastructure de marketplace en production.


## Finalisation A1–A9 — 16 septembre 2026

337 vérifications existantes restent vertes. 117 nouveaux contrôles passent dans `work/test-finalization.cjs`, et 24 contrôles de formulaires/navigation passent dans `work/test-finalization-dom.cjs` avec jsdom, soit **478 au total**. Les suites historiques figent explicitement l’horloge au 14 septembre 2026 afin de conserver leurs scénarios. Deux scénarios de l’ancienne régression ont été adaptés pour connecter un client avant d’acheter, conformément au nouveau parcours.

Cas couverts : reprise invité en individuel et groupe, compte créé pendant la réservation, contrôle des rôles de présentation, calendrier inter-mois et changement d’heure à Paris, plages par jour, exceptions, refus/interruption/expiration du paiement, nouvelle tentative, validation répétée, perte de disponibilité, unicité des coordonnées, export limité au compte, suppression locale, examen/correction/expiration documentaire, accord/refus/retrait/expiration des propositions, capacité après transfert collectif, rappels et alertes par nombre de places.

Un serveur local sur 127.0.0.1:8766 sert le HTML autonome. L’ouverture du navigateur a été demandée à Codex. Le lancement de Chrome automatisé est bloqué par l’environnement ; aucun contrôle visuel par capture ni audit complet d’accessibilité n’est revendiqué pour cette livraison.


## Validation utilisateur avant publication A1–A9

Le 16 septembre 2026, le porteur du projet a confirmé la revue visuelle mobile du prototype et autorisé son ajout au dépôt GitHub. Cette validation ne constitue pas un audit d’accessibilité, un test automatisé multi-navigateurs ou une validation des services de production.
