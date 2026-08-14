# Production OS — Design Specification

Every value here is measured from the Figma file `NgBOa9Lt1AiTeFGEKgft12`, node
by node, normalised to each page's 1920 × 1080 frame origin. **This document
supersedes every measurement given in earlier prompts.** Where they disagree,
this wins.

Nothing here is estimated. If a value is absent it is because it is not in the
design file, and that is stated explicitly.

---

## 0. Global rules

**Reference canvas: 1920 × 1080. Desktop only.**

- Horizontal positions scale as a fraction of 1920.
- Vertical positions scale as a fraction of 1080, **except** elements anchored
  near the bottom (toolbars, strips), which anchor to the viewport bottom.
- Below 1280px wide: show "Production OS requires a wider window."

### Typography — Inter throughout

| Token | px | Used for |
|---|---|---|
| `--text-nav` | 9 | header labels |
| `--text-tool` | 10 | transform tool labels |
| `--text-caption` | 11 | percentages, small captions |
| `--text-list` | 12 | list rows, task names, dates |
| `--text-body` | 15 | descriptions |
| `--text-body-lg` | 16 | list row text |
| `--text-card-title` | 17 | card titles |
| `--text-section` | 18 | section headings |
| `--text-heading` | 24 | page titles |
| `--text-display` | 142 | focus-mode Title |

### Colour

| Token | Hex |
|---|---|
| `--color-canvas` | `#ffffff` |
| `--color-grid-dot` | `#d4d4d4` |
| `--color-ink` | `#000000` |
| `--color-ink-muted` | `#707070` |
| `--color-ink-inverse` | `#ffffff` |
| `--color-line` | `#000000` |
| `--color-line-soft` | `#a9a9a9` |
| `--color-selection` | `#d9d9d9` |
| `--color-nav-idle` | `#ededed` |
| `--color-nav-active` | `#d9d9d9` |
| `--color-placeholder` | `#d9d9d9` |
| `--color-panel` | `#f0f0f0` |
| `--color-task-surface` | `#363636` |
| `--color-task-surface-alt` | `#484747` |
| `--color-task-rail` | `#5dc0d2` |
| `--color-tag-status` | `#b6fdb6` |
| `--color-tag-take` | `#fde4b6` |
| `--color-progress` | `#3cac88` |
| `--color-folder-teal` / `-tab` | `#32717c` / `#b5ffe5` |
| `--color-folder-green` / `-tab` | `#327c53` / `#75d592` |
| `--color-comment-surface` | `#565656` |
| `--color-icon` | `#484747` |

### Grid

26px pitch, 2.5px dot, `--color-grid-dot`.
*(If you prefer the finer grid discussed earlier, use 36px / 1.5px — that was a
deliberate deviation from the file, not a measurement.)*

> **Superseded 2026-08-14.** This section previously read "Fixed to viewport;
> does not pan." The canvas now maintains two independent transforms: dragging
> empty canvas pans the grid (`canvasTransform`), while dragging a line moves
> only the line assembly (`lineTransform`) and leaves the grid still. See
> `CanvasShell`'s `gridTransform` prop and `TimelineCanvas`.

### Stroke weights

`--stroke-hairline: 0.5px` · `--stroke-regular: 1px` · `--stroke-heavy: 3px`

---

## 1. Header (VerticalNav)

**Right-aligned. Its right edge sits at x = 1900 on every page.** The frame
grows leftward as items are added.

| Context | Frame | Items |
|---|---|---|
| Project pages | 268 × 150 at (1632.5, 38) | PROJECT · ASSETS · REPORTS · SETTING |
| Assets pages | 460 × 152 at (1440, 39) | PROJECT · ASSETS · MANAGE · ASSEMBLY · REPORTS · SETTING |

### Structure per item

Measured on the 6-item header, offsets from the frame's left edge:

| Item | Divider x | Label x | Bar |
|---|---|---|---|
| PROJECT | 0 | 15 | — |
| ASSETS | 83 | 98 | **34 × 138 at 83** |
| MANAGE | 171 | 186 | **34 × 138 at 171** |
| ASSEMBLY | 263 | 278 | — |
| REPORTS | 354 | 369 | — |
| SETTING | 434 | 449 | — |

