/**
 * WICK-AG-Lens - Lightweight PDF Accessibility Scanner
 * Zero-dependency binary scanner for critical WCAG / PDF-UA compliance gatekeepers.
 */
window.A11yPdfScanner = {
    /**
     * Decodes PDF literal strings (...) or hex strings <...>
     * Handles UTF-16BE (BOM 0xFEFF) emitted by Word, Acrobat, and InDesign.
     */
    decodePdfString(raw) {
        if (!raw) return "";
        const trimmed = raw.trim();

        // Hexadecimal string: <FEFF...> or <48656C6C6F>
        if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
            const hex = trimmed.slice(1, -1).replace(/\s+/g, '');
            if (hex.toUpperCase().startsWith('FEFF')) {
                let str = '';
                for (let i = 4; i < hex.length; i += 4) {
                    const code = parseInt(hex.substr(i, 4), 16);
                    if (!isNaN(code) && code !== 0) str += String.fromCharCode(code);
                }
                return str.trim();
            } else {
                let str = '';
                for (let i = 0; i < hex.length; i += 2) {
                    const code = parseInt(hex.substr(i, 2), 16);
                    if (!isNaN(code) && code !== 0) str += String.fromCharCode(code);
                }
                return str.trim();
            }
        }

        // Literal string: (Example Title) with escape characters
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            const inner = trimmed.slice(1, -1);
            return inner
                .replace(/\\([nrtbf()\\])/g, (_, c) => {
                    const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
                    return escapes[c] || c;
                })
                .replace(/\\\d{3}/g, (oct) => String.fromCharCode(parseInt(oct.slice(1), 8)))
                .trim();
        }

        return trimmed;
    },

    /**
     * Scans an ArrayBuffer for critical accessibility indicators.
     * @param {ArrayBuffer} arrayBuffer 
     * @returns {Object} Audit evaluation
     */
    scan(arrayBuffer) {
        // Latin-1 maintains 1:1 single-byte representation across binary streams
        const decoder = new TextDecoder('latin1');
        const pdfText = decoder.decode(arrayBuffer);

        if (!pdfText.startsWith('%PDF-')) {
            throw new Error("Target file is not a valid PDF document.");
        }

        const results = {
            isTagged: false,
            hasTitle: false,
            titleValue: null,
            displayDocTitle: false,
            hasLang: false,
            langValue: null,
            isEncrypted: false,
            accessibilityAllowed: true,
            pageCount: null
        };

        // --- Accurate Page Count Parser (Handles Incremental Updates) ---
        let detectedPages = null;
        const dictRegex = /<<[\s\S]*?>>/g;
        let dictMatch;
        let rootCount = null;
        let fallbackCount = null;

        while ((dictMatch = dictRegex.exec(pdfText)) !== null) {
            const dict = dictMatch[0];
            if (/\/Type\s*\/Pages\b/i.test(dict)) {
                const cm = dict.match(/\/Count\s+(\d+)\b/i);
                if (cm) {
                    const count = parseInt(cm[1], 10);
                    // The true root Pages node has no /Parent entry
                    if (!/\/Parent\b/i.test(dict)) {
                        // NO BREAK: PDF incremental saves append updated objects to the end.
                        // Continuing to the end ensures we capture the latest active root node, ignoring deleted ghosts.
                        rootCount = count;
                    } else {
                        fallbackCount = count;
                    }
                }
            }
        }

        if (rootCount !== null) {
            detectedPages = rootCount;
        } else if (fallbackCount !== null) {
            detectedPages = fallbackCount;
        } else {
            // Strategy 2: Count individual page leaf objects (/Type /Page)
            const pageLeaves = pdfText.match(/\/Type\s*\/Page\b(?!\s*s)/gi);
            if (pageLeaves && pageLeaves.length > 0) {
                detectedPages = pageLeaves.length;
            }
        }

        results.pageCount = detectedPages; // null if uncompressed tree isn't found

        // 1. Tagged PDF Check (WCAG 1.3.1 - Info and Relationships)
        const hasMarkedTrue = /\/Marked\s+true\b/i.test(pdfText);
        const hasMarkedFalse = /\/Marked\s+false\b/i.test(pdfText);
        results.isTagged = hasMarkedTrue && !hasMarkedFalse;

        // 2. Document Title Check (WCAG 2.4.2 - Page Titled)
        const titleMatch = pdfText.match(/\/Title\s*(\([^)]*\)|<[0-9A-Fa-f\s]+>)/);
        if (titleMatch && titleMatch[1]) {
            const decodedTitle = this.decodePdfString(titleMatch[1]);
            if (decodedTitle.length > 0) {
                results.hasTitle = true;
                results.titleValue = decodedTitle;
            }
        }

        if (/\/DisplayDocTitle\s+true\b/i.test(pdfText)) {
            results.displayDocTitle = true;
        }

        // 3. Primary Language Check (WCAG 3.1.1 - Language of Page)
        const langMatch = pdfText.match(/\/Lang\s*(\([^)]*\)|<[0-9A-Fa-f\s]+>)/i);
        if (langMatch && langMatch[1]) {
            const decodedLang = this.decodePdfString(langMatch[1]);
            if (decodedLang.length > 0) {
                results.hasLang = true;
                results.langValue = decodedLang;
            }
        }

        // 4. Accessibility Extraction Security Flags
        const hasEncryption = /\/Encrypt\s+\d+\s+\d+\s+R/i.test(pdfText) || /\/Encrypt\s*<</i.test(pdfText);
        if (hasEncryption) {
            results.isEncrypted = true;
            const pMatch = pdfText.match(/\/P\s+(-?\d+)/);
            if (pMatch) {
                const pValue = parseInt(pMatch[1], 10);
                // Bit 10 (value 512, 0x200): 1 = Allowed, 0 = Locked out
                results.accessibilityAllowed = (pValue & 512) !== 0;
            }
        }

        return results;
    }
};