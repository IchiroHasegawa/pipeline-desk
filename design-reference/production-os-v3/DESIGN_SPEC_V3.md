# Production OS v3 — Design Specification

> Derived directly and exclusively from the approved design prototype files:
> - `design-reference/production-os-v3/Production OS.dc.html`
> - `design-reference/production-os-v3/Component Sheet.dc.html`
>
> All values quoted verbatim from prototype CSS and component definitions. Anything not present in the prototype is explicitly marked as "not specified".

---

## 1. CSS Custom Properties (Design Tokens)

### Color & Shadow Tokens
The prototype defines tokens under `:root, [data-theme="light"]` and `[data-theme="dark"]`.

| Token | Light Value (`:root, [data-theme="light"]`) | Dark Value (`[data-theme="dark"]`) | Description / Usage |
| :--- | :--- | :--- | :--- |
| `--bg` | `#E8E8E6` | `#0C0C0E` | App background canvas surrounding panels and rails |
| `--panel` | `#F4F4F2` | `#141416` | Main content panel and rail container shell background |
| `--card` | `#FFFFFF` | `#1B1B1E` | Cards, flyouts, dropdowns, inputs, elevated surfaces |
| `--sunken` | `#ECECEA` | `#111113` | Recessed background (stat boxes, metadata wells) |
| `--line` | `rgba(20,20,24,.07)` | `rgba(255,255,255,.06)` | Primary subtle borders, dividers, card outlines |
| `--line-2` | `rgba(20,20,24,.13)` | `rgba(255,255,255,.12)` | Secondary stronger borders, button outlines, pill dividers |
| `--ink` | `#18181B` | `#EDEDEF` | Primary high-contrast text and solid badge backgrounds |
| `--ink-2` | `#56565D` | `#A4A4AC` | Secondary body text, icon idle color, descriptions |
| `--ink-3` | `#8B8B93` | `#6F6F77` | Muted labels, placeholders, captions, disabled hints |
| `--chip` | `rgba(20,20,24,.05)` | `rgba(255,255,255,.06)` | Subtle tag pills, count badges, hover surfaces |
| `--sk` | `rgba(20,20,24,.06)` | `rgba(255,255,255,.06)` | Skeleton loading placeholder blocks |
| `--rail` | `#1F1F22` | `#2A2A2E` | Action rail inner pill background |
| `--rail-ink` | `#9C9CA4` | `#9C9CA4` | Action rail idle icon and text color |
| `--rail-hover` | `rgba(255,255,255,.09)` | `rgba(255,255,255,.08)` | Action rail icon hover background |
| `--rail-active` | `rgba(255,255,255,.17)` | `rgba(255,255,255,.16)` | Action rail active section background |
| `--accent` | `oklch(0.57 0.15 262)` | `oklch(0.68 0.14 262)` | Primary accent (brand blue-purple), selection, active rings |
| `--ok` | `#2FA36B` | `#3DB87C` | Success status, complete progress, connected indicator |
| `--heat0` | `rgba(20,20,24,.06)` | `rgba(255,255,255,.06)` | Base level 0 for heatmaps |
| `--ph1` | `#E3E3E0` | `#2A2A2E` | Missing-image gradient stop 1 |
| `--ph2` | `#CDCDC9` | `#1E1E21` | Missing-image gradient stop 2 |
| `--tip` | `#18181B` | `#F2F2F3` | Tooltip background |
| `--tip-ink` | `#FFFFFF` | `#18181B` | Tooltip text color |
| `--dot` | `rgba(20,20,24,.13)` | `rgba(255,255,255,.09)` | Dot separators and grid indicators |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.03)` | `0 1px 2px rgba(0,0,0,.3)` | Small card shadow, rail outer pill shadow |
| `--shadow` | `0 1px 2px rgba(0,0,0,.05),0 12px 32px rgba(0,0,0,.06)` | `0 1px 2px rgba(0,0,0,.4),0 12px 32px rgba(0,0,0,.35)` | Main panel shadow, switcher circle shadow, tooltips |
| `--shadow-lift` | `0 2px 4px rgba(0,0,0,.04),0 18px 40px rgba(0,0,0,.10)` | `0 2px 4px rgba(0,0,0,.4),0 18px 40px rgba(0,0,0,.5)` | Card hover lifted state shadow |
| `--shadow-lg` | `0 24px 64px rgba(0,0,0,.16),0 2px 6px rgba(0,0,0,.06)` | `0 24px 64px rgba(0,0,0,.6)` | Slide-over panels, switcher dropdown menu |

---

## 2. Measured Dimensions & Layout

### Outer App Shell
- **Viewport**: `100vh` height, `100%` width, `overflow: hidden`, `position: relative`, `box-sizing: border-box`.
- **Outer Padding**: `16px`.
- **Outer Gap**: `16px` between Action Rail and Main Content Panel.
- **Background**: `var(--bg)`.
- **Color Scheme**: `var(--ink)`, `color-scheme: light | dark`.

### Desktop-Only Window Guard (`< 1280px`)
- **Trigger**: Viewport width `< 1280px`.
- **Overlay**: `position: absolute; inset: 0; z-index: 200; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 32px;`
- **Dialog Card**: `max-width: 360px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center;`
- **Icon Circle**: `width: 56px; height: 56px; border-radius: 28px; background: var(--rail); color: #FFFFFF; font-size: 22px; display: flex; align-items: center; justify-content: center;` (Monitor icon)
- **Title**: `font-size: 17px; font-weight: 600; color: var(--ink);`
  - Text: `"Production OS requires a wider window."`
