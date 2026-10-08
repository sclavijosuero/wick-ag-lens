# WICK-AG-Lens: Accessibility Inspector

WICK-AG-Lens is a professional visual accessibility inspector for Web Developers and QA. It operates as a **Chrome browser extension** that generates visual overlays on elements to indicate accessibility violations and structural information directly within your page layout.

You can install WICK-AG-Lens from the Chrome Web Store: **[Install Here](https://chromewebstore.google.com/detail/accessibility-inspector/fjbgedagallcokpkfdlmpafcffblmlhd)**.

&nbsp;
![WICK-AG-Lens: Accessibility Inspector overview features](images/overview.png)
&nbsp;

## Table of Contents
1. [Features Overview](#features-overview)
2. [Audit Library & Ruleset](#audit-library--ruleset)
3. [Search Predicates and Logic Definitions](#search-predicates-and-logic-definitions)
4. [Limitations & Technical Bounds](#limitations--technical-bounds)
5. [Compatibility](#compatibility)
6. [License](#license)
7. [Contributing](#contributing)
8. [Changelog](#changelog)


## Features Overview
WICK-AG-Lens is built for developers and QA engineers. It runs static analysis against the DOM and computed CSS styles to highlight accessibility patterns directly on the page.

*   **41 Independent Audits:** Divided into actionable violations and structural information checks covering many of the most common issues identified across WCAG 2.0, 2.1, and 2.2 at the A, AA, and AAA conformance levels.
*   **WCAG Criteria Filtering:** Dynamically restrict audits and legend items by specific WCAG versions (2.0, 2.1, 2.2) and conformance levels (A, AA, AAA).
*   **Visual Highlighting:** Draws bounding boxes and badges over target elements to clearly identify where issues occur.
*   **Interactive Info Panels:** Clicking any on-page badge opens a detailed panel explaining what the issue is, why it matters, and providing the exact CSS selector.
*   **Precision Element Locator:** Use the crosshair action inside the DevTools details modal to instantly scroll an affected element into view, marking it with a highly visible pulsating ring.
*   **Accessible Interface:** The extension's DevTools panel is designed to be keyboard-friendly and incorporates WCAG 2.2 AA best practices where possible.
*   **One-Click Reporting:** Copy formatted text reports of all active audits and their findings directly to your clipboard for easy ticket creation or bug tracking.
*   **Shadow DOM & Iframe Support:** Pierces open web components to evaluate encapsulated markup and fully traverses and aggregates data across iframes.
*   **WCAG Alignment:** References current W3C standards for all checks.

## Installation

Installing WICK-AG-Lens takes just a few clicks from the official Chrome Web Store.

1. Navigate to the [WICK-AG-Lens page on the Chrome Web Store](https://chromewebstore.google.com/detail/accessibility-inspector/fjbgedagallcokpkfdlmpafcffblmlhd).
2. Click the **Add to Chrome** button located in the top right corner of the page.
3. A confirmation browser dialog will appear. Click **Add extension** to grant the necessary permissions for the tool to inspect pages.
4. You will receive a message saying WICK-AG-Lens has been added to Chrome.
5. Once installed, open your Chrome Developer Tools (`F12` or `Ctrl+Shift+I` on Windows/Linux, `Cmd+Option+I` on Mac).
6. Locate the **WICK-AG-Lens** tab in the top navigation bar of the DevTools panel. Note: You may need to click the `>>` icon if your DevTools window is narrow.
7. And that's it!


## Audit Library & Ruleset

The following details the complete list of heuristic evaluations performed by the inspector, their classification, standard outputs, and the corresponding W3C WCAG guidelines.

---

### Tab 1: Violations & Warnings

#### Keyboard Navigation

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Unfocusable Clickables** | Critical | `"Unfocusable Clickable"` | [2.1.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) | [View](#v-1) |
| **Disabled Focus Outlines** | Critical | `"Disabled Focus Ring (Heuristic)"` | [2.4.7 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) | [View](#v-2) |
| **Tabindex Violations** | Serious | `tabindex="{val}"` | [2.4.3 (A)](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) | [View](#v-3) |
| **Accesskey Attributes** | Moderate | `accesskey="{val}"` | [2.1.4 (A)](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) | [View](#v-4) |

*   **Unfocusable Clickables:** Flags generic elements with `onclick` handlers lacking a `tabindex` and a valid semantic `role`. **Keyboard users cannot tab to or activate these elements.** 
*   **Disabled Focus Outlines:** Parses page CSS via heuristic evaluation to find focusable elements where `outline: none` or `0` is applied on the `:focus` state without a fallback `box-shadow` or `border`. **Sighted keyboard users rely entirely on focus rings** to know which element they are interacting with. 
*   **Tabindex Violations:** Flags elements dynamically forcing focus order via `tabindex > 0`. **Overrides natural DOM focus order**, creating unpredictable navigation paths. 
*   **Accesskey Attributes:** Flags explicit `accesskey` definitions. **Often conflicts with native browser or screen reader shortcuts.** 

#### Images & Media

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Missing Alt Text** | Critical | `"Missing alt"` | [1.1.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) | [View](#v-5) |
| **Uncaptioned Video** | Critical | `"<video> (No Captions)"` | [1.2.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html) | [View](#v-6) |
| **Redundant Alt Text** | Minor | `Redundant alt: "{text}"` | [1.1.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) | [View](#v-7) |

*   **Missing Alt Text:** Flags `<img>` elements completely lacking an `alt` attribute. **Screen readers will read the raw image filename** if the attribute is missing. 
*   **Uncaptioned Video:** Flags `<video>` elements missing nested `<track>` elements. **Deaf or hard of hearing users require captions** for video content. 
*   **Redundant Alt Text:** Flags `alt` attributes containing words like *'image of'* or *'photo of'*. **Screen readers automatically announce images**, making these prefixes redundant. 

#### Forms & Controls

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Unlabeled Form Inputs** | Critical | `"Unlabeled Input"` | [3.3.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) | [View](#v-8) |
| **Empty Buttons** | Critical | `"Empty Button"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#v-9) |
| **Placeholder as Label** | Serious | `"Placeholder as Label"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#v-10) |

*   **Unlabeled Form Inputs:** Flags form controls missing `<label>` wrappers, `aria-label`s, or `for` attributes. **Screen readers cannot announce what the input is for.** 
*   **Empty Buttons:** Flags buttons without readable text or an `aria-label`. **Screen readers will only announce 'Button'**, providing no context. 
*   **Placeholder as Label:** Flags inputs relying solely on the `placeholder` attribute for their accessible name. **Placeholders disappear on typing** and often lack sufficient contrast. 

#### Links & Navigation

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Empty Links** | Critical | `"Empty Link"` | [2.4.4 (A)](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html) | [View](#v-11) |
| **Suspicious Link Targets** | Critical / Serious | `"Fake Button (JS)"` or `"Fake Button (#)"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#v-12) |
| **Generic Link Text** | Moderate | `Generic link: "{text}"` | [2.4.4 (A)](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html) | [View](#v-13) |
| **Unwarned New Window Links** | Moderate | `'target="_blank" (No Warning)'` | [3.2.5 (AAA)](https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html) | [View](#v-14) |

*   **Empty Links:** Flags `<a>` tags lacking readable text or accessible names. **Screen readers will read the URL**, which is often confusing. 
*   **Suspicious Link Targets:** Flags anchor tags missing routing context acting as buttons (missing `role='button'`). **Using links to trigger JS actions confuses screen readers** and breaks expected spacebar keyboard operability. 
*   **Generic Link Text:** Flags ambiguous link text like *'Click Here'* or *'Read More'* using exact word boundaries. **Users navigating via a Links List will lack context** for the destination. 
*   **Unwarned New Window Links:** Flags `target='_blank'` links without text or ARIA warnings. **Unexpectedly opening new tabs disorients cognitive and screen reader users.** 

#### ARIA & Semantics

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Focusable in Aria-Hidden** | Critical | `"aria-hidden (Focusable)"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#v-15) |
| **Invalid ARIA State** | Serious | `'aria-invalid="true"'` | [3.3.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) | [View](#v-16) |
| **Prohibited Author Names** | Serious | `Prohibited name on role="{role}"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#v-17) |

*   **Focusable in Aria-Hidden:** Flags active controls trapped in `aria-hidden='true'` trees. **Keyboard users can reach them, but screen readers cannot**, creating a severe mismatch. 
*   **Invalid ARIA State:** Flags form controls explicitly marked `aria-invalid='true'`. **Identifies application-enforced validation errors.** 
*   **Prohibited Author Names:** Flags structural roles containing `aria-label` or `aria-labelledby`. **Adding a name to a transparent structural role breaks its semantics.** 

#### Structure & Document

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Auto-playing Media** | Serious | `"Autoplay Media"` | [1.4.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html) | [View](#v-18) |
| **Heading Hierarchy Errors** | Moderate | `"{TAG} (Skipped)"` or `"Fake Heading"` | [1.3.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) | [View](#v-19) |

*   **Auto-playing Media:** Flags audio or video elements set to `autoplay`. **Unexpected audio conflicts with screen reader announcements.** 
*   **Heading Hierarchy Errors:** Flags skipped levels (e.g., `H1` to `H3`) or fake non-semantic headings. **Skipping levels confuses screen reader navigation.** 

#### Visual & Contrast

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Text Color Contrast** | Critical | `AA Fail`, `AAA Fail`, `Manual Check` | [1.4.3 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [1.4.6 (AAA)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html) | [View](#v-20) |

*   **Text Color Contrast:** Traverses the DOM to calculate the effective contrast ratio between text and its background. Dynamically evaluates `font-size` and `font-weight` against WCAG large-text thresholds. Elements over images/gradients are flagged for manual review. 

---

### Tab 2: Informative & Structure

#### Keyboard Navigation

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Tabindex (Comparison)** | Informative | `tabindex="{val}"` | [2.4.3 (A)](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) | [View](#i-1) |
| **Display Focus Order** | Informative | `#{num}: <{tag}>` | [2.4.3 (A)](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) | [View](#i-2) |

*   **Tabindex (Comparison):** Visual comparison of all `tabindex` usages. **Provides a sweeping visual map of the programmatic focus strategy.** 
*   **Display Focus Order:** Sequential trace of naturally focusable elements. Utilizes hierarchical decimal prefixing (e.g., `[Iframe] #4.1`) for isolated DOM boundaries. **Simulates the exact path of the `TAB` key route.** 

#### Images & Media

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Display Image Alternatives** | Informative | `alt="{val}"`, `alt=""`, or `"Missing alt"` | [1.1.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) | [View](#i-3) |
| **Captioned Video** | Informative | `"<video> (Captioned)"` | [1.2.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html) | [View](#i-4) |
| **Iframe Context & Titles** | Informative | `title="{title}"`, `"Hidden Iframe"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#i-5) |

*   **Display Image Alternatives:** Prints `alt` text for all images. **Allows rapid visual auditing of alternative text descriptions.** 
*   **Captioned Video:** Videos containing `<track>` elements. **Confirms proper multimedia accessibility setup.** 
*   **Iframe Context & Titles:** Analyzes third-party embed context and `title` attributes. **Screen readers announce the title to inform the user** what the sub-document contains. 

#### Forms & Controls

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Form Field Descriptions** | Informative | `"aria-describedby"` or `"title"` | [3.3.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) | [View](#i-6) |
| **Fieldsets & Captions** | Informative | `<{tag}>` | [1.3.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) | [View](#i-7) |
| **Touch Target Sizes** | Informative | `{width}x{height}px` | [2.5.8 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | [View](#i-8) |

*   **Form Field Descriptions:** Supplemental instructional text (`aria-describedby`). **Ensures extended hints or error messages are programmatically tied to inputs.** 
*   **Fieldsets & Captions:** Visual grouping containers (`<fieldset>`). **Crucial for grouping related radio buttons or complex form sections.** 
*   **Touch Target Sizes:** Calculates interactive pixel bounds (`width` / `height`). **Undersized targets prevent users with fine motor impairments from activating controls accurately.** 

#### Links & Navigation

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Warned New Window Links** | Informative | `'target="_blank" (Warned)'` | [3.2.5 (AAA)](https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html) | [View](#i-9) |

*   **Warned New Window Links:** `target='_blank'` links with proper warning. **Confirms proper communication of context shifts to assistive technologies.** 

#### ARIA & Semantics

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Accessible Name Resolution** | Informative | `"[id] {name}"`, `"[aria] {name}"`, `"[text] {name}"`, or `"Missing Name"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#i-10) |
| **ARIA Roles & Attributes** | Informative | `role="{val}"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#i-11) |
| **ARIA Live Regions** | Informative | `aria-live="{val}"` | [4.1.3 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | [View](#i-12) |
| **Required Fields** | Informative | `"required"` or `'aria-required="true"'` | [3.3.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) | [View](#i-13) |
| **Aria-Expanded State** | Informative | `aria-expanded="{val}"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#i-14) |
| **Aria-Controls** | Informative | `"aria-controls"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#i-15) |
| **Aria-Owns** | Informative | `"aria-owns"` | [4.1.2 (A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | [View](#i-16) |

*   **Accessible Name Resolution:** Computes the final accessible name by simulating the browser's fallback calculation sequence: `aria-labelledby`, then `aria-label`, then native linked labels/text, and finally `title`. **Reveals exactly what a screen reader will announce.** 
*   **ARIA Roles & Attributes:** Maps explicit `role` definitions. **Allows rapid structural auditing of custom widget semantics.** 
*   **ARIA Live Regions:** Maps dynamic `aria-live` injection containers. **Ensures dynamic content updates are announced to screen readers.** 
*   **Required Fields:** Mandatory input enforcement (`required` / `aria-required`). **Ensures required status is programmatically available.** 
*   **Aria-Expanded State:** Expandable/collapsible widget states (`aria-expanded`). **Visualizes the current programmatic state of accordions and menus.** 
*   **Aria-Controls:** Remote DOM visibility targets (`aria-controls`). **Links trigger mechanisms to their targets.** 
*   **Aria-Owns:** Remote programmatic ownership (`aria-owns`). **Reconstructs accessibility tree hierarchy for disjointed widgets.** 

#### Structure & Document

| Audit | Classification | Badge Output | WCAG Criteria | Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Valid Heading Order** | Informative | `<{tag}>` | [1.3.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) | [View](#i-17) |
| **Landmark Regions** | Informative | `<{role or tag}>` | [2.4.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) | [View](#i-18) |
| **Table & Grid Structure** | Informative | `<{tag}>` or `role="{role}"` | [1.3.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) | [View](#i-19) |
| **Lists and List Items** | Informative | `<{tag}>` | [1.3.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) | [View](#i-20) |
| **Language Definitions** | Informative | `"Missing Root Lang"`, `Root lang="{val}"`, or `lang="{val}"` | [3.1.1 (A)](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) | [View](#i-21) |

*   **Valid Heading Order:** Standard `H1-H6` structural outline. **Verifies the logical outline of the page.** 
*   **Landmark Regions:** HTML5 and ARIA structural landmark containers. **Allows screen reader users to jump quickly between page sections.** 
*   **Table & Grid Structure:** Native `<table>` and ARIA data grids. **Visually maps data structures and verifies custom UI grids implement semantic headers.** 
*   **Lists and List Items:** Unordered (`<ul>`), ordered (`<ol>`), and definition lists (`<dl>`). **Ensures related items are programmatically grouped.** 
*   **Language Definitions:** Phonetic shifts and root `lang` declarations. **Screen readers rely on the language tag to load the correct accent and pronunciation rules.** 


## Search Predicates and Logic Definitions

Elements hidden via CSS parameters like `display: none` or `visibility: hidden`, or by using the HTML `inert` attribute, are excluded by the global DOM processing logic before the specific audits run.

**DOM Traversal:** The extension utilizes a custom deep `querySelectorAll` function combined with bottom-up ancestor mapping. This allows the scanner to properly pierce standard (open) Shadow DOM boundaries and fully traverse the internal DOM of same-origin iframes, guaranteeing accurate visibility tracking across complex widget architectures.

**Self-Auditing Guard:** The injected extension UI elements (like the overlay boxes and the information toast panels) are specifically excluded from audits to prevent false positives.

### Tab 1: Violations & Warnings

*   <a id="v-1"></a>**Unfocusable Clickables:** Uses the CSS selector `div[onclick], span[onclick], section[onclick]`. The Javascript logic evaluates each element to ensure it lacks a `role` attribute or lacks a `tabindex` attribute before flagging a violation.
*   <a id="v-2"></a>**Disabled Focus Outlines:** Uses the base CSS selector `a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])`. The Javascript logic iterates through `document.styleSheets` and checks each `CSSRule.STYLE_RULE` to see if the selector includes `:focus` or `:focus-visible`. It reads the `outline`, `outlineWidth`, `boxShadow`, and `border` properties. If outline rules contain `none` or `0px` and no fallback border or shadow is provided, the selector is recorded. Any interactive element matching that recorded selector is flagged.
*   <a id="v-3"></a>**Tabindex Violations:** Uses the CSS selector `[tabindex]`. The logic parses the attribute value as a base 10 integer and triggers a violation if the value is strictly greater than 0.
*   <a id="v-4"></a>**Accesskey Attributes:** Uses the CSS selector `[accesskey]`. All elements matching this selector are flagged.
*   <a id="v-5"></a>**Missing Alt Text:** Uses the CSS selector `img:not([alt])`. All elements matching this selector are flagged.
*   <a id="v-6"></a>**Uncaptioned Video:** Uses the CSS selector `video`. The logic queries descendants for `track[kind="captions"], track[kind="subtitles"]`. If the result length is 0, the video is flagged.
*   <a id="v-7"></a>**Redundant Alt Text:** Uses the CSS selector `img[alt]`. The logic reads the alt attribute and uses the regular expression `/\b(image|img|photo|picture|graphic)\b/i` to identify redundant terms before flagging.
*   <a id="v-8"></a>**Unlabeled Form Inputs:** Uses the CSS selector `input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea`. The logic searches the document for a `<label>` with a `for` attribute matching the input ID. It also checks the element for `aria-label` or `aria-labelledby` attributes, or if it is nested directly inside a `label` element. If all checks fail, it is flagged.
*   <a id="v-9"></a>**Empty Buttons:** Uses the CSS selector `button, [role='button']`. The logic checks the text content of the element, the presence of `aria-label` or `aria-labelledby`, and the presence of child `img[alt]` elements. If the trimmed text is empty and alternative names are missing, it flags a violation.
*   <a id="v-10"></a>**Placeholder as Label:** Uses the CSS selector `input[placeholder], textarea[placeholder]`. The logic checks if the element lacks a `label[for]` referencing its ID and lacks `aria-label` or `aria-labelledby` attributes.
*   <a id="v-11"></a>**Empty Links:** Uses the CSS selector `a[href]`. The logic evaluates the text content, ARIA labels, and child image alt text. If all sources of accessible names are empty, it triggers a violation.
*   <a id="v-12"></a>**Suspicious Link Targets:** Uses the CSS selector `a[href='#'], a[href^='javascript:']`. The logic ignores elements that possess `role="button"`. It categorizes the remaining matches based on whether the `href` prefix is javascript or a hash.
*   <a id="v-13"></a>**Generic Link Text:** Uses the CSS selector `a[href]`. The logic trims the text content and applies an exact word boundary regular expression `/\b(click here|read more|learn more|more|link|here)\b/i` to flag matching elements.
*   <a id="v-14"></a>**Unwarned New Window Links:** Uses the CSS selector `a[target='_blank']`. The logic concatenates the text content and `aria-label` to test against the regular expression `/new (window|tab)/`. If no match is found, it flags a violation.
*   <a id="v-15"></a>**Focusable in Aria-Hidden:** Uses a bottom-up DOM traversal to check if any naturally focusable element (or its ancestors) possesses `aria-hidden='true'`. Pierces Shadow DOMs and iframes to ensure accurate detection of ghost focus traps.
*   <a id="v-16"></a>**Invalid ARIA State:** Uses the CSS selector `[aria-invalid='true']`. Elements matching the selector are flagged.
*   <a id="v-17"></a>**Prohibited Author Names:** Uses the CSS selector `[role='presentation'], [role='none'], [role='generic']`. The logic triggers a violation if the matched element has an `aria-label` or `aria-labelledby` attribute.
*   <a id="v-18"></a>**Auto-playing Media:** Uses the CSS selector `audio[autoplay], video[autoplay]`. Elements matching the selector are flagged.
*   <a id="v-19"></a>**Heading Hierarchy Errors:** Uses the CSS selector `h1, h2, h3, h4, h5, h6, [role='heading'], [class*='heading'], [class*='title']`. The logic tracks the integer level of headings. It flags an element if the current heading level skips sequentially past the previous tracked level. It also flags elements without a role attribute if the text length is under 80 characters.
*   <a id="v-20"></a>**Text Color Contrast:** Uses the CSS selector targeting standard text elements like `h1`, `p`, `span`, `button`. The logic verifies child text nodes exist. It uses `window.getComputedStyle` to retrieve the foreground color and background color, dynamically factoring in `font-size` and `font-weight` against WCAG large-text thresholds. It applies the WCAG relative luminance formula and categorizes failures as AA Fail or AAA Fail. Elements over background images or CSS gradients are automatically flagged for manual review.

### Tab 2: Informative & Structure

*   <a id="i-1"></a>**Tabindex (Comparison):** Uses the CSS selector `[tabindex]`. The logic parses the attribute as an integer and assigns different visual legends based on whether the value is equal to 0, less than 0, or greater than 0.
*   <a id="i-2"></a>**Display Focus Order:** Traces and numbers the natural sequential path of focusable elements using hierarchical decimal prefixing for cross-frame focus tracking. It dynamically flags elements that receive keyboard focus but are hidden from Assistive Technologies via `aria-hidden='true'` on the element or an ancestor.
*   <a id="i-3"></a>**Display Image Alternatives:** Uses the CSS selector `img`. The logic assigns distinct legends depending on whether the `alt` attribute is completely missing, present but empty, or populated.
*   <a id="i-4"></a>**Captioned Video:** Uses the CSS selector `video`. The logic checks for child `track[kind="captions"]` or `track[kind="subtitles"]` elements to highlight the video.
*   <a id="i-5"></a>**Iframe Context & Titles:** Uses the CSS selector `iframe`. The logic checks if the iframe has `aria-hidden` set to true or `tabindex` set to -1. It flags missing titles if the `title` attribute is missing or empty, otherwise, it outputs the title text.
*   <a id="i-6"></a>**Form Field Descriptions:** Uses the CSS selector `[aria-describedby], [title]`. The logic outputs the presence of these specific attributes to the badge.
*   <a id="i-7"></a>**Fieldsets & Captions:** Uses the CSS selector `fieldset, legend`. Elements matching the selector are highlighted.
*   <a id="i-8"></a>**Touch Target Sizes:** Uses a CSS selector targeting interactive elements and roles like `button`, `link`, `checkbox`, `slider`. The logic uses `getBoundingClientRect()` to compute width and height. It finds the minimum of the two dimensions and categorizes the element based on limits at 24px and 44px.
*   <a id="i-9"></a>**Warned New Window Links:** Uses the CSS selector `a[target='_blank']`. The logic combines the text content and `aria-label` to test against the regular expression `/new (window|tab)/`. Matches are highlighted.
*   <a id="i-10"></a>**Accessible Name Resolution:** Uses a CSS selector targeting interactive widgets. The logic simulates the browser's native fallback sequence, sequentially checking `aria-labelledby`, `aria-label`, native associated labels/inner text, and finally the `title` attribute to print exactly what the screen reader will announce.
*   <a id="i-11"></a>**ARIA Roles & Attributes:** Uses the CSS selector `[role]`. The logic retrieves the value of the role attribute for display.
*   <a id="i-12"></a>**ARIA Live Regions:** Uses the CSS selector `[aria-live]`. The logic retrieves the value of the aria-live attribute for display.
*   <a id="i-13"></a>**Required Fields:** Uses the CSS selector `[required], [aria-required='true']`. The logic distinguishes between HTML required attributes and ARIA required attributes for the output.
*   <a id="i-14"></a>**Aria-Expanded State:** Uses the CSS selector `[aria-expanded]`. The logic categorizes the element based on whether the attribute equals true or false.
*   <a id="i-15"></a>**Aria-Controls:** Uses the CSS selector `[aria-controls]`. Elements matching the selector are highlighted.
*   <a id="i-16"></a>**Aria-Owns:** Uses the CSS selector `[aria-owns]`. Elements matching the selector are highlighted.
*   <a id="i-17"></a>**Valid Heading Order:** Uses the CSS selector `h1, h2, h3, h4, h5, h6`. Elements matching the selector are highlighted.
*   <a id="i-18"></a>**Landmark Regions:** Uses the CSS selector `main, nav, header, footer, aside, [role='main'], [role='navigation'], [role='banner'], [role='contentinfo']`. The logic retrieves the role attribute or the HTML tag name for the badge output.
*   <a id="i-19"></a>**Table & Grid Structure:** Uses the CSS selector `table, caption, th, [role='table'], [role='grid'], [role='treegrid'], [role='columnheader'], [role='rowheader']`. The logic applies a dashed style to header roles and tags, and applies a solid style for grid and table containers.
*   <a id="i-20"></a>**Lists and List Items:** Uses the CSS selector `ul, ol, li, dl, dt, dd`. Elements matching the selector are highlighted.
*   <a id="i-21"></a>**Language Definitions:** Uses the CSS selector `html, [lang], [xml\:lang]`. The logic checks if the element is the root html tag. It flags the element if the root tag is missing a language attribute. It categorizes root language declarations separately from inline phonetic shifts.

## Limitations & Technical Bounds

*   **Visibility Filtering:** Elements hidden via `display: none`, `visibility: hidden`, `hidden`, or `inert` are strictly excluded from all analysis to match native accessibility tree behavior.
*   **Clipping & X-Ray Vision:** Elements scrolled off-screen or hidden inside `overflow: hidden` containers (like carousels) are successfully detected and rendered with a ghosted X-Ray hatched pattern.
*   **Z-Index Occlusion:** Visibility calculations rely on CSS properties. The tool does not calculate 3D geometric occlusion (e.g., an element technically "visible" in the DOM but visually covered by a high `z-index` modal).
*   **Focus Order:** Mirrors standard browser `Tab` execution, prioritizing `tabindex > 0`, respecting native Radio Group bundling, and tracing hierarchical paths inside nested iframes.
*   **Shadow DOMs:** Standard (open) Web Components are fully traversed and supported. Explicitly 'closed' Shadow Roots remain inaccessible by browser design.
*   **Iframes & Cross-Origin Policies:** The tool successfully aggregates data across all active iframes (including nested cross-origin embeds) for reporting and element listings. However, it cannot bypass strict Same-Origin Policies to force browser scroll events inside cross-origin windows.
*   **Color Contrast Heuristics:** Contrast ratios are calculated using computed DOM styles. Elements overlaying complex backgrounds (images, gradients) are explicitly flagged for Manual Review. The algorithm dynamically calculates required thresholds based on computed `font-size` and `font-weight`.
*   **WCAG Criteria Filtering:** The version (2.0, 2.1, 2.2) and conformance level (A, AA, AAA) filters are strictly isolated. Selecting version 2.2 does *not* automatically include 2.0 or 2.1 audits, and selecting AAA does *not* include A or AA checks. You must explicitly check all versions and levels you wish to evaluate in your current analysis.

## Compatibility
*   **Browser:** Compatible with Google Chrome version 100.0 or higher.
*   **Permissions:** Operates on all URLs permitted by the user using the `activeTab`, `scripting`, and `storage` host permissions.

## License
WICK-AG-Lens is available under the MIT License. Reference the [LICENSE.md](./LICENSE.md) file for standard permissions and limitations.

## CONTRIBUTING

First off, thanks for taking the time to contribute!

To contribute, please follow the process described in **[CONTRIBUTING.md](CONTRIBUTING.md "CONTRIBUTING.md")**

And if you like the project but just don't have the time to contribute, that's fine. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
- Star the project
- Promote it on social media
- Refer this project in your project's readme
- Mention the project at local meetups and tell your friends/colleagues
- Buying me a coffee or contributing to a training session, so I can keep learning and sharing cool stuff with all of you.

<a href="https://www.buymeacoffee.com/sclavijosuero" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 150px !important;" ></a>

Thank you for your support!

## Changelog

### v2.2.0: The Architecture & UX Update
* Added *Accessible Name Resolution* audit to accurately simulate screen reader label fallbacks (`aria-labelledby` > `aria-label` > native text > `title`).
* Implemented cross-frame data aggregation, allowing the extension to perfectly merge nested iframe elements into the global reports and view lists.
* Overhauled Informative badges with a sleek "DevTools" aesthetic (slate background with thick colored accent borders).
* Introduced "X-Ray Vision" for off-screen/clipped elements (e.g., carousel slides), rendering them with a ghosted hatched pattern and a `[Hidden]` label.
* Added hierarchical decimal tracking (e.g., `[Iframe] #4.1`) to the Focus Order audit to perfectly trace keyboard paths inside isolated sub-documents.
* Replaced physical highlight borders with CSS `outline`, permanently eliminating layout reflow loops and infinite scroll-bar expansion bugs.
* Applied rich inline code formatting to all documentation and info panels.

### v2.1.0
* Introduced dynamic WCAG Version (2.0, 2.1, 2.2) and Conformance Level (A, AA, AAA) UI filtering.
* Re-engineered DOM traversal for visibility calculations to seamlessly cross Shadow DOMs and same-origin iframes.
* Enhanced the Focus Order trace and "Focusable in Aria-Hidden" audits to dynamically detect "ghost focus" traps using deep bottom-up traversal.
* Updated Text Color Contrast to dynamically evaluate font-size and weight against thresholds, and explicitly flag complex backgrounds.
* Updated Generic Link text regex to strictly enforce word boundaries.
* Added DevTools UI toast notification system.

### v2.0.0
* Major release. Replaced icons and incorporated WCAG 2.2 AAA compliant styling changes.
* Added new heuristic auditing capabilities (Disabled Focus Outlines).
* Removed standard duplicate ID auditing in favor of expanded keyboard navigation tools.
* Rebranded to WICK-AG-Lens.

### v1.0.0
* Initial release (Chrome extension previously called **a11y-inspector**).
* Introduced targeted visual overlays, precision element locator, one-click clipboard reporting, and WCAG reference modals.
* Included base suite of audits for headings, images, forms, keyboard/interactive elements, links, and ARIA DOM integrity.
* Full support for evaluating DOM elements across nested frames and same-origin iframes.