4-item header: dividers at 0, 83, 162, 242; labels at +15 each.

- **Divider**: 1px vector, 138 tall, `--color-line`
- **Label**: 11 wide × 138 tall, `--text-nav` (9px), `--color-ink`,
  `writing-mode: vertical-rl; text-orientation: upright`
- **Active bar**: 34 × 138 `--color-nav-active`, positioned **at the divider x**,
  so the label (15px in) sits **on top of** it. The bar is the label's
  background, not a sibling.
- On Assets pages **two** bars are active simultaneously: ASSETS plus the
  current subsection (MANAGE or ASSEMBLY).
- Below the header on Assets/Focus pages: a 364 × 14 rounded rect at
  (1565, 183–185) — a decorative underline.

---

## 2. Transform tools

Icon 19 × 20, `--color-icon` (`#484747`), label 19 wide × up to 138 tall at
`--text-tool` (10px), 27px below the icon. **Button pitch: 40px.**

| Page | Position | Width | Buttons |
|---|---|---|---|
| Project lines | (101.5, 87) | 186 | ADD · SUB · WHOLE · RESTORE |
| Episodes | (100.5, 86) | 186 | ADD · SUB · WHOLE · RESTORE |
| Scene | (101, 86) | 186 | ADD · SUB · WHOLE · RESTORE |
| Episode Manage | (677, 116) | 66 | ADD · SUB |
| Scene Manage | (637.5, 117) | 106 | **SAP** · ADD · SUB |
| Scene Assembly | (100.9, 86.6) | 106 | HIDE · ADD · SUB |
| Assets library | (105, 62) | 66 | ADD · SUB |
| Assets project view | (79, 62) | 66 | ADD · SUB |
| Assets rows | (505, 28) | 66 | ADD · SUB |
| Assets Assembly (panel open) | **(360, 56)** | 106 | HIDE · ADD · SUB |
| Assets Assembly (panel hidden) | (53, 55) | 106 | HIDE · ADD · SUB |

*Assets Assembly note:* the file places the tools at x=52 even with the 330px
panel open, which overlaps. Reference image 15 shows them clear of the panel.
Use x=360 when open, x=53 when hidden.

---

## 3. List panel (Projects / Episodes / Dates)

| Property | Value |
|---|---|
| Backing plate | 119 × 345, radial gradient white → transparent |
| Frame | 116.5 wide |
| Height | 345 (Projects page) · **323** (Episode/Scene pages) |
| Position | (14, 346) Projects · (16–17.5, 414) Episode/Scene |
| **Row pitch** | **46.4px** |
| Row label | 110 × 16, `--text-list`, `--color-ink` |
| Separator | 1px full width, 22px below the label's top |
| Selection chip | 116 × 24, `--color-selection`, behind the row |
| Rows visible | 8 (345 tall) · 7 (323 tall) |

Fades top and bottom via `mask-image`, not per-row opacity.

---

## 4. Project lines page

### The five lines

| Line | Origin | Size | Length | Angle |
|---|---|---|---|---|
| 1 | (247.5, 147.5) | 1103.5 × 449 | 1191.3 | 22.14° |
| 2 | (651, 257.5) | 981 × 408.5 | 1062.7 | 22.61° |
| 3 | (903.5, 235.5) | 442 × 183 | 478.4 | 22.49° |
| 4 | (518, 541.5) | 769 × 327 | 835.6 | 23.04° |
| 5 | (1004, 357.5) | 956 × 403.5 | 1037.7 | 22.88° |

**Angle: 22.6° ± 0.5°.** Use **22.5°** and allow ±0.5° deterministic jitter per
project id so the strata don't look mechanical.

Lines ascend left→right (y decreases as x increases). 1px `--color-line`.
**No drop shadow** — the file's `0 4px 4px rgba(0,0,0,.25)` is a default applied
to every vector including the background, and is not intentional.

### Fade

Measured from the rendered design, as a gradient along the line's axis:

