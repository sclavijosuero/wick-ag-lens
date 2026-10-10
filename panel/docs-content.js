window.A11Y_DOCS_HTML = `
<div class="a11y-docs-container">
    <p>WICK-AG-Lens is a professional visual accessibility inspector for Web Developers and QA. It operates as a Chrome browser extension that generates visual overlays on elements to indicate accessibility violations and structural information directly within your page layout.</p>

    <h3 id="features-overview">Features Overview</h3>
    <p>WICK-AG-Lens is built for developers and QA engineers. It runs static analysis against the DOM and computed CSS styles to highlight accessibility patterns directly on the page.</p>
    <ul>
        <li><strong>Real-Time SPA &amp; DOM Sync:</strong> Automatically detects Single Page Application (SPA) navigations and dynamic DOM injections (like modals), seamlessly re-auditing the page in real-time.</li>
        <li><strong>41 Independent Audits:</strong> Divided into actionable violations and structural information checks covering many of the most common issues identified across WCAG 2.0, 2.1, and 2.2 at the A, AA, and AAA conformance levels.</li>
        <li><strong>WCAG Criteria Filtering:</strong> Dynamically restrict audits and legend items by specific WCAG versions (2.0, 2.1, 2.2) and conformance levels (A, AA, AAA).</li>
        <li><strong>Visual Highlighting:</strong> Draws bounding boxes and badges over target elements to clearly identify where issues occur.</li>
        <li><strong>Interactive Info Panels:</strong> Clicking any on-page badge opens a detailed panel explaining what the issue is, why it matters, and providing the exact CSS selector.</li>
        <li><strong>Precision Element Locator:</strong> Use the crosshair action inside the DevTools details modal to instantly scroll an affected element into view, marking it with a highly visible pulsating ring.</li>
        <li><strong>Accessible Interface:</strong> The extension's DevTools panel is designed to be keyboard-friendly and incorporates WCAG 2.2 AA best practices where possible.</li>
        <li><strong>One-Click Reporting:</strong> Copy formatted text reports of all active audits and their findings directly to your clipboard for easy ticket creation or bug tracking.</li>
        <li><strong>Shadow DOM &amp; Iframe Support:</strong> Pierces open web components to evaluate encapsulated markup and fully traverses and aggregates data across iframes.</li>
        <li><strong>WCAG Alignment:</strong> References current W3C standards for all checks.</li>
    </ul>

    <h3 id="audit-library">Audit Library &amp; Ruleset</h3>
    <p>The following details the complete list of heuristic evaluations performed by the inspector, their classification, and the corresponding W3C WCAG guidelines.</p>

    <h4 class="docs-tab-title">Tab 1: Violations & Warnings</h4>
    
    <h4>Keyboard Navigation</h4>
    <ul>
        <li><strong>Unfocusable Clickables:</strong> Flags generic elements with <code>onclick</code> handlers lacking a <code>tabindex</code> and a valid semantic <code>role</code>. <strong>Keyboard users cannot tab to or activate these elements.</strong><br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html" target="_blank">WCAG 2.1.1</a> (2.0 A)</li>
        
        <li><strong>Disabled Focus Outlines:</strong> Parses page CSS via heuristic evaluation to find focusable elements where <code>outline: none</code> or <code>0</code> is applied on the <code>:focus</code> state without a fallback <code>box-shadow</code> or <code>border</code>. <strong>Sighted keyboard users rely entirely on focus rings</strong> to know which element they are interacting with.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html" target="_blank">WCAG 2.4.7</a> (2.0 AA)</li>
        
        <li><strong>Tabindex Violations:</strong> Flags elements dynamically forcing focus order via <code>tabindex &gt; 0</code>. <strong>Overrides natural DOM focus order</strong>, creating unpredictable navigation paths.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a> (2.0 A)</li>
        
        <li><strong>Accesskey Attributes:</strong> Flags explicit <code>accesskey</code> definitions. <strong>Often conflicts with native browser or screen reader shortcuts.</strong><br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html" target="_blank">WCAG 2.1.4</a> (2.1 A)</li>
    </ul>

    <h4>Images & Media</h4>
    <ul>
        <li><strong>Missing Alt Text:</strong> Flags <code>&lt;img&gt;</code> elements completely lacking an <code>alt</code> attribute. <strong>Screen readers will read the raw filename</strong> if the attribute is missing.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a> (2.0 A)</li>
        
        <li><strong>Uncaptioned Video:</strong> Flags <code>&lt;video&gt;</code> elements missing nested <code>&lt;track&gt;</code> elements. <strong>Deaf or hard of hearing users require captions</strong> for video content.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html" target="_blank">WCAG 1.2.2</a> (2.0 A)</li>
        
        <li><strong>Redundant Alt Text:</strong> Flags <code>alt</code> attributes containing words like <em>'image of'</em> or <em>'photo of'</em>. <strong>Screen readers automatically announce images</strong>, making these prefixes redundant.<br>
        <span class="severity-badge severity-minor">MINOR</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a> (2.0 A)</li>
    </ul>

    <h4>Forms & Controls</h4>
    <ul>
        <li><strong>Unlabeled Form Inputs:</strong> Flags form controls missing <code>&lt;label&gt;</code> wrappers, <code>aria-label</code>s, or <code>for</code> attributes. <strong>Screen readers cannot announce what the input is for.</strong><br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html" target="_blank">WCAG 3.3.2</a> (2.0 A)</li>
        
        <li><strong>Empty Buttons:</strong> Flags buttons without readable text or an <code>aria-label</code>. <strong>Screen readers will only announce 'Button'</strong>, providing no context.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
        
        <li><strong>Placeholder as Label:</strong> Flags inputs relying solely on the <code>placeholder</code> attribute for their accessible name. <strong>Placeholders disappear on typing</strong> and often lack sufficient contrast.<br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
    </ul>

    <h4>Links & Navigation</h4>
    <ul>
        <li><strong>Empty Links:</strong> Flags <code>&lt;a&gt;</code> tags lacking readable text or accessible names. <strong>Screen readers will read the URL</strong>, which is often confusing.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html" target="_blank">WCAG 2.4.4</a> (2.0 A)</li>
        
        <li><strong>Suspicious Link Targets:</strong> Flags anchor tags missing routing context acting as buttons (missing <code>role='button'</code>). <strong>Using links to trigger JS actions confuses screen readers.</strong><br>
        <div style="margin: 6px 0;">
            <span class="severity-badge severity-critical">CRITICAL</span> <code>javascript:</code> targets &nbsp;|&nbsp; 
            <span class="severity-badge severity-serious">SERIOUS</span> <code>href="#"</code> targets
        </div>
        &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html" target="_blank">WCAG 2.1.1</a> (2.0 A)</li>
        
        <li><strong>Generic Link Text:</strong> Flags ambiguous link text like <em>'Click Here'</em> or <em>'Read More'</em> using exact word boundaries. <strong>Users navigating via a Links List will lack context</strong> for the destination.<br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html" target="_blank">WCAG 2.4.4</a> (2.0 A)</li>
        
        <li><strong>Unwarned New Window Links:</strong> Flags <code>target='_blank'</code> links without text or ARIA warnings. <strong>Unexpectedly opening new tabs disorients cognitive and screen reader users.</strong><br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html" target="_blank">WCAG 3.2.5</a> (2.0 AAA)</li>
    </ul>

    <h4>ARIA & Semantics</h4>
    <ul>
        <li><strong>Focusable in Aria-Hidden:</strong> Flags active controls trapped in <code>aria-hidden='true'</code> trees. <strong>Keyboard users can reach them, but screen readers cannot</strong>, creating a severe mismatch.<br>
        <span class="severity-badge severity-critical">CRITICAL</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
        
        <li><strong>Invalid ARIA State:</strong> Flags form controls explicitly marked <code>aria-invalid='true'</code>. <strong>Identifies application-enforced validation errors.</strong><br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html" target="_blank">WCAG 3.3.1</a> (2.0 A)</li>
        
        <li><strong>Prohibited Author Names:</strong> Flags structural roles containing <code>aria-label</code> or <code>aria-labelledby</code>. <strong>Adding a name to a transparent structural role breaks its semantics.</strong><br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
    </ul>

    <h4>Structure & Document</h4>
    <ul>
        <li><strong>Auto-playing Media:</strong> Flags audio or video elements set to <code>autoplay</code>. <strong>Unexpected audio conflicts with screen reader announcements.</strong><br>
        <span class="severity-badge severity-serious">SERIOUS</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html" target="_blank">WCAG 1.4.2</a> (2.0 A)</li>
        
        <li><strong>Heading Hierarchy Errors:</strong> Flags skipped levels (e.g., <code>H1</code> to <code>H3</code>) or fake non-semantic headings. <strong>Skipping levels confuses screen reader navigation.</strong><br>
        <span class="severity-badge severity-moderate">MODERATE</span> &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A)</li>
    </ul>

    <h4>Visual & Contrast</h4>
    <ul>
        <li><strong>Text Color Contrast:</strong> Traverses the DOM to calculate the effective contrast ratio between text and its background. Dynamically evaluates <code>font-size</code> and <code>font-weight</code> against WCAG large-text thresholds. Elements over images/gradients are flagged for manual review.<br>
        <div style="margin: 6px 0;">
            <span class="severity-badge severity-critical">CRITICAL</span> AA Fail &nbsp;|&nbsp; 
            <span class="severity-badge severity-serious">SERIOUS</span> AAA Fail &nbsp;|&nbsp; 
            <span class="severity-badge severity-moderate" style="background-color: #00bcd4; color: #fff;">MANUAL</span> Manual Check
        </div>
        &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank">WCAG 1.4.3</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html" target="_blank">WCAG 1.4.6</a> (2.0 AA, 2.0 AAA)</li>
    </ul>


    <h4 class="docs-tab-title" style="margin-top: 32px;">Tab 2: Informative & Structure</h4>
    
    <h4>Keyboard Navigation</h4>
    <ul>
        <li><strong>Tabindex (Comparison):</strong> Visual comparison of all <code>tabindex</code> usages. <strong>Provides a sweeping visual map of the programmatic focus strategy.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a> (2.0 A)</li>
        
        <li><strong>Display Focus Order:</strong> Sequential trace of naturally focusable elements. Utilizes hierarchical decimal prefixing (e.g., <code>[Iframe] #4.1</code>) for isolated DOM boundaries. <strong>Simulates the exact path of the <code>TAB</code> key route.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html" target="_blank">WCAG 2.4.3</a> (2.0 A)</li>
    </ul>

    <h4>Images & Media</h4>
    <ul>
        <li><strong>Display Image Alternatives:</strong> Prints <code>alt</code> text for all images. <strong>Allows rapid visual auditing of alternative text descriptions.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" target="_blank">WCAG 1.1.1</a> (2.0 A)</li>
        
        <li><strong>Captioned Video:</strong> Videos containing <code>&lt;track&gt;</code> elements. <strong>Confirms proper multimedia accessibility setup.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html" target="_blank">WCAG 1.2.2</a> (2.0 A)</li>
        
        <li><strong>Iframe Context & Titles:</strong> Analyzes third-party embed context and <code>title</code> attributes. <strong>Screen readers announce the title to inform the user</strong> what the sub-document contains.<br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
    </ul>

    <h4>Forms & Controls</h4>
    <ul>
        <li><strong>Form Field Descriptions:</strong> Supplemental instructional text (<code>aria-describedby</code>). <strong>Ensures extended hints or error messages are programmatically tied to inputs.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html" target="_blank">WCAG 3.3.2</a> (2.0 A)</li>
        
        <li><strong>Fieldsets & Captions:</strong> Visual grouping containers (<code>&lt;fieldset&gt;</code>). <strong>Crucial for grouping related radio buttons or complex form sections.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A)</li>
        
        <li><strong>Touch Target Sizes:</strong> Calculates interactive pixel bounds (<code>width</code> / <code>height</code>). <strong>Undersized targets prevent users with fine motor impairments from activating controls accurately.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html" target="_blank">WCAG 2.5.8</a> (2.2 AA, 2.1 AAA)</li>
    </ul>

    <h4>Links & Navigation</h4>
    <ul>
        <li><strong>Warned New Window Links:</strong> <code>target='_blank'</code> links with proper warning. <strong>Confirms proper communication of context shifts to assistive technologies.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html" target="_blank">WCAG 3.2.5</a> (2.0 AAA)</li>
    </ul>

    <h4>ARIA & Semantics</h4>
    <ul>
        <li><strong>Accessible Name Resolution:</strong> Computes the final accessible name by simulating the browser's fallback calculation sequence: <code>aria-labelledby</code>, then <code>aria-label</code>, then native linked labels/text, and finally <code>title</code>. <strong>Reveals exactly what a screen reader will announce.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>

        <li><strong>ARIA Roles & Attributes:</strong> Maps explicit <code>role</code> definitions. <strong>Allows rapid structural auditing of custom widget semantics.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
        
        <li><strong>ARIA Live Regions:</strong> Maps dynamic <code>aria-live</code> injection containers. <strong>Ensures dynamic content updates are announced to screen readers.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html" target="_blank">WCAG 4.1.3</a> (2.1 AA)</li>
        
        <li><strong>Required Fields:</strong> Mandatory input enforcement (<code>required</code> / <code>aria-required</code>). <strong>Ensures required status is programmatically available.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html" target="_blank">WCAG 3.3.1</a> (2.0 A)</li>
        
        <li><strong>Aria-Expanded State:</strong> Expandable/collapsible widget states (<code>aria-expanded</code>). <strong>Visualizes the current programmatic state of accordions and menus.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
        
        <li><strong>Aria-Controls:</strong> Remote DOM visibility targets (<code>aria-controls</code>). <strong>Links trigger mechanisms to their targets.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
        
        <li><strong>Aria-Owns:</strong> Remote programmatic ownership (<code>aria-owns</code>). <strong>Reconstructs accessibility tree hierarchy for disjointed widgets.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank">WCAG 4.1.2</a> (2.0 A)</li>
    </ul>

    <h4>Structure & Document</h4>
    <ul>
        <li><strong>Valid Heading Order:</strong> Standard <code>H1-H6</code> structural outline. <strong>Verifies the logical outline of the page.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A)</li>
        
        <li><strong>Landmark Regions:</strong> HTML5 and ARIA structural landmark containers. <strong>Allows screen reader users to jump quickly between page sections.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html" target="_blank">WCAG 2.4.1</a> (2.0 A)</li>
        
        <li><strong>Table & Grid Structure:</strong> Native <code>&lt;table&gt;</code> and ARIA data grids. <strong>Visually maps data structures and verifies custom UI grids implement semantic headers.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A)</li>
        
        <li><strong>Lists and List Items:</strong> Unordered (<code>&lt;ul&gt;</code>), ordered (<code>&lt;ol&gt;</code>), and definition lists (<code>&lt;dl&gt;</code>). <strong>Ensures related items are programmatically grouped.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" target="_blank">WCAG 1.3.1</a> (2.0 A)</li>
        
        <li><strong>Language Definitions:</strong> Phonetic shifts and root <code>lang</code> declarations. <strong>Screen readers rely on the language tag to load the correct accent and pronunciation rules.</strong><br>
        <em>Classification:</em> Informative &bull; <a href="https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html" target="_blank">WCAG 3.1.1</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html" target="_blank">WCAG 3.1.2</a> (2.0 A, 2.0 AA)</li>
    </ul>

    <h3 id="real-time-sync">Real-Time SPA &amp; Dynamic DOM Sync</h3>
    <p>WICK-AG-Lens features a Dual-Debounce MutationObserver to handle modern Single Page Applications (React, Vue, Angular) and dynamic content seamlessly.</p>
    <ul>
        <li><strong>SPA Navigation (Hard Wipe):</strong> Instantly detects URL changes via the history API, clearing old highlights and triggering a fresh audit to prevent stale ghost boxes from floating over new views.</li>
        <li><strong>Dynamic DOM Mutations (Soft Update):</strong> Listens for injected elements (e.g., modals, dropdowns, lazy-loaded content). Once the DOM settles, it silently runs a background rescan to attach new highlights and update holistic contexts (like Focus Order numbers) without flashing the screen.</li>
    </ul>

    <h3 id="limitations">Limitations &amp; Technical Bounds</h3>
    <ul>
        <li><strong>Dynamic Content &amp; SPAs:</strong> The inspector listens to DOM mutations to provide real-time updates. However, rapidly mutating animations or heavily throttled browser threads may occasionally delay the soft-update rescan (debounced to 750ms).</li>
        <li><strong>Visibility Filtering:</strong> Elements hidden via <code>display: none</code>, <code>visibility: hidden</code>, <code>hidden</code>, or <code>inert</code> are strictly excluded from all analysis to match native accessibility tree behavior.</li>
        <li><strong>Clipping &amp; X-Ray Vision:</strong> Elements scrolled off-screen or hidden inside <code>overflow: hidden</code> containers (like carousels) are successfully detected and rendered with a ghosted X-Ray hatched pattern.</li>
        <li><strong>Z-Index Occlusion:</strong> Visibility calculations rely on CSS properties. The tool does not calculate 3D geometric occlusion (e.g., an element technically "visible" in the DOM but visually covered by a high <code>z-index</code> modal).</li>
        <li><strong>Focus Order:</strong> Mirrors standard browser <code>Tab</code> execution, prioritizing <code>tabindex &gt; 0</code>, respecting native Radio Group bundling, and tracing hierarchical paths inside nested iframes.</li>
        <li><strong>Shadow DOMs:</strong> Standard (open) Web Components are fully traversed and supported. Explicitly 'closed' Shadow Roots remain inaccessible by browser design.</li>
        <li><strong>Iframes &amp; Cross-Origin Policies:</strong> The tool successfully aggregates data across all active iframes (including nested cross-origin embeds) for reporting and element listings. However, it cannot bypass strict Same-Origin Policies to force browser scroll events inside cross-origin windows.</li>
        <li><strong>Color Contrast Heuristics:</strong> Contrast ratios are calculated using computed DOM styles. Elements overlaying complex backgrounds (images, gradients) are explicitly flagged for Manual Review. The algorithm dynamically calculates required thresholds based on computed <code>font-size</code> and <code>font-weight</code>.</li>
        <li><strong>WCAG Criteria Filtering:</strong> The version (2.0, 2.1, 2.2) and conformance level (A, AA, AAA) filters are strictly isolated. Selecting version 2.2 does <em>not</em> automatically include 2.0 or 2.1 audits, and selecting AAA does <em>not</em> include A or AA checks. You must explicitly check all versions and levels you wish to evaluate in your current analysis.</li>
    </ul>

    <h3 id="compatibility">Compatibility &amp; License</h3>
    <p>Compatible with Google Chrome version 100.0 or higher. Operates on all URLs permitted by the user using the <code>activeTab</code>, <code>scripting</code>, and <code>storage</code> host permissions. Available under the MIT License.</p>
</div>
`;