# Audit fonctionnel — App native et WebApp Partant

Audit du 30 septembre 2026, après la livraison UX/UI 34, sur les sources du commit `6869b07`. Cet audit n’applique aucun correctif produit.

**Suivi : les six points F-01 à F-06 ont reçu leurs correctifs dans la [livraison 35](corrections-features-35.md).** Ce rapport conserve les observations antérieures et leurs reproductions. Le script de reproduction doit être exécuté sur son commit historique, pas considéré comme un test de non-régression des sources corrigées.

## Conclusion

**Le cœur de la marketplace existe. Il faut maintenant fermer les parcours incomplets et valider les services réels, plutôt qu’ajouter de nouveaux écrans.** Client, coach et équipe partagent le même moteur métier ; les écarts ci-dessous concernent donc l’app et la WebApp, sauf mention contraire.

Quatre anomalies sont reproduites dans le domaine connecté : suspension contournable par republication, absence de contrôle du rayon à domicile, publication bloquée avec des disponibilités exclusivement ponctuelles, alertes excluant les séances duo. Elles n’étaient pas couvertes par les suites rejouées, qui passent pourtant leurs 167 assertions.

Le MVP de test n’est pas le MVP commercial : le paiement est simulé, aucun compte équipe n’est habilité sur le serveur observé, et la réception push ainsi que Google Calendar restent à valider réellement. La richesse des écrans ne suffit pas à déclarer ces fonctions opérationnelles.

## Méthode et limites

- Revue des commandes serveur, des règles partagées, des écrans client/coach/équipe et de la documentation de livraison.
- Exécution de trois suites existantes : **61 contrôles du domaine connecté, 38 des vérifications, 68 des parcours métier natifs**, tous réussis. Le nom « native » d’une suite ne signifie pas qu’elle tourne sur un iPhone.
- Quatre scénarios supplémentaires exécutés en mémoire avec comptes fictifs, dates figées et moteur connecté. Aucun compte réel, réservation réelle, e-mail, push ou paiement créé.
- Lecture Supabase limitée aux métadonnées des fonctions et aux nombres de comptes équipe, connexions Calendar, appareils et éléments de file push. Aucune donnée personnelle exportée.
- Les recettes navigateur de la livraison 34 et les contrôles API de la livraison 33 sont des **preuves antérieures**, pas des tests intégralement rejoués pendant cet audit.
- Pas de nouvelle compilation Xcode, recette physique iPhone/Android, recette de fournisseur externe ni test de charge. Cet audit fonctionnel n’est pas une certification de sécurité ou de conformité juridique.

Preuves : [reproductions](audits/2026-09-30-features/reproductions.json), [contrôles et observation serveur](audits/2026-09-30-features/verification.json), [script reproductible](../scripts/audit-features-35.cjs). Le script d’audit constate les défauts ; il ne doit pas devenir une suite qui considère ces défauts comme le comportement attendu.

## Inventaire fonctionnel

**Implémenté** : parcours et règles présents, avec preuves locales ou historiques ; ne signifie pas validation de tous les cas sur appareil. **Partiel** : limite fonctionnelle identifiée. **À valider** : branchement présent, preuve réelle manquante. **Simulé / reporté** : ne fournit pas encore le service réel.

### Client

