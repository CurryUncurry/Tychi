# Tychi

## Lottery logic

We will the right number hardcoded. Once a user submits his gues with the amount of lamports necessary to participate in the lottery, we will create a pda account, using the given number as a seed, as well as a treasury which will hold all the lamports transfered. For every number guessed, we will create a new pda account, if the account already exists, we will add public keys list which will be stored in this pda to represent users' guesses.

## Monorepo layout

```
./
├── lottery-front/    // Tychi UI
└── lottery/          // Solana programs
```