```
  0% → 0.00    52% → 0.85
  8% → 0.15    68% → 0.40
 22% → 0.65    85% → 0.08
 37% → 1.00   100% → 0.00
```

Peak at 37%, not the midpoint.

> **Scope rule, added 2026-08-14.** This endpoint fade is **exclusive to the
> project line**, on the Project page and the Episode page. Episode, scene, day
> and task lines are solid strokes with no endpoint fade — in particular no
> fade-in where a branch meets its parent, so the junction reads as attached.
> The Scene page's vertical episode spine is an episode line and is therefore
> solid too.
>
> The Episode page's bounding-box edge fade (§5) is a **separate** mechanism
> that applies to any line reaching the boundary. The two are named apart on
> purpose — `TIMELINE_LINE_FADE_STOPS` / `PROJECT_LINE_FADE_*` versus
> `BOX_EDGE_FADE_RATIO` — and must not be merged.

### Glow streaks

1123.9 × 474.3 rounded rects at (234.1, 587.2), (612, 667.2), (950, 760.2),
(312, 922.2); plus one 533.2 × 235.6 at (874, 417.3). Radial gradient white →
transparent at 80% opacity. **Independent decorative elements** — not attached
to any line, not masks. `pointer-events: none`.

### Focus mode

| Element | Position | Size |
|---|---|---|
| Title | (329.5, 147) | 680 × 126, `--text-display` |
| Creation Date | (622.5, 346) | 147 × 88, `--text-list` |
| Description | (329.5, 393) | 257 × 395, `--text-list` |
| Connector | (1093.5, 467) | 50 × 13, 0.5px |
| Thumbnail | (1143.5, 468) | 214 × 125, `--color-placeholder` |
| Thumbnail label | (1153.5, 474) | 182 × 96 |

Focused line: 956 × 403.5 at (541.5, 296.5).

---

## 5. Episodes page

### Entrance

- **Project line**: 981 × 408.5 at (457, 317.5) — 1px
- **Episode branches** (0.5px), measured:

| Vector | Origin | Size | Length | Angle |
|---|---|---|---|---|
| 27 | (779, 187) | 401 × 237 | 465.8 | 30.6° |
| 28 | (1063.5, 252.5) | 98.5 × 94 | 136.2 | 43.7° |
| 30 | (604.9, 454) | 51 × 32.2 | 60.3 | 32.3° |
| 26 | (441, 486.6) | 273.2 × 292 | 400.0 | 46.9° |
| 29 | (529.8, 488.1) | 80.2 × 44.6 | 91.8 | 29.1° |
| 19 | (917.5, 535) | 378.3 × 80.4 | 386.7 | 12.0° |
| 21 | (1102.6, 586.2) | 10.9 × 138.6 | 139.0 | 85.5° |
| 22 | (849.8, 668.1) | 258.6 × 194.8 | 323.8 | 37.0° |

**Branch angles range 12°–85.5°** and lengths 60–466. They are free, not a fixed
slope. Derive both deterministically from the episode id within these ranges.

> **Attachment, added 2026-08-14.** Only two of the eight vectors above touch
> the project line — Vector 19 at t = 0.469 and Vector 27 at t = 0.737; the
> other six are sub-branches of those two. Junctions are now driven by
> `EPISODE_ATTACH_START_RATIO` (0.47) and `EPISODE_ATTACH_GAP_RATIO` (0.27)
> through `getAttachmentPoint`, with the gap compressing when episodes would
> overrun `ATTACH_MAX_RATIO`. Episode start dates no longer move the junction.
>
> **Bounding box.** Episode-page content is bounded by an invisible box: width
> = the project line's full extent, height = topmost branch to bottommost.
> A `<clipPath>` gives the hard edge and a `<mask>` fades lines out at it.
> Toggle the dev overlay with **Shift+B** (development builds only).

### Episode strip

| Property | Value |
|---|---|
| Frame | 1180 × 82 at (335.5, 937) |
| Thumbnail | 152 × 80 |
| x positions | 335.5, 545.5, 755.5, 965.5, 1164.5, 1363.5 |
| Pitch | 210 (first four), 199 (last two) — use **210** |
| Shadow | `6px 10px 4px rgba(0,0,0,.25)` — **keep this one** |
| Fade backing | 1587 × 272 at (185.5, 842) |