- **Subtitle**: `font-size: 13px; color: var(--ink-2); line-height: 1.5;`
  - Text: `"Resize to at least 1280px wide to continue."`

### Action Rail
- **Column Container**: `width: 68px; flex: none; display: flex; flex-direction: column; gap: 12px;`
- **Upper Container Pill**:
  - `flex: 1; display: flex; flex-direction: column; align-items: center; padding: 6px; border-radius: 34px; background: var(--panel); border: 1px solid var(--line); box-shadow: var(--shadow-sm);`
- **Inner Dark Pill (Top Actions)**:
  - `width: 56px; border-radius: 28px; background: var(--rail); padding: 6px 0 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; box-shadow: 0 8px 20px rgba(0,0,0,.18);`
  - **Logo (Clapperboard)**: `width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 20px;`
  - **Divider**: `width: 22px; height: 1px; background: rgba(255,255,255,.12); margin: 2px 0 4px;`
  - **Action Button**: `width: 44px; height: 44px; border-radius: 22px; border: none; font-size: 19px; padding: 0; display: flex; align-items: center; justify-content: center; transition: background .15s;`
    - Idle: `background: transparent; color: var(--rail-ink); cursor: pointer;`
    - Hover: `background: var(--rail-hover); color: #FFFFFF;`
    - Active: `background: var(--rail-active); color: #FFFFFF;`
    - Disabled: `opacity: 0.3; cursor: not-allowed;`
- **Vertical Page Caption (`railLabel`)**:
  - Container: `flex: 1; display: flex; align-items: center; justify-content: center;`
  - Text: `writing-mode: vertical-rl; transform: rotate(180deg); font-size: 10px; letter-spacing: .26em; color: var(--ink-3); font-family: ui-monospace, Menlo, monospace; text-transform: uppercase;`
- **Bottom Container Pill**:
  - Container: `padding: 6px; border-radius: 34px; background: var(--panel); border: 1px solid var(--line); box-shadow: var(--shadow-sm); display: flex; justify-content: center;`
  - Inner Dark Pill: `width: 56px; height: 56px; border-radius: 28px; background: var(--rail); display: flex; align-items: center; justify-content: center;`
  - Action Button: `width: 44px; height: 44px; border-radius: 22px; border: none; font-size: 19px;`

### Top-Right Page Switcher
- **Position**: `position: absolute; top: 28px; right: 28px; z-index: 80; display: flex; flex-direction: column; align-items: center; gap: 8px;`
- **Avatar Circle (Top)**:
  - Dimensions: `width: 48px; height: 48px; border-radius: 24px; border: 2px solid var(--card);`
  - Background: `color-mix(in oklch, var(--accent) 18%, var(--card))`
  - Text: Initials (e.g. `MK`), `color: var(--accent); font: 600 14px Inter, sans-serif;`
  - Shadow: `var(--shadow)` (hover: `var(--shadow-lift)`)
  - **Owner Badge**: `position: absolute; right: -4px; top: -4px; width: 20px; height: 20px; border-radius: 10px; background: var(--ink); color: var(--panel); display: flex; align-items: center; justify-content: center; font-size: 10px; border: 2px solid var(--panel);` (Crown icon)
- **Current Page Circle (Bottom)**:
  - Dimensions: `width: 48px; height: 48px; border-radius: 24px; font-size: 19px; display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: var(--shadow);`
  - State (Closed): `border: 1px solid var(--line); background: var(--card); color: var(--ink);`
  - State (Open): `border: none; background: var(--ink); color: var(--panel);`