| Fonction | État | Portée et limite |
| --- | --- | --- |
| Exploration sans compte, inscription et séparation des rôles | Implémenté | Les actions importantes demandent une authentification ; pas de bascule libre des comptes réels. |
| Connexions Apple / Google | Implémenté, recette finale à refaire | Apple natif et Google ont été validés par le propriétaire dans des versions antérieures. Cas de retour, expiration et changement de compte du dernier binaire à revalider. |
| Connexion par e-mail | Partiel | Lien réellement envoyé via le fournisseur standard. Le code français demandé n’est pas le mode d’envoi activé ; modèle et saisie facultative ne prouvent pas la réception d’un OTP. |
| Onboarding sport, objectif, budget, secteur | Implémenté | Préférences adaptées à la pratique ; filtres de recherche distincts. |
| Recherche, carte, filtres, profils, comparaison | Implémenté avec limites locales | Géocodage et distances indicatives ; distance inconnue admise par le filtre actuel. Pas de garantie de temps de trajet. |
| Favoris et retour vers son coach | Implémenté | Disponibilités et nouvelle réservation accessibles. |
| Réservation individuel / duo / groupe | Implémenté, paiement simulé | Offre, créneau, lieu, durée, tarif, capacité, conflits et droits contrôlés par le moteur. Zone à domicile non garantie : F-02. |
| Cours collectifs, nombre de places, dernière place | Implémenté | Cours daté distinct d’une simple plage ; capacité et conflits couverts par les tests métier et la recette API antérieure. |
| Confirmation, détail, séances futures et passées | Implémenté | Informations de séance et consignes enregistrées ; statut terminé calculé après l’heure de fin, pas preuve de présence. |
| Modification, annulation, propositions du coach | Implémenté | Règles et notifications internes présentes ; remboursement comptable simulé. |
| Transfert de groupe / annulation partielle | Implémenté | Parcours métier présents ; recette terrain multiappareil à compléter. |
| Réserver à nouveau | Implémenté | Chaque séance est confirmée séparément. Ce n’est pas une réservation automatique de toute une série. |
| Alertes de disponibilité | Partiel | Aucune réservation automatique ; duo exclu à deux participants (F-04), pas de secteur/rayon dans l’alerte globale (F-05). |
| Avis après séance et signalement | Implémenté | Liés à une réservation terminée ; réponse coach et traitement équipe prévus. Ne pas promettre une présence physiquement vérifiée. |
| Visio | Partiel, exploitable manuellement | Offre et réservation possibles ; le coach partage le lien dans la conversation. Pas de génération de réunion ni de bouton de participation alimenté automatiquement. |
| Messagerie et notifications internes | Implémenté | Conversation par personne, reprise d’envoi, brouillons, chapitres et actions. Actualisation périodique, pas une garantie d’instantanéité. |
| Assistance et confidentialité | Implémenté avec opérations à finaliser | Demandes, export de l’espace, suppression et purge présentes ; responsable, procédures et informations publiques à finaliser. |

### Coach

| Fonction | État | Portée et limite |
| --- | --- | --- |
| Création du profil et dossier initial | Implémenté | Dossier obligatoire, pas d’auto-validation connectée ; maintien du parcours convenu. |
| Pièces communes et justificatifs par pratique | Implémenté | Bibliothèque privée, réutilisation, validités et décision par pratique. Vérification humaine ; pas d’habilitation légale automatique. |
| Offres, tarifs, durée, individuel / duo / groupe | Implémenté | Prix et capacité par offre, pratiques et lieux associés, éditeur partagé app/web. |
| Lieux, adresse et consignes | Implémenté | Lieux publics distingués des instructions privées ; domicile à compléter côté contrôle territorial. |
| Disponibilités libres, copie, chevauchements | Implémenté | Le coach choisit ses plages ; pas de cadence imposée ajoutée par cet audit. |
| Dates ponctuelles et fermeture de départs | Partiel | Éditeur et moteur présents, mais publication initiale exige une semaine non vide : F-03. |
| Agenda, rendez-vous et disponibilités | Implémenté | Semaine desktop et lecture mobile adaptées ; détails de plage et de séance distincts. |
| Cours datés, duplication, clients hors Partant | Implémenté | Occupations et gestion des participants prévues ; ne pas confondre duplication de cours et abonnement client. |
| Préparation, suivi client, messages | Implémenté | Consignes et notes ; pas de besoin de réseau social ou de programme d’entraînement complet pour ce MVP. |
| Statistiques, recettes, versements | Simulé pour la finance | Les réservations alimentent les calculs, sans encaissement ni argent versé. Export existant ≠ facturation fiscale automatisée. |
| Google Calendar | À valider | Connexion, synchronisation et conflits codés/déployés ; aucune connexion enregistrée au contrôle serveur. |
| Apple Calendar | Implémenté, portée limitée | Export/ajout de séance, pas de synchronisation iCloud bidirectionnelle. |
| Push iPhone | À valider | Serveur Sandbox et préférences présents ; aucun appareil enregistré au contrôle. Réception physique non prouvée. |

### Équipe et exploitation