Vectors named `Vector 34`–`Vector 45` inside the strip are construction guides.
**Do not render them.**

### Focus mode

| Element | Position | Size |
|---|---|---|
| Title | (343.5, 201) | 680 × 126 |
| Creation Date | (636.5, 400) | 147 × 88 |
| Description | (343.5, 447) | 257 × 395 |
| Connector | (1115.5, 435.5) | 68.5 × 130.5, 0.5px |
| Thumbnail w/ collage | (1184.5, 547) | **424 × 469** |
| Episode list | (17.5, 414) | 116.5 × 323 |

---

## 6. Main Tasks panel

Card 124 wide at **(1766, 225)** ±3 depending on page.

| Part | Offset in card | Size |
|---|---|---|
| Header bar | (0, 0) | 124 × 36, `--color-panel` |
| "Main Tasks" | (22, 9) | 80 × 18, `--text-section` |
| Body | (0, 31) | 124 × 378, `--color-panel` |
| Vertical rail | x 7 | 0.5px × 359 |
| Row dot | x 5 | 5 × 5 ellipse |
| Task name | x 15 | 80 × 12, `--text-list` |
| Percent | x 99 | 25 × 15, `--text-caption` |
| Progress track | x 10 | 110 × 4, `--color-line-soft` |
| Progress fill | x 10 | pct × 110, `--color-progress` |
| "Last commit…" | x 10, +7 below bar | 106 × 19, `--color-ink-muted` |

Row pitch in the mock: 52 / 59 / 81 — content-driven, not fixed. Use a
consistent pitch derived from content height.

---

## 7. Scene page

### The vertical episode line

| State | x | Segments |
|---|---|---|
| Entrance | **957.8** | 0 × 409 from y −25, then 0 × 434 from y 384 |
| Focus | **473.2** | 0 × 1288.7, then 0 × 1367.5 |

1px `--color-line`, running **downward**.

### Day branches — measured

| State | Size | Length | Angle |
|---|---|---|---|
| Entrance | 117.7 × 74 | **139.0** | **32.16°** |
| Focus | 370.8 × 233.1 | **438.0** | **32.16°** |

A second branch type appears at **47.15°**: 279.7 × 301.5 (411.3) at entrance,
881.2 × 950 (1295.8) at focus.

**Zoom factor entrance → focus = 3.15×** (139→438 and 411→1296 both give 3.15).
Angle is identical in both states — only scale changes.

So: day branch angles fall in **32°–47°**, derived deterministically from the day
id. Base length **139px** at rest, multiplied by the current zoom.

### Task cards

| Part | Offset | Size |
|---|---|---|
| Frame | — | 217.7 × 235.6 |
| Tab | (0, 0) | 75 × 25 |
| "Task" label | (6, 4) | 33 × 18 |
| Body | (0, 13) | 155 × 167 |
| Description | (6, 38) | 139 × 129 |

Measured positions: (764.5, 623.2) and (1268.5, 533.2).
Connectors: 40 × 116 at (862, 505.1); 115 × 142.5 at (1186, 533.1) — 0.5px.

Fills: `--color-task-surface` (`#363636`) default, `#8b8b8b` selected.

### Custom Tasks panel

Card 124 wide at (1611, 226).

| Part | Offset | Size |
|---|---|---|
| Header | (0, 0) | 124 × 36 |
| "Custom Tasks" | (12, 9) | 100 × 18 |
| Body | (0, 30) | 124 × 153 |
| Rail | x 6 | 0.5px × 140 |
| Dot | x 4 | 5 × 5 |
| Task name | x 11 | 80 × 12 |
| **Checkbox** | x 75 | 10 × 10 |

Row pitch **51px**. Both panels show simultaneously on the Scene page.

---

## 8. Manage pages (Episode & Scene)

**Not canvas pages** — no dotted grid. Three-column document layout.