- **Page Switcher Dropdown Bar**:
  - Container: `margin-top: 2px; padding: 5px; border-radius: 28px; background: var(--card); border: 1px solid var(--line); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; align-items: center; gap: 4px;`
  - Backdrop: `position: absolute; inset: 0; z-index: 70;` (clicking closes menu)
  - Items: `width: 40px; height: 40px; border-radius: 20px; border: none; font-size: 17px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;`
    - User items: `background: transparent; color: var(--ink-2);` (hover: `background: var(--chip); color: var(--ink);`)
    - Divider: `width: 22px; height: 1px; background: var(--line-2); margin: 3px 0;`
    - Page items:
      - Active: `background: var(--ink); color: var(--panel); cursor: pointer;`
      - Inactive: `background: transparent; color: var(--ink-2); cursor: pointer;` (hover: `background: var(--chip); color: var(--ink);`)
      - Disabled (Reports): `opacity: 0.35; cursor: not-allowed;`

### Tooltips
- **Styling**: `background: var(--tip); color: var(--tip-ink); font-size: 12px; font-weight: 500; padding: 7px 10px; border-radius: 8px; white-space: nowrap; box-shadow: var(--shadow); pointer-events: none; display: flex; gap: 8px; align-items: center;`
- **Hint**: `<span style="opacity:.55;font-weight:400;">{{ hint }}</span>`
- **Positioning**:
  - Action Rail main: `position: absolute; left: 56px; top: 50%; transform: translateY(-50%); z-index: 90;`
  - Action Rail bottom: `position: absolute; left: 62px; top: 50%; transform: translateY(-50%); z-index: 90;`
  - Page Switcher: `position: absolute; right: 52px; top: 50%; transform: translateY(-50%);`
  - Switcher circles (Avatar / Current Page): `position: absolute; right: 58px; top: 50%; transform: translateY(-50%);`

### Main Content Panel & Header
- **Main Panel**: `flex: 1; min-width: 0; position: relative; display: flex; flex-direction: column; background: var(--panel); border: 1px solid var(--line); border-radius: 28px; box-shadow: var(--shadow); overflow: hidden;`
- **Header Section**: `padding: 26px 112px 20px 36px; display: flex; flex-direction: column; gap: 12px; flex: none;`
- **Breadcrumbs**:
  - Container: `display: flex; align-items: center; gap: 2px; font-size: 13px; flex-wrap: wrap;`
  - Separator: `<span style="color:var(--ink-3);opacity:.6;padding:0 2px;">/</span>`
  - Item: `padding: 3px 6px; border-radius: 6px; font: inherit;`
    - Inactive crumb: `color: var(--ink-3); font-weight: 400; cursor: pointer;` (hover: `background: var(--chip);`)
    - Active (last) crumb: `color: var(--ink); font-weight: 500; cursor: default;`
- **Title Row**: `display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 40px;`
  - Page Title: `font-size: 30px; font-weight: 600; letter-spacing: -0.025em; white-space: nowrap; margin: 0;`
  - Count Badge: `font-size: 12px; font-weight: 600; color: var(--ink-2); background: var(--chip); padding: 3px 9px; border-radius: 999px;`
  - Subtitle: `font-size: 13px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 4px;`
  - Right Slot Container: `display: flex; align-items: center; gap: 10px; flex: none;`

### Content & Cards
- **Content Scroll Area**: `flex: 1; min-height: 0; overflow: auto; padding: 4px 36px 36px;`
- **Project Card**:
  - `display: grid; grid-template-columns: minmax(0,34%) minmax(0,1fr); gap: 28px; padding: 14px; border-radius: 24px; background: var(--card); border: 1px solid var(--line); box-shadow: var(--shadow-sm); outline-offset: -1px; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease;`
  - Hover: `transform: translateY(-3px); box-shadow: var(--shadow-lift);`
  - Selected: `outline: 2px solid var(--accent);`
- **Episode Card**:
  - `display: grid; grid-template-columns: minmax(0,30%) minmax(0,1fr); gap: 28px; padding: 14px; border-radius: 24px; background: var(--card); border: 1px solid var(--line); box-shadow: var(--shadow-sm);`
- **Status Chips**:
  - `display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; padding: 3px 10px 3px 8px; border-radius: 999px;`
  - Dot: `width: 6px; height: 6px; border-radius: 3px; background: currentColor;`

---

## 3. Typography & Weights

