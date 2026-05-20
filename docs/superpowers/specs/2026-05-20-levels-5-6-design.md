# Levels 5 & 6 Design — Manic Miner

**Date:** 2026-05-20  
**Approach:** Terraced Descents (Approach A) — alternating left/right shelves, escalating density

---

## Grid conventions

- 25 columns × 15 rows, 32 px tiles → 800 × 480 px
- Tile ID `1` = solid/collidable, `0` = air
- Rows 13–14 = floor (always filled)
- Items and enemies are placed in the **row above** their landing platform (y = row × 32)
- Object pixel positions: `x = col × 32`, `y = row × 32`

---

## Level 5 — "The Obsidian Vaults"

### Map properties
| Property | Value |
|---|---|
| `o2Seconds` | 30 |
| Items | 14 |
| Enemies | 9 |

### Ground layer — platforms (Ground tile = 1)

| Row | Columns (0-indexed) | Description |
|---|---|---|
| 1 | 0–7 | Left high shelf |
| 3 | 17–24 | Right high shelf |
| 5 | 2–10 | Left-center |
| 7 | 12–20 | Right-center |
| 9 | 0–6 | Left low |
| 11 | 14–24 | Right low |
| 13–14 | 0–24 | Floor |

### Objects

**Portal:** x=736, y=64 (col 23, row 2 — above right high shelf)  
**PlayerStart:** x=0, y=384 (col 0, row 12 — above floor, far left)

**Collectibles** (all 32×32):

| x | y | Platform above |
|---|---|---|
| 32 | 0 | Left high |
| 160 | 0 | Left high |
| 576 | 64 | Right high |
| 704 | 64 | Right high |
| 96 | 128 | Left-center |
| 256 | 128 | Left-center |
| 416 | 192 | Right-center |
| 576 | 192 | Right-center |
| 32 | 256 | Left low |
| 160 | 256 | Left low |
| 480 | 320 | Right low |
| 672 | 320 | Right low |
| 256 | 384 | Floor |
| 544 | 384 | Floor |

**Enemies** (all 32×32, with `patrolDistance` property):

| x | y | patrolDistance | Platform |
|---|---|---|---|
| 96 | 0 | 5 | Left high |
| 608 | 64 | 3 | Right high |
| 672 | 64 | 2 | Right high (guards portal approach) |
| 160 | 128 | 4 | Left-center |
| 448 | 192 | 4 | Right-center |
| 608 | 192 | 3 | Right-center |
| 96 | 256 | 3 | Left low |
| 576 | 320 | 4 | Right low |
| 384 | 384 | 5 | Floor |

---

## Level 6 — "The Final Descent"

### Map properties
| Property | Value |
|---|---|
| `o2Seconds` | 25 |
| Items | 16 |
| Enemies | 11 |

### Ground layer — platforms (Ground tile = 1)

| Row | Columns | Description |
|---|---|---|
| 1 | 0–5 | Left corner shelf |
| 1 | 19–24 | Right corner shelf |
| 3 | 9–15 | Center strip |
| 5 | 0–6 | Left mid |
| 5 | 17–24 | Right mid |
| 7 | 3–7 | Left narrow |
| 7 | 17–22 | Right narrow |
| 9 | 7–15 | Center lower |
| 11 | 0–4 | Left bottom corner |
| 11 | 20–24 | Right bottom corner |
| 13–14 | 0–24 | Floor |

### Objects

**Portal:** x=736, y=0 (col 23, row 0 — above right corner shelf, hardest to reach)  
**PlayerStart:** x=0, y=384 (col 0, row 12 — above floor, far left)

**Collectibles** (all 32×32):

| x | y | Platform above |
|---|---|---|
| 32 | 0 | Left corner |
| 128 | 0 | Left corner |
| 640 | 0 | Right corner |
| 736 | 0 | Right corner |
| 320 | 64 | Center strip |
| 416 | 64 | Center strip |
| 64 | 128 | Left mid |
| 640 | 128 | Right mid |
| 128 | 192 | Left narrow |
| 576 | 192 | Right narrow |
| 256 | 256 | Center lower |
| 416 | 256 | Center lower |
| 32 | 320 | Left bottom |
| 704 | 320 | Right bottom |
| 192 | 384 | Floor |
| 480 | 384 | Floor |

**Enemies** (all 32×32, with `patrolDistance` property):

| x | y | patrolDistance | Platform |
|---|---|---|---|
| 64 | 0 | 3 | Left corner |
| 672 | 0 | 3 | Right corner |
| 352 | 64 | 3 | Center strip |
| 448 | 64 | 2 | Center strip |
| 96 | 128 | 3 | Left mid |
| 608 | 128 | 3 | Right mid |
| 160 | 192 | 2 | Left narrow |
| 608 | 192 | 2 | Right narrow |
| 320 | 256 | 3 | Center lower |
| 448 | 256 | 3 | Center lower |
| 320 | 384 | 5 | Floor |

---

## Difficulty progression check

| Level | O₂ | Items | Enemies |
|---|---|---|---|
| 1 | 90 s | 5 | 1 |
| 2 | 60 s | 7 | 3 |
| 3 | 45 s | 10 | 5 |
| 4 | 40 s | 12 | 7 |
| **5** | **30 s** | **14** | **9** |
| **6** | **25 s** | **16** | **11** |