| Element | Position | Size |
|---|---|---|
| Parent thumbnail | (14.5, 35) | 97 × 136 |
| Parent name | (131.5, 92) | 578 × 79 |
| Title | (132, 142) | 664 × 29 |
| Preview player | (14.5, 193) | 722 × 389 |
| **Strip thumbnails** | y **614**, x 14.5 + 147·n | 134 × 75, 5 visible |
| Heading ("Scenes"/"Keyframes") | (15, 705) | 211 × 62 |
| Rule | (15, 722) | 735 × 1px |
| Commit rail | (10, 756.5) | 0.5px × 323.5 |
| Latest dot / label / rule | (7, 751) / (17, 746) / (100, 754) | 6×6 / 196×44 / 595.5 |
| Previous dot / label / rule | (7, 897) / (17, 892) / (106, 900) | 6×6 / 179×39 / 595.5 |
| "Tasks" heading | (775, 199) | 311 × 31 |
| Top rule | (768, 224) | 424 × 1px |
| Left vertical rule | (768, 224) | 1px × 898 |
| Task cards | y 253 & 369; x 775, 967, 1158, 1350 | 185 × 105 |
| Detail/To do rule | (768, 618.5) | 828 × 1px |
| Detail tab / To do tab | (775, 619) / (833, 619) | 66 × 32 each |
| Tab labels | (786, 628) / (845, 628) | — |
| To Do rail | (789, 686) | 0.5px × 409 |
| Latest To do dot / label / rule | (786, 679) / (796, 673) / (879, 683) | 6×8 / 196×56 / 596 |
| Next To do dot / label / rule | (786, 864) / (796, 857) / (885, 868) | 6×7 / 179×50 / 596 |
| **To Do checkboxes** | (879.5, 676) and (864.5, 860) | **12 × 12** |
| Entity list panel | (1593, 193) | 319 × 1078 |
| Panel divider | (1594, 219) | 1px × 1052 |
| Entity thumbnails | x 1604, y 219 + 222·n | 308 × 171 |
| Entity name | x 1607, thumb y + 171 | 180 × 22 |

**The strip goes at y 614 — above the heading, below the preview.** It must never
overlap the commit rail.

Scene Manage is identical except: parent name = episode, title = scene, heading
= "Keyframes", tools include SAP, checkboxes present on both pages.

Figma spells it "Lastest". Use **"Latest"**.

---

## 9. Scene Assembly

| Element | Position | Size |
|---|---|---|
| "Scenes list" heading | (14.9, 190.6) | 155 × 41 |
| Current scene thumb | (14.9, 217.6) | **267 × 133** |
| Other scene thumbs | x 15, y 375.6 + 124·n | 199 × 99 |
| Tools bar | (840.9, 979.6) | 235 × 59 |
| Tool buttons | x 840.9, 928.9, 1016.9 | 59 × 59, radius 7 |
| Tool icons | centred | 24–32px, `--color-ink-inverse` |

Button order: **Select · Folder · Comment** (plus Arrow, added later).

### Folder element — 203 × 160

| Layer | Offset | Size | Radius | Fill |
|---|---|---|---|---|
| Back plate | (0, 11) | 203 × 133 | 4 | `--color-placeholder` |
| Tab | (162, 0) | 41 × 61 | 10 | `--color-folder-*-tab` |
| Front | (0, 27) | 203 × 133 | 10 | `--color-folder-*` |
| Label | (12, 52) | 71 × 30 | — | `--color-ink-inverse` |

### Comment element

168 × 28, radius 9, `--color-comment-surface`, text 117 × 15 at (8, 6).

### Image element

**339 × 198**, no radius.

### Arrows

1px `--color-line`, arrowhead 13.5 × 10 to 16.8 × 16.

---

## 10. Assets — poster library

| Element | Position | Size |
|---|---|---|
| Poster | y 227 & 656; x 78, 379, 680, 980, 1282, 1583 | 226 × 345 |
| Column pitch | 301 | |
| Row pitch | 429 | |
| Per row | 6 | |

---

## 11. Assets — project view (Eps. / Asts.)

