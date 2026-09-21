# Consolidation du backend et push iPhone — livraison 23

Le propriétaire autorise explicitement la consolidation serveur et les push le 21 septembre 2026. Paiements, SMTP, SMS, Outlook et achats restent reportés. La direction visuelle et les parcours existants sont conservés.

## Ce qui est livré

### Backend

- Lecture conditionnelle de l’état : lorsque version, compte et habilitation n’ont pas changé, le serveur répond sans recharger ni renvoyer l’ensemble des documents métier. Le contrôle d’authentification et le quota s’appliquent toujours.
- L’application espace les lectures inchangées, suspend le polling à l’arrière-plan, empêche les requêtes de rafraîchissement simultanées et augmente l’attente lors des pannes.
- Limite des corps de requête pendant la lecture du flux, rejet des objets invalides et des clés de prototype, erreurs techniques de base non renvoyées au client.
- Nettoyage des historiques techniques en tâche horaire ; suppression des scans de nettoyage à chaque commit. Les protections de version, d’idempotence et de dernière place restent actives.
- Maintenance métier chaque minute, même sans application ouverte : production des rappels, échéances et alertes déjà définis par le domaine partagé.
- Sauvegarde locale des documents métier réalisée et restauration exercée dans une transaction annulée, sans remplacer les données réelles. Les fichiers privés se trouvent dans `.local-backups/`, exclu de Git. Ce n’est pas une sauvegarde complète de Supabase : comptes Auth, fichiers Storage et secrets doivent avoir une procédure séparée avant exploitation commerciale.

### Push

L’iPhone utilise `expo-notifications` pour les permissions et le token natif, puis le serveur communique **directement avec APNs**. Aucun compte Expo/EAS supplémentaire, aucun service payant ajouté. Aucun serveur push général accessible aux clients.

- Activation explicite depuis **client → Compte & notifications** ou **coach → Réglages → Notifications**.
- Interrupteurs pour réservations, modifications/annulations, rappels, messages, avis/assistance/activité. Les préférences métier existantes restent prioritaires.
- Un appareil est lié à un utilisateur **et sa session Auth**. Désactivation locale, déconnexion, suppression de session et de compte retirent les enregistrements associés. Une nouvelle liaison change la génération et invalide les anciens envois.
- Contenu de l’écran verrouillé volontairement discret : aucun texte de message privé, adresse, objectif sportif ou nom de client.
- L’app ouverte actualise son historique ; elle n’affiche pas une seconde bannière système. Un appui à froid ou en arrière-plan ouvre le parcours autorisé du compte actif : conversation, séance ou rubrique concernée, après actualisation des données. Les URLs et identifiants de comptes étrangers ne sont pas utilisés comme destinations.
- Les messages restent dans Messages, sans réapparition d’une rubrique Messages dans les notifications internes.
- Une table privée par préférence, appareil et envoi ; création atomique des envois avec les nouveaux événements métier. Aucun rattrapage des anciennes notifications lors de l’activation d’un appareil.
- Réclamations par lot de 20 maximum, `FOR UPDATE SKIP LOCKED`, bail de deux minutes, quatre appels Apple en parallèle maximum, reprise avec délai croissant et cinq tentatives maximum.
- Nouvelle vérification juste avant envoi : appareil actif, session valide, préférences actuelles, notification non lue/non supprimée. Les changements de séance invalident les confirmations/rappels encore en attente.
- Les tokens refusés définitivement sont désactivés ; les erreurs temporaires sont reprises. Identifiant APNs et collapse-id stables pour les reprises.

**Limite de garantie :** APNs fonctionne au mieux et une réponse acceptée ne prouve pas l’affichage sur l’iPhone. Une panne après acceptation et avant enregistrement peut entraîner une reprise ; il n’y a pas de garantie absolue « exactement une fois ». Une notification déjà transmise au système ne peut pas toujours être rappelée après lecture/modification.

## Configuration en place

- Fonctions : `product-api`, `push-devices`, `push-dispatch` déployées sur le projet de développement existant.
- Le contrôle JWT de passerelle est désactivé intentionnellement : `product-api` et `push-devices` vérifient Auth dans le corps ; le worker exige un secret dédié inaccessible aux clients. Ce n’est pas un accès anonyme aux écritures.
- Deux migrations versionnées : `backend_push_23` et `push_relevance_23`.
- Tâches : `partant-push-dispatch` toutes les minutes ; `partant-housekeeping` chaque heure. La synchronisation Google existante est conservée.
- Secret de planification dans Vault et dans les secrets Edge, jamais dans Git.
- Clé APNs fournie par le propriétaire : Key ID **MZ5QV3HWJ5**, Team **4STLA425HP**, topic **com.paulfajfrowski.partant**, environnement de cette livraison **Sandbox**. La clé de connexion Apple existante n’a pas été modifiée. Le contenu `.p8` est stocké uniquement dans les secrets serveur et le fichier local privé.
- `expo-notifications` **57.0.20** ajouté ; `pod install` réussi, entitlement `aps-environment=development` et capacité Push dans le projet Xcode. Aucun `prebuild --clean` ni remise à zéro de la signature.

## Recette exécutée

