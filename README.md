# Bilingual Percolation Calculator

Local React + TypeScript app for estimating CNF/PTFE network formation in solid-state electrodes.

## What it does

- compares the built-in `SE 35 / 24 / 21 wt%` presets
- supports custom cases with preset-style mixed input, direct volume input, or direct weight input
- calculates:
  - converted wt% and vol%
  - `Vth` for random and segregated models
  - `Veff`
  - raw and capped percolation probability
  - conductivity scaling
  - minimum CNF loading required to reach the target probability
- shows every substitution step used in the calculation
- supports English and Korean UI text

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run build
npm test
npm run lint
```

## Notes

- `P0`, `sigma0`, `beta`, `t`, `Vth,ideal`, and accessible-volume rules are intentionally editable assumptions.
- The preset interpretation follows the workflow from the source conversation:
  - `AM wt%` is treated as a total-solid weight fraction.
  - `SE wt%` is treated as a total-solid weight fraction.
  - `CNF wt%` is treated as a total-solid weight fraction.
  - `PTFE wt%` is treated as a total-solid weight fraction.
  - the percolation model then converts those wt% values into `vol%` using the specified densities before calculating `Veff`, `Vth`, `P`, and `σ`.
