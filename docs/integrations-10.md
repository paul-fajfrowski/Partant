# Branchements — 18 septembre 2026

React Native reste la seule version de travail. Aucune modification du prototype HTML de référence.

## Périmètre confirmé

L’utilisateur dispose maintenant de Google Cloud, d’un client OAuth Web et de Google Calendar API activée. Il possède aussi Apple Developer. **Microsoft et Stripe sont explicitement reportés.** SMS, e-mails métier et push ne sont pas activés par cette livraison.

## Ce qui est réalisé

- Connexion Google/Apple intégrée au parcours client et coach, avec détection des fournisseurs réellement activés dans Supabase. Un bouton n’annonce pas un fournisseur inexistant.
- Retour OAuth conservant `data=connected`, session PKCE et écran de création du profil après une première connexion. Les comptes existants retrouvent leur espace.
- Configuration des URL Auth de développement dans Supabase, sans modification des paramètres de confirmation e-mail ou MFA.
- Carte Leaflet/OpenStreetMap réelle, repères de prix et sélection d’un coach, sur le web et en WebView native. Actifs Leaflet intégrés au bundle, licence conservée ; tuiles accessibles sur le réseau. La liste reste disponible.
- Autocomplétion d’adresses IGN dans les lieux du coach. Coordonnées enregistrées avec l’adresse ; modifier le texte invalide l’ancien repère. Domiciles et adresses « Chez le coach » ne sont pas épinglés.
- Distances indicatives à vol d’oiseau à partir du secteur en mode connecté. Ce n’est pas un temps de trajet. Les adresses non localisées restent disponibles dans la liste.
- Edge Function `google-calendar` déployée : consentement distinct du login, PKCE, état à usage unique valable dix minutes, jetons chiffrés AES-GCM liés au coach, renouvellement et reconnexion.
- Écran coach : sélection de 1 à 10 agendas à lire, un agenda en écriture, dernière synchronisation, erreur, synchronisation manuelle et déconnexion explicite.
- Import des occupations Google sur 90 jours, sans titres ni participants. Un échec conserve le dernier import et ferme les disponibilités concernées. Même contrôle côté serveur pour une réservation, une proposition acceptée, un cours ou un rendez-vous direct.
- Export des séances individuelles, duo, cours collectifs et rendez-vous directs. Un événement par cours, quel que soit le nombre de participants. Identifiants stables, reprise après interruption, mises à jour et annulations ; aucun invité ni e-mail envoyé par cette intégration. Les événements passés sont conservés.
- Réconciliation serveur toutes les cinq minutes via pg_cron/pg_net, authentifiée par un secret Vault. Pas besoin de laisser l’application ouverte. Les écritures de calendrier sont sérialisées par un verrou temporaire ; le domaine métier conserve sa révision transactionnelle.
- Avant une action qui prend un nouveau créneau, nouvelle lecture Google puis vérification métier. Une donnée âgée de plus de quinze minutes ne permet plus de réserver.
- Un chevauchement découvert après réservation est signalé au coach ; aucune réservation n’est annulée silencieusement.

## Google activé : consentements à tester

Le code et les fonctions sont déployés. Les identifiants OAuth fournis par l’utilisateur ont été installés côté serveur. **Google Auth et Google Calendar sont maintenant déclarés actifs par les services**, et les deux URL de retour sont acceptées par Google. Le propriétaire doit encore réaliser les consentements dans l’application avant de valider un échange réel d’événements. Aucun agenda personnel n’a été connecté automatiquement. Apple est désormais activé ; voir la section Apple ci-dessous.

Dans Google Cloud, client OAuth **Application Web**, ajouter les URI de redirection autorisées :

```text
https://jhhsysjdeyqsuztjtgea.supabase.co/auth/v1/callback
https://jhhsysjdeyqsuztjtgea.supabase.co/functions/v1/google-calendar/callback
```

En mode Test, ajouter les comptes utilisés dans l’audience Google Auth Platform. Les autorisations Calendar demandées sont `calendar.calendarlist.readonly` et `calendar.events`, uniquement après « Connecter Google Calendar » dans l’espace coach.

Pour renouveler les identifiants, télécharger le JSON du client Web, le garder hors du dépôt et transmettre seulement son chemin local à l’agent. Le téléchargement fourni dans le dossier projet est explicitement ignoré par Git et protégé en lecture/écriture pour son propriétaire. Le script ci-dessous importe les deux identifiants serveur, contrôle un diff limité au fournisseur Google, puis active Google Auth :

```sh
node scripts/configure-google-calendar.mjs /chemin/absolu/client_secret.json
```

Le script ne journalise aucune clé et supprime ses fichiers intermédiaires. La clé de chiffrement `CALENDAR_TOKEN_KEY` est déjà enregistrée dans les secrets Supabase ; **ne pas la remplacer sans migrer les jetons existants**. Pour une autre installation, générer une clé aléatoire de 32 octets encodée base64 avant le premier consentement.

Ensuite, essais réels à effectuer avec consentement du propriétaire :