| Fonction | État | Portée et limite |
| --- | --- | --- |
| Espace équipe, accès protégé | Implémenté mais non habilité | Aucun compte équipe enregistré sur ce projet ; l’identité de la personne autorisée doit être désignée. |
| Revue des dossiers, retour de pièces, décisions | Implémenté | File, filtres, décisions par pratique, historique et contrôle d’empreinte ; scénario réel à dérouler. |
| Traitement d’assistance / modération | Partiel | Réponse et masquage d’avis présents ; suspension insuffisante (F-01), remboursement réel absent. |
| Demande client « Devenir coach » | Transmission seulement | Crée une demande privée. Pas de procédure complète d’acceptation donnant accès au parcours coach (F-06). Ce choix n’autorise pas une bascule libre des rôles. |
| Traitement de beaucoup de dossiers | Partiel | Pagination visuelle ; pas de prise en charge exclusive d’un dossier, d’assignation ou de pagination métier serveur. Protection contre décisions obsolètes déjà présente. |
| Sauvegarde et reprise | Partiel | Reconstitution métier testée antérieurement ; restauration complète Auth + Storage + réglages externes non démontrée. |
| Distribution et exploitation publique | À préparer | Dernier binaire signé, configuration Production push, recette TestFlight, support et informations publiques restent à finaliser. |

