# Confidentialité — livraison 25

Demande du 22 septembre 2026 : information légère à l’inscription, pas de consentement global ni de multiplication de formulaires. La version de travail reste React Native ; le prototype HTML de référence est intact.

## Parcours livrés

- **Avant l’authentification** : information courte adaptée au rôle, liens vers la notice et les conditions de la version de test avant l’e-mail, Google ou Apple. Les liens sont aussi disponibles à la finalisation du profil social. Retour conservant le formulaire ; aucune case « J’accepte le RGPD », aucune permission déclenchée par consultation.
- **Client et coach** : entrée Confidentialité dans l’espace personnel / les réglages. Notice organisée en rubriques dépliables accessibles sans compte ; conditions distinctes ; liens vers les réglages des notifications et, pour le coach, des agendas.
- **Données** : export JSON des données disponibles dans l’espace, actualisé en connecté, avec portée explicitée. Il ne constitue pas un export complet de tous les systèmes. Les justificatifs binaires, journaux et données des fournisseurs ne sont pas inclus.
- **Demandes** : accès, rectification, effacement, portabilité, opposition/limitation et question. Précisions facultatives. La commande privée `report` existante enregistre la demande pour le compte authentifié ; seul ce compte et l’équipe habilitée la voient. Attente et confirmation après réponse serveur, contenu conservé en cas d’échec, suivi dans l’assistance. Pas d’e-mail externe envoyé ni de résolution automatique annoncée.
- **Suppression** : action déplacée dans Confidentialité avec confirmation et sortie après réponse serveur. Une erreur ne ferme plus le compte de façon optimiste. Les limites de la suppression existante sont explicites ; une demande d’effacement reste disponible même si les séances confirmées bloquent le libre-service.
- **Collecte contextuelle** : mentions courtes sur la confidentialité des justificatifs, les adresses de lieux rendues publiques, le recours à l’IGN, les notifications facultatives et la connexion Calendar distincte du login Google. Aucun GPS ajouté. Pas de demande de permission au démarrage.

## Ce qui n’est pas une preuve de consentement

La notice est versionnée (`privacyContent.ts`). Les demandes indiquent la version consultable, pas une acceptation ni une preuve de lecture. Aucun consentement publicitaire n’est créé. Une future finalité facultative nécessitant un consentement devra avoir un mécanisme propre : choix initial inactif, finalité précise, date/texte/version enregistrés côté serveur et retrait aussi simple. Une permission système n’équivaut pas automatiquement à un consentement RGPD.

Les conditions décrivent les essais actuels sans encaissement ; elles ne sont pas des CGU/CGV commerciales validées. Aucun journal d’acceptation contractuelle fictif n’a été ajouté.

## Avant une ouverture à de vrais utilisateurs

Cette livraison prépare l’expérience et ses actions ; elle ne certifie pas la conformité juridique ou opérationnelle de Partant.

1. **Responsable et contact** : renseigner le nom réel de la personne ou société responsable et son contact, demandés au propriétaire. Aucun nom juridique, domicile, domaine ou e-mail n’est inventé. Les champs restent vides avec une mention claire de version de test. Le contact doit aussi être accessible hors connexion avant lancement.
2. **Traitements** : formaliser le registre, les finalités/bases légales par traitement, les données indispensables/facultatives et la visibilité. Éviter la collecte de santé dans les textes libres ; qualifier tout futur suivi de blessures ou pathologies séparément. Fixer la politique relative aux mineurs.
3. **Conservation et effacement** : décider les durées, mettre en place les purges et vérifier l’effacement de bout en bout (fichiers Storage, photos publiques, anciennes configurations/lieux, données d’agenda, journaux, caches, sauvegardes). La suppression actuelle anonymise une partie des données métier ; elle n’est pas une preuve d’effacement intégral. L’échec éventuel du nettoyage Auth reste à reprendre côté serveur. Ne pas annoncer « tout supprimé immédiatement ».
4. **Droits** : désigner un compte équipe habilité et organiser le traitement, la réponse, les délais légaux et le suivi des demandes. Aucun administrateur propriétaire n’est désigné actuellement. Préparer l’export complet inter-systèmes et la gestion des droits de tiers ; le téléchargement de l’espace ne suffit pas à toute demande d’accès.
5. **Prestataires** : vérifier les accords de sous-traitance, lieux d’hébergement, transferts et garanties pour Supabase, Apple, Google, ainsi que les transmissions IGN/OpenStreetMap. Aucun hébergement exclusivement européen n’est affirmé sans vérification.
6. **Publication** : finaliser la notice/conditions avec ces faits, coordonnées et durées puis vérifier les déclarations App Store. Documenter aussi sécurité, incidents et traitements ultérieurs. Pas de bandeau de cookies publicitaire ajouté à une application qui n’active pas cette finalité.

## Contrôles

- TypeScript et exports web / JavaScript iOS.
- Domaine : propriétaires des demandes, lecture par l’équipe, absence de fuite vers un autre client/coach ou un visiteur, export limité au compte.
- DOM avec serveur simulé (aucune donnée personnelle réelle) : liens avant connexion, accordéons accessibles, conservation des champs au retour, parcours client/coach, demande en attente/erreur/reprise, suppression avec confirmation/erreur/reprise.
- Régressions : domaine connecté, authentification native simulée, push simulés et retours de navigation.

Résultats : 53 contrôles du domaine de confidentialité, 27 contrôles DOM client et 27 coach ; régressions 61 domaine connecté, 19 Auth native simulée, 9 push simulés, 29 retours client et 16 retours d’inscription incomplète.

Les tests DOM et le bundle iOS ne valident pas les gestes, le rendu VoiceOver ou un build Xcode signé. Une recette iPhone reste nécessaire. Aucun nouveau service payant, aucune dépendance, migration, modification des droits serveur ou publication publique n’est requis par cette livraison. Les commandes serveur existantes sont réutilisées.

## Références

- [CNIL — information, transparence et présentation progressive](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence)
- [CNIL — consentement spécifique, libre et révocable](https://www.cnil.fr/fr/les-bases-legales/consentement)
- [CNIL — permissions des applications mobiles](https://www.cnil.fr/fr/permissions-applications-mobiles-recommandations-de-la-cnil-pour-respecter-la-vie-privee)