1. Connexion Google d’un client puis d’un coach ; retour vers le bon compte, sans rôle déduit de métadonnées éditables.
2. Connexion de Google Calendar, sélection des agendas et première synchronisation.
3. Événement occupé dans Google → créneau retiré de Partant.
4. Réservation dans Partant → événement dans Google ; modification, annulation et cours collectif sans doublons.
5. Révocation de Google → état d’erreur, réservations bloquées, reconnexion ; vérification de la tâche planifiée.

## Apple

[Guide pas à pas avec les valeurs Partant](configurer-apple.md).

Le parcours OAuth utilise Supabase et le navigateur sécurisé du téléphone. Les identifiants Apple ont été confirmés par le propriétaire et le secret ES256 installé dans Supabase le 18 septembre. Le Bundle ID et le Team ID Expo sont alignés. Retour autorisé : `https://jhhsysjdeyqsuztjtgea.supabase.co/auth/v1/callback`. Aucune clé `.p8` n’est demandée dans le chat.

Supabase déclare Apple actif et le départ OAuth redirige vers le bon Services ID ; le bouton est disponible dans la simulation connectée. Le consentement et l’échange réel restent à tester. Renouveler le secret avant le 17 mars 2027 à 08:55:30 UTC, selon le guide ci-dessus. Vérifier ensuite l’adresse masquée Apple, un compte existant et un development build signé. Apple Calendar dispose de l’export ICS par séance ; **aucune synchronisation iCloud n’est annoncée**.

## Validation et limites

Vérifications exécutées : 56 assertions du domaine connecté, 16 scénarios Google contrôlés, 13 contrôles HTTP du point d’entrée Google, 11 contrôles OAuth déployés (départ, PKCE, refus, rejeu) et 10 assertions SQL d’accès/état/verrou, en plus des régressions existantes.  TypeScript, exports web/iOS/Android ; domaines métier et écrans DOM ; API Supabase/Auth/Storage réelles ; état OAuth et verrous en SQL transactionnel ; chiffrement, fuseaux, doublons, déplacement, annulation et panne Google avec réponses fournisseur contrôlées. Les comptes temporaires sont supprimés après les tests.

Les identifiants Google sont installés ; le consentement réel Google reste à effectuer par le propriétaire. Apple est configuré, son premier échange réel reste à valider. Les tests DOM ne remplacent pas une revue visuelle ni des essais sur téléphone.

Limites restant explicites :

- Le backend conserve les documents JSON et la révision globale décrits dans la livraison 9 ; pas de validation de volume commercial.
- Google et Partant ne partagent pas une transaction distribuée : la relecture réduit la fenêtre de conflit mais ne la supprime pas. Les conflits découverts sont présentés au coach.
- Les synchronisations très volumineuses doivent être paginées en tâches plus petites avant montée en charge. Un verrou expire après trois minutes et interdit ensuite les écritures de l’ancien travailleur.
- Une déconnexion conserve les événements déjà exportés dans Google. Changer l’agenda de destination nécessite de déconnecter puis reconnecter.
- La carte repose sur les adresses sélectionnées. Le contrôle géographique complet des déplacements à domicile et les temps de trajet ne sont pas mis en place par cette livraison.
- OSM/IGN conviennent au développement ; prévoir la capacité et les conditions du fournisseur cartographique avant diffusion à grande échelle.
- Paiement, facturation réelle, SMS/push/e-mails métier, Outlook et recette complète sur appareils restent à faire.

L’advisor constate sept tables privées sans policy : accès client volontairement refusé, RPC limitées au serveur ([explication](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Il conserve l’avertissement antérieur sur la [protection des mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), sans nouveau parcours mot de passe produit.

## Sources

- [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Apple Auth](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [OAuth serveur Google](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Calendar, création d’événements et identifiants](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)
- [Planification d’Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Usage des tuiles OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/)

## Recette du 18 septembre : blocages de connexion

Le premier essai utilisateur a révélé `403 org_internal` chez Google : l’audience OAuth est interne. Dans Google Auth Platform → Audience, passer en **Externe**, conserver **Test**, puis ajouter les comptes de test (également nécessaires pour Calendar). Ce réglage doit être effectué par le propriétaire dans Google Cloud. Les clés et les retours OAuth n’ont pas à être recréés. [Documentation Google](https://support.google.com/cloud/answer/15549945?hl=en).

L’envoi OTP a renvoyé `email rate limit exceeded`. Le service SMTP fourni par défaut est limité à deux envois par heure par projet et aux adresses de l’équipe ; aucune confirmation e-mail n’a été désactivée. **L’utilisateur reporte explicitement tout branchement SMTP et achat de domaine** : essais connectés via Google/Apple, démo locale pour les parcours simulés. [Limites Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

L’interface conserve désormais l’erreur e-mail en français sur l’écran, empêche un double clic de lancer deux actions et impose une pause locale de 60 secondes après un envoi ou un quota e-mail atteint. Cette pause n’annonce pas le rétablissement du quota serveur. Les boutons sociaux restent disponibles. Le message de code envoyé n’apparaît qu’après succès du serveur.

Validation : TypeScript, export web, tests DOM avec réponses Auth contrôlées (quota, absence d’envoi fictif, double clic, disponibilité des boutons sociaux, succès vers la vérification). Aucun e-mail réel envoyé par ces tests. L’audience Google et les échanges OAuth réels restent à valider par le propriétaire.