Sources principales : [ProductApp](../apps/mobile/src/product/ProductApp.tsx), [parcours complémentaires](../apps/mobile/src/product/CompleteFlows.tsx), [commandes serveur](../apps/mobile/src/product/connectedDomain.ts), [moteur de réservation](../apps/mobile/src/product/model.ts), [règles](../apps/mobile/src/product/workflows.ts), [espace équipe](../apps/mobile/src/product/web/TeamReviewWorkspace.tsx), [état des intégrations](../ETAT_DU_PROJET.md#3-intégrations--état-réel).

## Anomalies et parcours incomplets

### F-01 — P1 — Une suspension équipe ne bloque pas la republication

**Reproduit.** L’équipe traite un signalement avec « Suspendre le profil ». Le profil est dépublié, puis le coach peut immédiatement le republier avec la commande normale.

Cause : `resolveTicket` ne modifie que `published: false`. `publicationIssues` et `publish` ne vérifient aucun statut de suspension persistant. [Traitement](../apps/mobile/src/product/workflows.ts#L1136) · [publication](../apps/mobile/src/product/workflows.ts#L475).

**À faire :** statut de suspension protégé côté serveur, motif et historique équipe, levée réservée à l’équipe. Préciser ce qu’il advient des réservations déjà confirmées ; ne pas les supprimer silencieusement.

**Fin :** impossible de republier ou de créer une nouvelle réservation tant que la suspension est active, même par appel direct ; retour à la normale uniquement après décision autorisée.

### F-02 — P1 — Le rayon d’intervention à domicile ne contraint pas la réservation

**Reproduit.** Coach situé à Paris 11e, rayon de 3 km ; une séance à « Place Bellecour, 69002 Lyon » est confirmée par le domaine connecté.

Le rayon est enregistré et affiché, mais la réservation contrôle seulement que l’adresse n’est pas vide. Le texte de configuration indique d’ailleurs qu’il est indicatif dans la simulation. [Validation d’adresse](../apps/mobile/src/product/connectedDomain.ts#L398) · [réservation](../apps/mobile/src/product/model.ts#L467) · [configuration du lieu](../apps/mobile/src/product/CoachPlacesEditor.tsx#L120).

**À faire :** choisir une adresse client normalisée, définir un point ou une zone d’intervention fiable et contrôler l’éligibilité côté serveur avant confirmation. Si l’adresse ne peut pas être résolue, conserver la saisie et proposer une correction ; ne pas confirmer silencieusement hors zone. Garder le supplément de déplacement visible avant réservation.

**Fin :** adresse dans la zone acceptée, hors zone refusée clairement, frontière du rayon et panne de géocodage testées. Le même contrôle couvre une modification de lieu.

### F-03 — P1 — Un coach ne peut pas publier avec seulement des dates ponctuelles

**Reproduit.** Dossier approuvé, offre active, lieu configuré, une date future ouverte 9 h–12 h, semaine récurrente vide : publication refusée avec « Ouvrez votre planning ».

Cause : `publicationIssues` exige `cfg.week.some(...)` et ignore `exceptions`. [Condition](../apps/mobile/src/product/workflows.ts#L475).

**À faire :** reconnaître une disponibilité ponctuelle future réellement réservable et, si pertinent, un cours collectif daté publiable. Évaluer les offres, validités et lieux ; ne pas accepter un simple intervalle passé ou inutilisable. Ne pas imposer une semaine récurrente à tous les coachs.

**Fin :** publication possible avec une offre et une date future valide sans semaine type ; toujours refusée s’il n’existe aucune disponibilité exploitable.

### F-04 — P2 — Une alerte à deux participants écarte le duo

**Reproduit.** Trois départs duo disponibles, budget suffisant et `groupOnly: false` : aucun résultat duo dans l’alerte. L’interface force aussi `groupOnly` dès que le nombre de participants dépasse un.

[Construction de l’alerte](../apps/mobile/src/product/CompleteFlows.tsx#L604) · [filtrage](../apps/mobile/src/product/workflows.ts#L1231).

**À faire :** distinguer le nombre de personnes du choix « uniquement en groupe ». Vérifier le prix total selon la formule (duo vendu comme séance, groupe par place), plutôt que multiplier indistinctement un tarif.

**Fin :** deux personnes retrouvent un duo compatible et les groupes avec deux places ; le filtre explicite « groupe » exclut seul les duos. Budget total et supplément testés.

### F-05 — P2 — L’alerte globale ne conserve pas la zone locale

**Constaté dans le schéma et le moteur ; pas de recette multi-ville exécutée.** L’alerte stocke coach, sport, jour, horaires, budget, places et type de lieu, sans commune, coordonnées ou rayon. « Lieu » signifie ici format (parc, domicile…), pas secteur géographique. Une alerte sur tous les coachs ne garantit donc pas la proximité attendue d’une marketplace locale.

[Champs acceptés](../apps/mobile/src/product/connectedDomain.ts#L604) · [correspondances](../apps/mobile/src/product/workflows.ts#L1231). En recherche classique, une distance inconnue passe aussi le filtre : [ProductApp](../apps/mobile/src/product/ProductApp.tsx#L862).

**À faire :** enregistrer le contexte géographique dans l’alerte et annoncer explicitement une localisation inconnue. Une offre visio doit pouvoir rester indépendante du rayon. L’alerte ciblant un coach précis doit rester simple.

**Fin :** alerte Paris n’affiche pas une offre uniquement présentielle à Lyon ; préférences, prix total et format sont préservés.

### F-06 — P2 — « Devenir coach » n’a pas de procédure de sortie complète

**Constaté dans le code.** Une candidature d’un client devient un ticket d’assistance. L’équipe peut y répondre, mais aucun parcours d’approbation ne conduit ensuite ce client au dossier coach. L’inscription directe comme coach reste un autre parcours fonctionnel.

[Création de la demande](../apps/mobile/src/product/useMarketplace.ts#L510) · [actions équipe](../apps/mobile/src/product/CompleteFlows.tsx#L816).

**À décider avant réalisation :** procédure contrôlée de passage au rôle professionnel, ou inscription professionnelle distincte explicitement accompagnée. Préserver l’historique client et les réservations ; ne jamais offrir un bouton de bascule libre. Une réponse d’assistance seule ne doit pas annoncer l’accès coach comme activé.

**Fin :** après une décision favorable, l’utilisateur sait comment accéder à son dossier professionnel et la procédure aboutit sans manipulation improvisée de la base.

## Ce qui est branché mais pas encore prouvé en situation réelle

Observation Supabase du 30 septembre : fonctions `product-api` v21, `google-calendar` v16, `push-devices` v5 et `push-dispatch` v9 actives. **0 compte équipe, 0 connexion Calendar, 0 appareil push, 0 entrée de file push**. Le statut ACTIVE d’une fonction ne prouve pas qu’une notification a été reçue. Une file vide ne prouve ni succès ni panne d’envoi.

| Priorité | Action | Critère de validation |
| --- | --- | --- |
| P1 pour une bêta avec de nouveaux coachs | Désigner et habiliter un compte équipe | Dossier réel soumis → pièce à corriger → décision par pratique → publication autorisée, avec historique et droits vérifiés. |
| P1 avant de déclarer l’app native prête | Recompiler et tester le dernier binaire signé | Deux comptes distincts sur web/iPhone : création, connexion, configuration, réservation, messages, changement, annulation et reconnexion. |
| P1 si l’on s’appuie sur Google Calendar | Connecter un agenda de test avec consentement | Occupation externe, création, déplacement, annulation, révocation/reconnexion et fuseau vérifiés dans les deux sens prévus. |
| P1 avant de promettre les push | Enregistrer un iPhone et recevoir les notifications | Premier plan, arrière-plan, app fermée, refus, déconnexion, ouverture de la bonne séance ; environnement Production vérifié avant TestFlight. |
| P2 avant bêta élargie | Traiter incidents et absences | Procédure coach absent/client absent/litige définie et testée ; statut « terminé » ne déclenche pas seul une décision financière irréversible. |
| P2 avant plusieurs agents d’équipe | Organiser la file de dossiers | Prise en charge, recherche, tri par ancienneté/action, traitement concurrent et traçabilité ; pagination serveur quand le volume le justifie. |
| P2 avant croissance | Tester charge et reprise | Mesurer conflits et latence de la révision globale/stockage JSON ; restauration complète et reprise après interruption démontrées. Pas de seuil de capacité inventé. |

Les autorisations opérationnelles et les essais fournisseur ne nécessitent pas d’ajouter un abonnement payant à l’interface. Les services reportés restent des décisions séparées.

## Fonctions commerciales encore absentes ou volontairement reportées

- **Paiement réel :** comptes Stripe Connect coach, vérification du bénéficiaire, encaissement, commission, confirmation par événement serveur, remboursements, versements, rapprochement et gestion des échecs. Ce parcours doit devenir une transaction fiable, pas simplement remplacer le bouton de paiement simulé.
- **E-mail personnalisé et code OTP reçu :** configurer l’expéditeur lorsqu’autorisé puis tester connexion et inscription. Ne pas présenter le lien actuel comme un code déjà envoyé.
- **Lancement public :** domaine/hébergement, ouverture des accès OAuth aux utilisateurs concernés, informations de confidentialité complétées, procédures de support et de conservation, distribution et dernières recettes appareils.
- **Outlook, SMS, push Android/navigateur :** non finalisés ou reportés. À reconsidérer selon les plateformes réellement incluses dans le lancement ; l’absence d’Outlook ou de SMS ne bloque pas automatiquement une première bêta iPhone.

## Ce qu’il n’est pas nécessaire d’ajouter maintenant

Abonnement coach, packs complexes, réservation automatique récurrente, vidéo intégrée, réseau social ou programmes sportifs complets. La répétition manuelle et le lien visio partagé par message peuvent suffire au MVP si leur fonctionnement est explicite.

Une liste d’attente automatique serait un futur choix produit : les alertes actuelles n’achètent pas une place et ne constituent pas une file prioritaire. L’ajouter n’est pas nécessaire pour corriger F-04/F-05.

## Ordre recommandé

1. **Corriger F-01 à F-03**, puis ajouter des tests de non-régression pour ces cas et leurs limites.
2. **Terminer les alertes F-04/F-05** et décider la sortie du parcours « Devenir coach » F-06, sans rouvrir une refonte générale.
3. **Habiliter l’équipe et exécuter une recette réelle à deux comptes**, avec iPhone + WebApp, Calendar et push.
4. **Stabiliser l’exploitation** : absences/litiges, confidentialité opérationnelle, restauration et charge adaptées au volume de la bêta.
5. **Reprendre le paiement et la préparation publique quand autorisés.** Une bêta de réservation sans encaissement ne doit pas être annoncée comme une marketplace commerciale terminée.

Le critère de fin utile est concret : un coach vérifié publie une offre réellement réservable, un client la trouve au bon endroit et au bon moment, la réserve, reçoit les informations, peut la modifier ou l’annuler, et l’équipe sait traiter un incident. Pour la version commerciale, l’argent doit ensuite suivre correctement chaque état.
