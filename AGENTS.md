# Partant — décisions persistantes

- Cible : React Native + TypeScript + Expo, iOS/Android, aperçu web local. Aucun développement Swift préalable ni migration Swift → React Native.
- Lire docs/decisions/001-react-native.md et docs/branchements.md avant de poursuivre les intégrations.
- Préserver le prototype HTML validé et sa DA. apps/mobile est le démarrage de l’application connectée, pas encore la totalité des écrans.
- Étapes 1–3 autorisées ; étapes 4 (paiements) et 5 (communications externes) reportées par l’utilisateur.
- Supabase de développement autorisé : jhhsysjdeyqsuztjtgea. Aucun secret dans le frontend ou Git. Les réservations de développement ne sont jamais des paiements.
- Ne jamais modifier le repository Project-H-iOS, utilisé seulement comme référence visuelle.

- Consigne utilisateur confirmée : le prototype est la référence stricte. Reproduire ses écrans et parcours en React Native ; aucune refonte implicite. Lire docs/parite-prototype-react-native.md avant de poursuivre le portage. Ne pas déclarer la parité complète sur la seule base de tests TypeScript/DOM.
