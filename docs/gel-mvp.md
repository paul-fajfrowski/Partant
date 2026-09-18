# Gel temporaire du périmètre MVP

> **Validation utilisateur — 18 septembre 2026 :** le propriétaire confirme que les connexions Apple et Google fonctionnent dans la simulation web ; son compte Google a été ajouté aux utilisateurs de test. Le blocage Google est levé pour ce compte. Cette validation ne couvre pas encore Google Calendar, les appareils natifs ni tous les cas secondaires d’authentification.

Décision utilisateur du 18 septembre 2026.

Le périmètre fonctionnel actuel de Partant est temporairement figé. React Native + TypeScript + Expo reste la version de travail ; le prototype HTML validé reste la référence visuelle archivée.

## Prochaine phase : stabilisation et recette

- Vérifier les connexions réelles Google et Apple, l’inscription, le retour vers le bon espace et la reconnexion.
- Valider Google Calendar avec le consentement du propriétaire : occupations, création, modification et annulation des événements.
- Tester les parcours avec deux comptes distincts : configuration coach, publication, découverte, réservation, groupes, messages, modifications et annulations.
- Contrôler les dernières places, les conflits de planning et la cohérence des notifications des deux côtés.
- Préparer une version de développement sur téléphone et vérifier navigation, clavier, autorisations, photos et retour OAuth.
- Corriger les anomalies et les problèmes d’ergonomie rencontrés dans ces parcours, en préservant la direction artistique validée.

Le critère de sortie est un parcours client/coach complet, sans blocage, avec des données cohérentes des deux côtés. Les tests automatisés existants ne remplacent pas les essais réels et ne constituent pas une validation complète du MVP.

## Éléments explicitement reportés

Pas de nouvelles fonctionnalités ni de refonte pendant cette phase sans nouvelle décision utilisateur. Stripe et les reversements/remboursements réels, les communications externes, un fournisseur SMTP et un domaine, ainsi qu’Outlook, restent reportés. Aucune publication dans les stores n’est demandée.

La connexion e-mail reste soumise au quota du fournisseur Supabase par défaut. Les essais connectés privilégient Google/Apple ; la démo locale reste disponible sans authentification réelle. Le blocage Google `org_internal` nécessite un réglage Externe/Test dans Google Cloud ; sa résolution et le premier échange Apple ne sont pas encore confirmés par le propriétaire.

## Sauvegarde

Le dépôt GitHub contient les sources React Native, le prototype et ses actifs, le code serveur et les migrations Supabase, les scripts, les tests et la documentation. Les clés Apple/Google, les fichiers `.env`, les dépendances installées et les caches/exports générés restent exclus. Les données hébergées dans Supabase et les réglages des consoles externes ne sont pas une sauvegarde Git ; leur état et leur configuration sont documentés dans [les branchements](branchements.md), [les intégrations](integrations-10.md) et [Apple](configurer-apple.md).