| Element | Position | Size |
|---|---|---|
| "Eps." label | (99, 150) | 57 × 21 |
| "Asts." label | (156, 150) | 57 × 21 |
| Eps. tab | (148, 177) | 66 × 32 |
| Asts. tab | (206, 177) | 66 × 32 |
| Rule under tabs | (43, 177) | 1353.5 × 1px |
| Episode grid | (96, 258) | 1732 wide |
| Episode cell | 296 × 234 | |
| Cell thumbnail | offset (0, 41) | 296 × 193 |
| Column x | 96, 455, 814, 1173, 1532 — pitch **359** | |
| Row y | 258, 538, 818 — pitch **280** | |
| Name text | thumb y + 193 | 268 × 41 |

**5 per row.** Tabs overlap by 8px as stacked file tabs. Active tab is lighter
(`--color-selection`); inactive darker. **Eps. is the default.**

---

## 12. Assets — rows table

| Element | Position | Size |
|---|---|---|
| Project thumbnail | (31, 29) | 131 × 200 |
| Project Title | (191, 129) | 184 × 38 |
| Episode Title | (191, 212) | 184 × 38 |
| Header rule | (33, 245) | 1851 × 1px |
| "Preview" | (142, 261) | 225 × 28 |
| "Asset name" | (406, 261) | 225 × 28 |
| "Tasks" | (1108, 261) | 250 × 17 |
| "Notes" | (1794, 261) | 69 × 25 |
| Divider 1 | (328.5, 261) | 1px × 825.5 |
| Divider 2 | (571, 261) | 1px × 863.5 |
| Divider 3 | (1736, 261) | 1px × 863.5 |
| Row checkbox | (5, 304) | 22 × 22, radius 3 |
| Row preview | (33, 304) | 278 × 171 |
| Row name | (346, 304) | 211 × 50 |
| Row separators | x 70 (211 wide), 346 (211), 590 (1128), 1758 (137) | 1px |
| **Task cards** | y 289; x 590, 839, 1088, 1337 — pitch **249** | 216 × 171 |

**4 task cards per row, then wrap.** Not a horizontal scroller.

### Task card — 216 × 171, layered back to front

| Layer | Offset | Size | Radius | Fill |
|---|---|---|---|---|
| Back plate | (0, 7) | 216 × 152 | 4 | `--color-placeholder` |
| Tab A | (28, 0) | 13 × 32 | 0 | `--color-tag-take` |
| Tab B | (70, 0) | 13 × 32 | 0 | `--color-tag-status` |
| Mid plate | (0, 13) | 216 × 152 | 10 | `--color-task-rail` |
| Number badge | (159, 0) | 57 × 59 | 15 | `#8b8b8b` |
| Badge text | (168, 5) | 41 × 33 | — | `--color-ink-inverse` |
| Front panel | (0, 19) | 216 × 152 | 4 | `--color-task-surface` |

Front panel contents (all `--color-ink-inverse`): task name (8, 30) 124 × 35;
"Assigned" (8, 107) with underline at (93.5, 119) 110.5 wide and caret at
(185, 99) 24 × 24; "Status" (8, 141) with underline at (93.5, 152) and caret at
(185, 133).

---

## 13. Assets Assembly

| Element | Position | Size |
|---|---|---|
| Project panel | (0, 0) | **330 × 1080**, `--color-selection` |
| "Projects" heading | (121, 56) | 202 × 88 |
| Project card | x 64, y 148 + 318·n | **202 × 282** |
| Tools bar | (842, 981) | 235 × 59 |
| Tool buttons | x 842, 930, 1018 | 59 × 59 |

HIDE collapses the 330px panel; the board fills the viewport. Animate the width
— do not unmount `BoardSpace`.

---

## 14. What the design file does NOT specify

State these as open rather than inventing them:

- Animation durations and easing (focus transition, tool hover, panel collapse)
- Hover and focus-ring styling for any control
- Empty-state copy and layout
- Error and loading states
- Scrollbar styling
- What happens beyond 8 list rows, 6 posters per row, or 4 task cards per row
- Modal and dialog design — no dialog frames exist in the file at all

Every one of these has been invented during implementation. They should be
reviewed against your intent rather than assumed correct.
