# Calcul Insuline

Application web mobile-first pour calculer la dose d’insuline rapide à partir des glucides du repas et de la glycémie actuelle, selon le schéma médical.

## Fonctionnalités

- Saisie de 1 à 6 aliments (poids + glucides pour 100 g)
- Choix du moment de la journée (petit-déjeuner, collations, dîner, souper)
- Saisie de la glycémie actuelle
- Calcul automatique : glucides totaux, compensation (cible), dose repas, dose totale (arrondie au 0,5 U)
- Page **Paramètres** pour modifier le rapport insuline/glucides, la sensibilité et la cible par moment

## Formules

Comme dans la feuille Excel :

1. Glucides aliment = poids × (glucides/100 g) / 100
2. Compensation = (glycémie actuelle − cible) / sensibilité
3. Insuline repas = glucides totaux × (rapport U/10 g) / 10
4. Dose totale = compensation + insuline repas (arrondi au 0,5)

## Sécurité paramètres

Les paramètres médecin sont protégés par un mot de passe (cadenas en haut à droite).

- Mot de passe par défaut : `Trombose2026`
- Modifiable une fois déverrouillé
- La session reste ouverte jusqu’à fermeture de l’onglet (ou verrouillage manuel)

## Données locales

Stockage IndexedDB (`calcul-insuline`) dans le navigateur :

- `schema` — paramètres du schéma médical
- `settings` — hash du mot de passe admin
- `kv` — store libre pour évolutions (aliments, historique, etc.)

## Lancer

```bash
npm install
npm run dev
```