- **Font Family**: `Inter, system-ui, sans-serif`
- **Monospace Family**: `ui-monospace, Menlo, monospace` (used for rail labels, thumbnail dimension tags, code snippets)
- **Sizes**:
  - `10px`: Rail vertical label (`font-size: 10px; letter-spacing: .26em;`)
  - `11px`: Code pill (`letter-spacing: .06em;`), image metadata captions
  - `12px`: Tooltips, count badges, status chips, table secondary metadata, breadcrumb icons
  - `13px`: Breadcrumbs, subtitles, body table text, button text
  - `14px`: Default body font, search input, avatar initials
  - `15px`: Modal subheadings, workflow titles
  - `16px`: User display name, section titles
  - `17px`: Width guard title, switcher icons
  - `18px`: Empty/error state title
  - `19px`: Rail action icons, current-page switcher icon
  - `20px`: Clapperboard logo icon, modal titles
  - `22px`: Card titles, modal headers, monitor icon
  - `26px`: Empty and error state illustration icons
  - `30px`: Main page heading (`letter-spacing: -0.025em;`)
  - `32px`: Component sheet heading
  - `56px` / `72px`: Initials fallback on empty image placeholder
- **Weights**:
  - `400`: Regular (hints, descriptions)
  - `500`: Medium (breadcrumbs last item, tooltips, buttons, status chips, subtitles)
  - `600`: Semi-bold (titles, headings, count badges, code badges, avatar initials)
  - `700`: Bold (mini avatar initials in table)

---

## 4. Per-Screen Rail Actions Specification

| Screen Key | Main Rail Actions (Top Pill) | Bottom Rail Actions (Bottom Pill) | Rail Label |
| :--- | :--- | :--- | :--- |
| `projects` | 1. **Create project** (`plus`, kbd: `N`)<br>2. **Delete project** (`trash-2`, disabled when no selection: *"Select a project first"*)<br>3. **Manage project** (`sliders-horizontal`, disabled when no selection: *"Select a project first"*) | **Search projects** (`search`, kbd: `/`) | `PROJECTS` |
| `episodes` | 1. **Create episode** (`plus`, kbd: `N`)<br>2. **Delete episode** (`trash-2`, disabled when no selection: *"Select an episode first"*)<br>3. **Manage episode** (`sliders-horizontal`, disabled when no selection: *"Select an episode first"*) | **Search episodes** (`search`, kbd: `/`) | `EPISODES` |
| `scenes` | 1. **Create scene** (`plus`, kbd: `N`)<br>2. **Delete scene** (`trash-2`, disabled when no selection: *"Select a scene first"*)<br>3. **Manage scene** (`sliders-horizontal`, disabled when no selection: *"Select a scene first"*) | **Search scenes** (`search`, kbd: `/`) | `SCENES` |
| `episodeManage` | 1. **Add to do** (`plus`)<br>2. **Delete to do** (`trash-2`, disabled when no selection: *"Select a to do first"*) | **Back to scenes** (`arrow-left`) | `EPISODE MANAGE` |
| `sceneManage` | 1. **Add to do** (`plus`)<br>2. **Delete to do** (`trash-2`, disabled when no selection: *"Select a to do first"*)<br>3. **Open Assembly** (`layout-dashboard`) | **Back to scenes** (`arrow-left`) | `SCENE MANAGE` |
| `sceneAssembly` | 1. **Add keyframe** (`plus`)<br>2. **Delete item** (`trash-2`, disabled when no selection: *"Select an item on the board"*) | **Hide panel** / **Show panel** (`panel-right-close` / `panel-right-open`) | `ASSEMBLY` |
| `assets` | 1. **Add asset** (`plus`, kbd: `N`)<br>2. **Delete asset** (`trash-2`, disabled when no selection: *"Select an asset first"*) | **Search assets** (`search`, kbd: `/`) | `ASSETS` |
| `assetAssembly` | 1. **Assign to target** (`plus`, disabled when no selection: *"Select assets first"*)<br>2. **Unassign from episode** (`trash-2`, disabled when no selection: *"Select assets first"*) | **Hide panel** / **Show panel** (`panel-left-close` / `panel-left-open`) | `ASSET ASSEMBLY` |
| `settings` | 1. **Projects** (`folder-kanban`)<br>2. **Users** (`users`)<br>3. **Security** (`shield`)<br>4. **Workflows** (`workflow`)<br>5. **Storage** (`hard-drive`) | **Back to Projects** (`arrow-left`) | `SETTINGS` |

---

## 5. Items Marked "Not Specified"

- **Mobile & Narrow Viewport Layout**: The prototype provides no responsive mobile layout; it displays the desktop-only width guard when width `< 1280px`. Marked: **not specified** (application is strictly desktop-oriented).
- **Reports Screen View**: Marked as `disabled: true` with tooltip `"Coming soon"`. Marked: **not specified**.
- **User Profile Modal/Editor**: In the Page Switcher, Profile is a placeholder item without an active dialog or edit form. Marked: **not specified**.
- **Dark Mode Elevation for Skeletons**: Exact dark mode gradient animation curves for skeleton pulses are **not specified**; prototype uses static `var(--sk)`.