- TypeScript et exports web/iOS réussis (bundle JavaScript iOS, pas un nouveau build signé) ; audit npm sans vulnérabilité connue, versions conformes au SDK.
- 61 contrôles du domaine connecté et 19 contrôles d’authentification native avec fournisseurs simulés réussis.
- 36 contrôles sur API/Auth/Storage réels : concurrence des dernières places, permissions et parcours métier préservés.
- 17 contrôles HTTP supplémentaires : authentification push, limites de taille, paramètres invalides, préférences, accès inter-comptes, RPC privées, réponse conditionnelle liée au bon compte.
- Tests SQL transactionnels : queue atomique, absence de doublon au rejeu, baux non volés, mauvaise réponse de worker ignorée, préférences, notification lue, confirmation dépassée, temporisation, token désactivé, révocation de session et droits privés. Toutes les fixtures de ces tests sont annulées par ROLLBACK.
- 29 contrôles du transport/signature/validation avec réponses APNs simulées ; 9 contrôles des permissions, de l’isolation des comptes et de la déconnexion native simulée.
- 29 contrôles DOM des retours de navigation réussis ; ces tests ne valident pas le rendu iPhone.
- Connexion réelle du worker à APNs en HTTP/2 : réponse `BadDeviceToken` pour un token nul volontairement invalide. Aucun appareil réel ciblé ; ceci ne remplace pas un test de réception.
- Mesure indicative en lecture seule sur cette petite base : 532 octets pour une réponse publique complète, 32 pour chacune des cinq réponses inchangées. Ce n’est pas un test de charge ni une mesure représentative d’un catalogue commercial.
- Comptes QA supprimés après essais ; aucun appareil de test ni envoi conservé.

## Recette restante sur l’iPhone

1. Dans Apple Developer, vérifier que Push Notifications est activé et enregistré pour l’App ID Partant.
2. Ouvrir `apps/mobile/ios/Partant.xcworkspace`, sélectionner l’iPhone et relancer le build. Un simple rechargement JavaScript ne suffit pas pour ajouter le module et l’entitlement. Si Xcode demande une actualisation du profil, utiliser la signature automatique avec l’équipe existante.
3. Se connecter, ouvrir les réglages de notifications, appuyer sur **Activer les notifications**, puis autoriser iOS.
4. Avec un second compte, créer une réservation ou un message pendant que l’app du destinataire est en arrière-plan. Attendre le prochain passage de la file (environ une minute, hors délai Apple).
5. Vérifier appui sur la notification, app fermée puis ouverte, désactivation d’une catégorie, lecture avant envoi, modification/annulation et déconnexion. Tester les deux rôles.

Le nouveau binaire n’est pas encore validé sur appareil physique. Le navigateur et le cadre de simulation ne reçoivent pas les push iOS. Les notifications Android/FCM et Web Push ne sont pas implémentées ici.

Avant TestFlight : prévoir une clé APNs autorisée pour **Production**, configurer le serveur pour cet environnement et construire le bundle avec `EXPO_PUBLIC_APNS_ENVIRONMENT=production`. La configuration Sandbox ne doit pas être annoncée comme prête pour une distribution TestFlight.

## Exploitation et limites restantes

Les écritures métier conservent une révision globale et des documents JSON ; cette livraison réduit les lectures et renforce les envois, **elle ne remplace pas ce stockage par une base métier relationnelle partitionnée**. La normalisation, le découpage des conflits et une vraie recette de charge restent à préparer avant de nombreux utilisateurs simultanés. Le petit serveur gratuit n’est pas certifié pour un lancement commercial.

Le worker consomme au plus un lot par minute : adapté à une bêta, à redimensionner avec les quotas si le volume augmente. Les envois expirés et les échecs sont observables côté base privée ; leur rétention est de sept jours. Les tokens sans renouvellement depuis 90 jours sont retirés. Pas de surveillance payante ni d’alerte externe opérationnelle ajoutée.

Advisors : pas de nouveau signalement de sécurité bloquant. Les tables privées sans policies restent volontairement inaccessibles aux clients ([explication RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). L’avertissement antérieur sur la protection des mots de passe compromis demeure ; aucun parcours mot de passe produit n’est ajouté ([documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). Les index neufs peuvent être signalés inutilisés sur cette base peu remplie ; ils servent aux prochains volumes et suppressions par clé étrangère.

## Commandes utiles

Depuis la racine du projet :

```sh
node scripts/test-push-23.cjs
node scripts/test-push-device-23.cjs
node scripts/check-backend-23.mjs
node scripts/check-push-23.mjs
node scripts/check-push-23.mjs --apns
node scripts/backup-product-23.mjs --verify
```

`configure-push-23.mjs` configure de façon répétable le secret de tâche et le cron ; avec chemin absolu `.p8`, Key ID et environnement, il installe la clé APNs sans l’imprimer. Il ne modifie jamais le fournisseur Sign in with Apple. Ne pas committer `.local-backups`, `.env` ou les clés privées.

Sources : [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [APNs : requêtes](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns), [APNs : clés et jetons](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns), [tâches Supabase](https://supabase.com/docs/guides/functions/schedule-functions).
