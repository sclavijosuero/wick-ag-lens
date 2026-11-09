document.addEventListener("DOMContentLoaded", () => {
    // 1. Establish strict DevTools Tab ID scope
    const tabId = chrome.devtools.inspectedWindow.tabId;
    const STORAGE_KEY_MODE = `a11y_mode_${tabId}`;
    const STORAGE_KEY_FEATURES = `a11y_active_features_${tabId}`;
    const STORAGE_KEY_GROUPS = `a11y_collapsed_groups_${tabId}`;
    const STORAGE_KEY_SIM = `a11y_sim_state_${tabId}`;
    const STORAGE_KEY_OPTIONS = `a11y_options_${tabId}`;
    const STORAGE_KEY_PDF_AUTOSCAN = `a11y_pdf_autoscan_${tabId}`;

    document.querySelectorAll(".copyright-year").forEach(el => el.textContent = new Date().getFullYear());

    // LIVE MODAL STATE TRACKERS
    let activeModalRule = null;
    let activeModalElements = [];

    // PDF Mode State
    let pdfAutoScanEnabled = false;
    let lastAuditedPdfUrl = null;
    let currentPdfChecks = [];
    let currentPdfFailCount = 0;

    // Custom UI Notification Utility
    function showPanelToast(message) {
        let toast = document.getElementById('panel-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'panel-toast';
            toast.className = 'panel-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => toast.classList.remove('show'), 4000);
    }

    // 7. DevTools Lifecycle Management
    let panelPort = null;
    function connectToContentScript() {
        if (panelPort) {
            panelPort.disconnect();
        }
        panelPort = chrome.tabs.connect(tabId, { name: "a11y-panel" });
        
        panelPort.onDisconnect.addListener(() => {
            const err = chrome.runtime.lastError; 
            panelPort = null;
        });
    }

    function safeSendMessage(message, options = {}) {
        chrome.tabs.sendMessage(tabId, message, options, () => {
            const err = chrome.runtime.lastError; 
        });
    }

    // 2. Mode Switching Logic
    const modeBtnInspect = document.getElementById("mode-btn-inspect");
    const modeBtnSimulate = document.getElementById("mode-btn-simulate");
    const modeBtnPdf = document.getElementById("mode-btn-pdf");

    const viewInspectMode = document.getElementById("view-inspect-mode");
    const viewSimulateMode = document.getElementById("view-simulate-mode");
    const viewPdfMode = document.getElementById("view-pdf-mode");
    
    const footerTitle = document.getElementById("footer-title");
    const footerInspectContent = document.getElementById("footer-inspect-content");
    const footerSimulateContent = document.getElementById("footer-simulate-content");
    const footerPdfContent = document.getElementById("footer-pdf-content");

    function setAppMode(mode, save = true) {
        [modeBtnInspect, modeBtnSimulate, modeBtnPdf].forEach(btn => {
            if (btn) {
                btn.classList.remove("active");
                const radio = btn.querySelector("input");
                if (radio) radio.checked = false;
            }
        });

        if (viewInspectMode) { viewInspectMode.classList.remove("active"); viewInspectMode.style.display = "none"; }
        if (viewSimulateMode) { viewSimulateMode.classList.remove("active"); viewSimulateMode.style.display = "none"; }
        if (viewPdfMode) { viewPdfMode.classList.remove("active"); viewPdfMode.style.display = "none"; }

        if (footerInspectContent) footerInspectContent.style.display = "none";
        if (footerSimulateContent) footerSimulateContent.style.display = "none";
        if (footerPdfContent) footerPdfContent.style.display = "none";

        if (mode === "simulate") {
            if (modeBtnSimulate) {
                modeBtnSimulate.classList.add("active");
                const radio = modeBtnSimulate.querySelector("input");
                if (radio) radio.checked = true;
            }
            if (viewSimulateMode) {
                viewSimulateMode.classList.add("active");
                viewSimulateMode.style.display = "";
            }
            if (footerTitle) footerTitle.textContent = "Simulate Mode Restrictions & Bounds";
            if (footerSimulateContent) footerSimulateContent.style.display = "block";

            safeSendMessage({ action: "clearAllAudits" });
            sendSimulateStateToContent();
        } else if (mode === "pdf") {
            if (modeBtnPdf) {
                modeBtnPdf.classList.add("active");
                const radio = modeBtnPdf.querySelector("input");
                if (radio) radio.checked = true;
            }
            if (viewPdfMode) {
                viewPdfMode.classList.add("active");
                viewPdfMode.style.display = "flex";
            }
            if (footerTitle) footerTitle.textContent = "PDF Mode Restrictions & Bounds";
            if (footerPdfContent) footerPdfContent.style.display = "block";

            safeSendMessage({ action: "clearAllAudits" });
            safeSendMessage({ action: "clearSimulation" });
            inspectPdfTabIfActive(pdfAutoScanEnabled);
        } else {
            mode = "inspect";
            if (modeBtnInspect) {
                modeBtnInspect.classList.add("active");
                const radio = modeBtnInspect.querySelector("input");
                if (radio) radio.checked = true;
            }
            if (viewInspectMode) {
                viewInspectMode.classList.add("active");
                viewInspectMode.style.display = "";
            }
            if (footerTitle) footerTitle.textContent = "Inspect Mode Restrictions & Bounds";
            if (footerInspectContent) footerInspectContent.style.display = "block";

            safeSendMessage({ action: "clearSimulation" });
            restoreActiveAuditHighlights();
        }

        if (save) {
            chrome.storage.local.set({ [STORAGE_KEY_MODE]: mode });
        }
    }

    if (modeBtnInspect) modeBtnInspect.addEventListener("click", () => setAppMode("inspect"));
    if (modeBtnSimulate) modeBtnSimulate.addEventListener("click", () => setAppMode("simulate"));
    if (modeBtnPdf) modeBtnPdf.addEventListener("click", () => setAppMode("pdf"));

    // 3. Tab Switching Logic
    const inspectTabBtns = document.querySelectorAll("#view-inspect-mode .tab-btn");
    const inspectTabContents = document.querySelectorAll("#view-inspect-mode .tab-content");

    inspectTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            inspectTabBtns.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });
            inspectTabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");
            document.getElementById(btn.getAttribute("aria-controls")).classList.add("active");
        });
    });

    const simTabBtns = document.querySelectorAll("#view-simulate-mode .tab-btn");
    const simTabContents = document.querySelectorAll("#view-simulate-mode .tab-content");

    simTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            simTabBtns.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });
            simTabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");
            document.getElementById(btn.getAttribute("aria-controls")).classList.add("active");
            
            const targetId = btn.getAttribute("aria-controls");
            if (targetId === "tab-sim-cb") simState.category = "colorBlindness";
            else if (targetId === "tab-sim-iv") simState.category = "impairedVision";
            
            sendSimulateStateToContent();
        });
    });

    const footerExpandBtn = document.getElementById("footer-expand-btn");
    if (footerExpandBtn) {
        footerExpandBtn.addEventListener("click", () => {
            const footer = document.getElementById("footer-restrictions");
            if (footer) {
                const isCollapsed = footer.classList.toggle("collapsed");
                footerExpandBtn.setAttribute("aria-expanded", !isCollapsed);
            }
        });
    }

    const config = window.A11Y_CONFIG;

    function getFeatureConfigById(featureId) {
        if (!config) return null;
        for (let tab of config.tabs) {
            for (let cat of tab.categories) {
                for (let f of cat.features) {
                    if (f.id === featureId) return f;
                }
            }
        }
        return null;
    }

    function getFeatureConfig(featureId) {
        if (!window.A11Y_CONFIG) return null;
        for (let tab of window.A11Y_CONFIG.tabs) {
            for (let cat of tab.categories) {
                for (let f of cat.features) {
                    if (f.id === featureId) return { feature: f, category: cat, tab: tab };
                }
            }
        }
        return null;
    }

    function sortElementsHierarchically(elements) {
        return elements.sort((a, b) => {
            const regex = /#(\d+(?:\.\d+)*):/;
            const matchA = a.label.match(regex);
            const matchB = b.label.match(regex);
            if (matchA && matchB) {
                const hA = matchA[1].split('.').map(Number);
                const hB = matchB[1].split('.').map(Number);
                const len = Math.max(hA.length, hB.length);
                for (let i = 0; i < len; i++) {
                    const valA = hA[i] !== undefined ? hA[i] : -1; 
                    const valB = hB[i] !== undefined ? hB[i] : -1;
                    if (valA !== valB) return valA - valB;
                }
            }
            return 0;
        });
    }

    function isWcagMatch(wcagArray, checkedVersions, checkedLevels) {
        if (!wcagArray || wcagArray.length === 0) return true;
        return wcagArray.some(w => checkedVersions.includes(w.version) && checkedLevels.includes(w.level));
    }

    function getActiveLegends(feature) {
        const checkedVersions = Array.from(document.querySelectorAll('.wcag-version-filter:checked')).map(cb => cb.value);
        const checkedLevels = Array.from(document.querySelectorAll('.wcag-level-filter:checked')).map(cb => cb.value);

        if (!feature.legends) return isWcagMatch(feature.wcag, checkedVersions, checkedLevels) ? ["bad", "default"] : [];
        return feature.legends
            .filter(leg => isWcagMatch(leg.wcag || feature.wcag, checkedVersions, checkedLevels))
            .map(leg => leg.type);
    }
    
    function getActiveOptions(featureId) {
        const opts = {};
        document.querySelectorAll(`.feature-opt-toggle[data-feature="${featureId}"]`).forEach(t => {
            opts[t.dataset.opt] = t.checked;
        });
        return opts;
    }

    function saveOptionsState() {
        const opts = {};
        document.querySelectorAll('.feature-opt-toggle').forEach(t => {
            opts[`${t.dataset.feature}_${t.dataset.opt}`] = t.checked;
        });
        chrome.storage.local.set({ [STORAGE_KEY_OPTIONS]: opts });
    }

    function formatWcagLabel(wcagArray) {
        if (!wcagArray || wcagArray.length === 0) return "";
        const formatted = wcagArray.map(w => `${w.version} ${w.level}`).join(", ");
        return `<span class="wcag-tag" title="WCAG Success Criterion Mapping">${formatted}</span>`;
    }

    function applyWcagFilters(suppressHighlight = false) {
        const checkedVersions = Array.from(document.querySelectorAll('.wcag-version-filter:checked')).map(cb => cb.value);
        const checkedLevels = Array.from(document.querySelectorAll('.wcag-level-filter:checked')).map(cb => cb.value);

        document.querySelectorAll('.feature-row').forEach(row => {
            const featureId = row.id.replace('row-', '');
            const feature = getFeatureConfigById(featureId);
            if (!feature) return;

            const activeLegends = getActiveLegends(feature);
            const toggle = row.querySelector('.feature-toggle');

            if (activeLegends.length === 0) {
                row.style.display = 'none';
                if (toggle && toggle.checked) {
                    toggle.checked = false;
                    toggle.dispatchEvent(new Event('change'));
                }
            } else {
                row.style.display = '';
                if (feature.legends) {
                    feature.legends.forEach(leg => {
                        const legendItem = row.querySelector(`.legend-item[data-legend-type="${leg.type}"]`);
                        if (legendItem) {
                            if (activeLegends.includes(leg.type)) legendItem.style.display = 'flex';
                            else legendItem.style.display = 'none';
                        }
                    });
                }

                if (!suppressHighlight && toggle && toggle.checked && modeBtnInspect && modeBtnInspect.classList.contains("active")) {
                    safeSendMessage({
                        action: 'highlight',
                        featureId: featureId,
                        activeLegends: activeLegends,
                        options: getActiveOptions(featureId)
                    });
                }
            }
        });
        updateAllHierarchyStates();
    }

    document.querySelectorAll('.wcag-version-filter, .wcag-level-filter').forEach(cb => {
        cb.addEventListener('change', () => applyWcagFilters(false));
    });

    const frameCounts = {};

    function updateFeatureBadges(featureId) {
        const aggregateTotals = {};
        let grandTotal = 0;

        if (frameCounts[featureId]) {
            Object.values(frameCounts[featureId]).forEach(totals => {
                for (const [type, count] of Object.entries(totals)) {
                    aggregateTotals[type] = (aggregateTotals[type] ? aggregateTotals[type] : 0) + count;
                    grandTotal += count;
                }
            });
        }

        const toggle = document.querySelector(`.feature-toggle[data-feature="${featureId}"]`);
        const isActive = toggle ? toggle.checked : false;
        const feature = getFeatureConfigById(featureId);

        if (feature && feature.legends) {
            feature.legends.forEach(leg => {
                const badge = document.getElementById(`count-${featureId}-${leg.type}`);
                if (badge) {
                    const count = aggregateTotals[leg.type] ? aggregateTotals[leg.type] : 0;
                    badge.textContent = count;
                    if (isActive) badge.classList.add("visible");
                    else badge.classList.remove("visible");
                }
            });
        }

        const totalBadge = document.getElementById(`total-${featureId}`);
        if (totalBadge) {
            totalBadge.textContent = `${grandTotal} elements`;
            if (isActive) totalBadge.classList.add("visible");
            else totalBadge.classList.remove("visible");
        }

        const viewBtn = document.getElementById(`view-${featureId}`);
        if (viewBtn) {
            if (grandTotal > 0 && isActive) {
                viewBtn.classList.add("visible");
                viewBtn.title = "Inspect Element in Elements Panel";
            } else {
                viewBtn.classList.remove("visible");
                viewBtn.title = "View Elements (None)";
            }
        }

        updateAggregateCounts();
    }

    function resetBadges(featureId) {
        delete frameCounts[featureId];
        updateFeatureBadges(featureId);
    }

    function saveActiveFeaturesState() {
        const activeFeatures = Array.from(document.querySelectorAll('.feature-toggle:checked'))
            .map(cb => cb.getAttribute('data-feature'));
        chrome.storage.local.set({ [STORAGE_KEY_FEATURES]: activeFeatures });
    }

    function saveCollapsedState() {
        const collapsedGroups = Array.from(document.querySelectorAll('.category-group.collapsed'))
            .map(g => g.id);
        chrome.storage.local.set({ [STORAGE_KEY_GROUPS]: collapsedGroups });
    }

    function restoreActiveAuditHighlights() {
        const activeFeatures = Array.from(document.querySelectorAll('.feature-toggle:checked'))
            .filter(ft => ft.closest('.feature-row').style.display !== 'none')
            .map(cb => cb.getAttribute('data-feature'));

        activeFeatures.forEach(featureId => {
            const feature = getFeatureConfigById(featureId);
            safeSendMessage({ 
                action: 'highlight', 
                featureId, 
                activeLegends: getActiveLegends(feature),
                options: getActiveOptions(featureId) 
            });
        });
    }

    // =========================================================================
    // SIMULATOR STATE MANAGEMENT & DISPATCH
    // =========================================================================
    const simState = {
        category: "colorBlindness", 
        colorBlindness: "none",     
        impairedVision: { cataracts: 0, diplopia: 0, contrast: 0, yellowing: 0, fieldLossType: "none", fieldLossVal: 5 }
    };

    function sendSimulateStateToContent() {
        if (!modeBtnSimulate || !modeBtnSimulate.classList.contains("active")) return;
        safeSendMessage({ action: "applySimulation", state: simState });
        chrome.storage.local.set({ [STORAGE_KEY_SIM]: simState });
    }
    
    document.querySelectorAll(".info-btn-sim").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const infoPanel = e.currentTarget.closest(".sim-control-header, .sim-card-header").parentElement.querySelector(".sim-info-panel");
            if (infoPanel) {
                if (infoPanel.style.display === "none") infoPanel.style.display = "block";
                else infoPanel.style.display = "none";
            }
        });
    });

    document.querySelectorAll('input[name="sim-cb-option"]').forEach(radio => {
        radio.addEventListener("change", (e) => {
            simState.category = "colorBlindness";
            simState.colorBlindness = e.target.value;
            sendSimulateStateToContent();
        });
    });

    const sliderConfigs = [
        { id: "sim-cataracts-range", valId: "sim-cataracts-val", key: "cataracts" },
        { id: "sim-diplopia-range", valId: "sim-diplopia-val", key: "diplopia" },
        { id: "sim-contrast-range", valId: "sim-contrast-val", key: "contrast" },
        { id: "sim-yellowing-range", valId: "sim-yellowing-val", key: "yellowing" }
    ];

    sliderConfigs.forEach(cfg => {
        const sliderEl = document.getElementById(cfg.id);
        const valEl = document.getElementById(cfg.valId);
        if (sliderEl && valEl) {
            sliderEl.addEventListener("input", (e) => {
                const v = parseInt(e.target.value, 10);
                valEl.textContent = `${v}%`;
                simState.category = "impairedVision";
                simState.impairedVision[cfg.key] = v;
                sendSimulateStateToContent();
            });
        }
    });

    const fieldLossGroup = document.getElementById("sim-field-loss-slider-group");
    const fieldLossRange = document.getElementById("sim-field-loss-range");
    const fieldLossVal = document.getElementById("sim-field-loss-val");

    document.querySelectorAll('input[name="sim-field-loss-type"]').forEach(radio => {
        radio.addEventListener("change", (e) => {
            const type = e.target.value;
            simState.category = "impairedVision";
            simState.impairedVision.fieldLossType = type;
            if (fieldLossGroup) {
                if (type === "none") fieldLossGroup.style.display = "none";
                else fieldLossGroup.style.display = "block";
            }
            sendSimulateStateToContent();
        });
    });

    if (fieldLossRange && fieldLossVal) {
        fieldLossRange.addEventListener("input", (e) => {
            const v = parseInt(e.target.value, 10);
            fieldLossVal.textContent = `${v}%`;
            simState.category = "impairedVision";
            simState.impairedVision.fieldLossVal = v;
            sendSimulateStateToContent();
        });
    }

    const setupGlobalCollapseToggle = (tabIdName, toggleBtnId) => {
        const btn = document.getElementById(toggleBtnId);
        if (!btn) return () => { };

        const evaluateState = () => {
            const groups = document.querySelectorAll(`#${tabIdName} .category-group`);
            if (groups.length === 0) return;
            const allCollapsed = Array.from(groups).every(g => g.classList.contains('collapsed'));
            if (allCollapsed) {
                btn.classList.add('collapsed');
                btn.title = "Expand All";
            } else {
                btn.classList.remove('collapsed');
                btn.title = "Collapse All";
            }
        };

        btn.addEventListener("click", () => {
            const isCurrentlyCollapsed = btn.classList.contains('collapsed');
            const groups = document.querySelectorAll(`#${tabIdName} .category-group`);

            groups.forEach(g => {
                if (isCurrentlyCollapsed) g.classList.remove('collapsed');
                else g.classList.add('collapsed');

                const expandBtn = g.querySelector('.category-expand-btn');
                if (expandBtn) expandBtn.setAttribute("aria-expanded", isCurrentlyCollapsed);
            });

            saveCollapsedState();
            evaluateState();
        });

        return evaluateState;
    };

    const evalViolationsCollapseState = setupGlobalCollapseToggle("tab-violations", "toggle-collapse-violations");
    const evalInformativeCollapseState = setupGlobalCollapseToggle("tab-informative", "toggle-collapse-informative");

    function updateTabHierarchyStates(tabContainerId) {
        const container = document.getElementById(tabContainerId);
        if (!container) return;

        const masterToggleId = tabContainerId === "tab-violations" ? "master-toggle-violations" : "master-toggle-informative";
        const masterToggle = document.getElementById(masterToggleId);

        let totalTabFeatures = 0;
        let checkedTabFeatures = 0;

        const categoryGroups = container.querySelectorAll(".category-group");
        categoryGroups.forEach(group => {
            const catToggle = group.querySelector(".category-toggle");
            const featureToggles = Array.from(group.querySelectorAll(".feature-toggle")).filter(ft => ft.closest('.feature-row').style.display !== 'none');

            let catTotal = featureToggles.length;
            let catChecked = 0;

            featureToggles.forEach(ft => { if (ft.checked) catChecked++; });

            totalTabFeatures += catTotal;
            checkedTabFeatures += catChecked;

            if (catToggle) {
                if (catChecked === catTotal && catTotal > 0) {
                    catToggle.checked = true;
                    catToggle.indeterminate = false;
                } else if (catChecked === 0) {
                    catToggle.checked = false;
                    catToggle.indeterminate = false;
                } else {
                    catToggle.checked = false;
                    catToggle.indeterminate = true;
                }
            }
            if (catTotal === 0) group.style.display = 'none';
            else group.style.display = '';
        });

        if (masterToggle) {
            if (checkedTabFeatures === totalTabFeatures && totalTabFeatures > 0) {
                masterToggle.checked = true;
                masterToggle.indeterminate = false;
            } else if (checkedTabFeatures === 0) {
                masterToggle.checked = false;
                masterToggle.indeterminate = false;
            } else {
                masterToggle.checked = false;
                masterToggle.indeterminate = true;
            }
        }
        updateAggregateCounts();
    }

    function updateAllHierarchyStates() {
        updateTabHierarchyStates("tab-violations");
        updateTabHierarchyStates("tab-informative");
    }

    function updateAggregateCounts() {
        ['tab-violations', 'tab-informative'].forEach(tabName => {
            const container = document.getElementById(tabName);
            if (!container) return;

            let tabCheckedFeatures = 0;
            let tabTotalFound = 0;

            const categoryGroups = container.querySelectorAll(".category-group");
            categoryGroups.forEach(group => {
                const catToggle = group.querySelector(".category-toggle");
                if (!catToggle) return;
                const catId = catToggle.getAttribute("data-cat");

                let catCheckedFeatures = 0;
                let catTotalFound = 0;

                const featureToggles = Array.from(group.querySelectorAll(".feature-toggle")).filter(ft => ft.closest('.feature-row').style.display !== 'none');
                const catTotalFeatures = featureToggles.length;

                featureToggles.forEach(ft => {
                    if (ft.checked) {
                        catCheckedFeatures++;
                        const featureId = ft.getAttribute("data-feature");
                        let featureTotal = 0;
                        if (frameCounts[featureId]) {
                            Object.values(frameCounts[featureId]).forEach(totals => {
                                Object.values(totals).forEach(count => { featureTotal += count; });
                            });
                        }
                        catTotalFound += featureTotal;
                    }
                });

                tabCheckedFeatures += catCheckedFeatures;
                tabTotalFound += catTotalFound;

                const catCountEl = document.getElementById(`cat-count-${catId}`);
                if (catCountEl) {
                    if (catCheckedFeatures > 0) {
                        catCountEl.textContent = `${catCheckedFeatures} active audits of ${catTotalFeatures} • ${catTotalFound} elements`;
                        catCountEl.classList.add("visible");
                    } else {
                        catCountEl.classList.remove("visible");
                    }
                }
            });

            const masterSuffix = tabName === 'tab-violations' ? 'violations' : 'informative';
            const masterCountEl = document.getElementById(`master-count-${masterSuffix}`);
            const copyReportBtn = document.getElementById(`copy-report-${masterSuffix}`);

            if (masterCountEl) {
                if (tabCheckedFeatures > 0) {
                    const totalPossibleTabFeatures = Array.from(container.querySelectorAll('.feature-toggle')).filter(ft => ft.closest('.feature-row').style.display !== 'none').length;
                    masterCountEl.textContent = `${tabCheckedFeatures} active audits of ${totalPossibleTabFeatures} • ${tabTotalFound} elements`;
                    masterCountEl.classList.add("visible");
                } else {
                    masterCountEl.classList.remove("visible");
                }
            }

            if (copyReportBtn) {
                if (tabCheckedFeatures > 0) copyReportBtn.classList.add("visible");
                else copyReportBtn.classList.remove("visible");
            }
        });
    }

    function formatLabel(legend, label) {
        const l1 = (legend || '').trim();
        const l2 = (label || '').trim();
        if (l1 && l2) {
            if (l1.toLowerCase() === l2.toLowerCase()) return l1;
            // Prevent repeating "Tracking Pixel: Tracking Pixel (Missing alt)"
            if (l2.toLowerCase().startsWith(l1.toLowerCase())) return l2;
            return `${l1}: ${l2}`;
        }
        return l1 || l2 || 'INFO';
    }

    function getTextColor(hexColor) {
        if (!hexColor) return '#ffffff';
        const hex = hexColor.replace('#', '');
        if (hex.length !== 6) return '#ffffff';
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#202124' : '#ffffff';
    }

    async function copyTabReport(tabName, btnEl) {
        const activeToggles = Array.from(document.querySelectorAll(`#${tabName} .feature-toggle:checked`))
            .filter(t => t.closest('.feature-row').style.display !== 'none');

        if (activeToggles.length === 0) return;

        const activeFeatureIds = activeToggles.map(t => t.getAttribute('data-feature'));

        const frameIdsSet = new Set([0]); 
        activeFeatureIds.forEach(fId => {
            if (frameCounts[fId]) {
                Object.keys(frameCounts[fId]).forEach(id => frameIdsSet.add(parseInt(id)));
            }
        });

        const allReportData = {};
        let topUrl = 'Unknown';
        let topTitle = 'Unknown';

        const promises = Array.from(frameIdsSet).map(fId => {
            return new Promise(resolve => {
                chrome.tabs.sendMessage(tabId, { action: 'getTabReportData', featureIds: activeFeatureIds }, { frameId: fId }, (response) => {
                    if (!chrome.runtime.lastError && response) {
                        if (fId === 0) {
                            topUrl = response.url || topUrl;
                            topTitle = response.title || topTitle;
                        }
                        resolve(response.data || {});
                    } else {
                        resolve({});
                    }
                });
            });
        });

        const results = await Promise.all(promises);
        
        results.forEach(frameData => {
            Object.keys(frameData).forEach(featureId => {
                if (!allReportData[featureId]) allReportData[featureId] = [];
                allReportData[featureId].push(...frameData[featureId]);
            });
        });

        const tabTitle = tabName === 'tab-violations' ? 'VIOLATIONS & WARNINGS' : 'INFORMATIVE & STRUCTURE';
        const now = new Date();
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const dateStr = now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

        let totalElements = 0;
        Object.values(allReportData).forEach(arr => totalElements += arr.length);

        let report = `************************************************************\n`;
        report += `WICK-AG-LENS REPORT: ${tabTitle}\n`;
        report += `************************************************************\n`;
        report += `• Generated:  ${dateStr} (${timeZone})\n`;
        report += `• Page URL:   ${topUrl}\n`;
        report += `• Page Title: ${topTitle}\n`;
        report += `• Summary:    ${activeFeatureIds.length} Active Audits | ${totalElements} Total Findings\n`;
        report += `============================================================\n\n\n`;

        const tabConfig = config.tabs.find(t => t.id === tabName);
        if (tabConfig) {
            const groupBlocks = [];
            tabConfig.categories.forEach(cat => {
                const activeCatFeatures = cat.features.filter(f => activeFeatureIds.includes(f.id));
                if (activeCatFeatures.length > 0) {
                    let groupText = `============================================================\n`;
                    groupText += `GROUP: ${cat.label.toUpperCase()}\n`;
                    groupText += `============================================================\n\n`;

                    const auditBlocks = [];
                    activeCatFeatures.forEach(feature => {
                        const elements = allReportData[feature.id] || [];
                        const elemCountLabel = `${elements.length} ${elements.length === 1 ? 'element' : 'elements'}`;

                        let auditText = `------------------------------------------------------------\n`;
                        const severityMarker = feature.severity ? ` [SEVERITY: ${feature.severity.toUpperCase()}]` : '';

                        const activeLegends = getActiveLegends(feature);
                        
                        let activeElements = elements.filter(el => activeLegends.includes(el.legendType || el.legendLabel));
                        activeElements = sortElementsHierarchically(activeElements);

                        auditText += `AUDIT: ${feature.label.toUpperCase()}${severityMarker} (${activeElements.length} displayed elements)\n`;
                        
                        if (feature.desc) auditText += `Description: ${feature.desc.replace(/<[^>]*>?/gm, '')}\n`;
                        if (feature.info && feature.info.fix) auditText += `Remediation: ${feature.info.fix.replace(/<[^>]*>?/gm, '')}\n`;

                        auditText += `------------------------------------------------------------\n`;

                        if (activeElements.length > 0) {
                            activeElements.forEach(el => {
                                const displayLabel = formatLabel(el.legendLabel, el.label);
                                auditText += `[${displayLabel}] ${el.selector}\n`;
                            });
                        } else {
                            auditText += `(No matching elements found for current WCAG filters)\n`;
                        }
                        auditBlocks.push(auditText);
                    });
                    groupText += auditBlocks.join('\n\n');
                    groupBlocks.push(groupText);
                }
            });
            report += groupBlocks.join('\n\n\n');
        }

        navigator.clipboard.writeText(report.trim()).then(() => {
            const originalText = btnEl.textContent;
            btnEl.textContent = '✔';
            btnEl.title = 'Report Copied!';
            setTimeout(() => {
                btnEl.textContent = originalText;
                btnEl.title = 'Copy Tab Report to Clipboard';
            }, 2000);
        });
    }

    const copyViolationsBtn = document.getElementById("copy-report-violations");
    if (copyViolationsBtn) copyViolationsBtn.addEventListener("click", () => copyTabReport("tab-violations", copyViolationsBtn));

    const copyInformativeBtn = document.getElementById("copy-report-informative");
    if (copyInformativeBtn) copyInformativeBtn.addEventListener("click", () => copyTabReport("tab-informative", copyInformativeBtn));

    // --- MODAL ELEMENT FETCHING & REFRESH LOGIC ---
    function openDetailsModal(ruleMapping, filteredElements) {
        activeModalRule = ruleMapping;
        activeModalElements = filteredElements;
        
        const existing = document.getElementById('a11y-details-modal');
        if (existing) existing.remove();

        const previousActiveElement = document.activeElement;

        const modal = document.createElement('div');
        modal.id = 'a11y-details-modal';
        modal.className = 'a11y-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'details-modal-title');

        modal.innerHTML = `
            <div class="a11y-modal-content" style="height: 80vh;">
                <div class="a11y-modal-header">
                    <div class="a11y-modal-title-area">
                        <h2 id="details-modal-title" style="margin: 0; font-size: 16px; font-weight: 700;">Elements</h2>
                    </div>
                    <div class="a11y-modal-actions">
                        <button id="modal-copy-all-btn" class="a11y-btn-secondary">📋 Copy All</button>
                        <button id="modal-close-btn" class="a11y-btn-icon" aria-label="Close dialog">✖</button>
                    </div>
                </div>
                <div class="a11y-modal-list" tabindex="0">
                    <!-- Elements will be injected here by refreshDetailsModal -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => {
            activeModalRule = null;
            activeModalElements = [];
            modal.remove();
            document.removeEventListener('keydown', trapFocus);
            if (previousActiveElement) previousActiveElement.focus();
        };

        document.getElementById('modal-close-btn').addEventListener('click', closeModal);

        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1] || firstElement;

        const trapFocus = (e) => {
            if (e.key === 'Escape') closeModal();
            else if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) { e.preventDefault(); lastElement.focus(); }
                } else {
                    if (document.activeElement === lastElement) { e.preventDefault(); firstElement.focus(); }
                }
            }
        };
        
        document.addEventListener('keydown', trapFocus);
        
        document.getElementById('modal-copy-all-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (activeModalElements.length === 0) return;
            
            const configData = getFeatureConfig(activeModalRule.id);
            if (!configData) return;
            
            const { feature, category, tab: configTab } = configData;
            
            const tabTitle = configTab.id === 'tab-violations' ? 'VIOLATIONS & WARNINGS' : 'INFORMATIVE & STRUCTURE';
            const now = new Date();
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const dateStr = now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

            chrome.tabs.get(tabId, (currentTab) => {
                const topUrl = currentTab && currentTab.url ? currentTab.url : 'Unknown';
                const topTitle = currentTab && currentTab.title ? currentTab.title : 'Unknown';

                let text = `************************************************************\n`;
                text += `WICK-AG-LENS REPORT: ${tabTitle}\n`;
                text += `************************************************************\n`;
                text += `• Generated:  ${dateStr} (${timeZone})\n`;
                text += `• Page URL:   ${topUrl}\n`;
                text += `• Page Title: ${topTitle}\n`;
                text += `• Summary:    1 Active Audit | ${activeModalElements.length} Total Findings\n`;
                text += `============================================================\n\n\n`;

                text += `============================================================\n`;
                text += `GROUP: ${category.label.toUpperCase()}\n`;
                text += `============================================================\n\n`;
                
                text += `------------------------------------------------------------\n`;
                const severityMarker = feature.severity ? ` [SEVERITY: ${feature.severity.toUpperCase()}]` : '';
                text += `AUDIT: ${feature.label.toUpperCase()}${severityMarker} (${activeModalElements.length} displayed elements)\n`;
                
                if (feature.desc) text += `Description: ${feature.desc.replace(/<[^>]*>?/gm, '')}\n`;
                if (feature.info && feature.info.fix) text += `Remediation: ${feature.info.fix.replace(/<[^>]*>?/gm, '')}\n`;
                text += `------------------------------------------------------------\n`;
                
                activeModalElements.forEach(el => {
                    const label = formatLabel(el.legendLabel, el.label);
                    text += `[${label}] ${el.selector}\n`;
                });
                
                navigator.clipboard.writeText(text).then(() => {
                    const origText = btn.textContent;
                    btn.textContent = '✔ Copied!';
                    setTimeout(() => { btn.textContent = origText; }, 2000);
                });
            });
        });

        refreshDetailsModal();
        document.getElementById('modal-close-btn').focus();
    }

    async function fetchModalElements(ruleMapping) {
        const featureId = ruleMapping.id;
        const feature = getFeatureConfigById(featureId);
        if (!feature) return [];

        const allElements = [];
        const activeFrames = frameCounts[featureId] ? Object.keys(frameCounts[featureId]) : [0];
        
        const promises = activeFrames.map(fId => {
            return new Promise(resolve => {
                chrome.tabs.sendMessage(tabId, { action: 'getRuleDetails', ruleId: featureId }, { frameId: parseInt(fId) }, (response) => {
                    if (chrome.runtime.lastError || !response || !response.elements) {
                        resolve({ frameId: parseInt(fId), elements: [] });
                    } else {
                        resolve({ frameId: parseInt(fId), elements: response.elements });
                    }
                });
            });
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
            res.elements.forEach(el => {
                el.frameId = res.frameId; 
                allElements.push(el);
            });
        });

        const activeLegends = getActiveLegends(feature);
        let filteredElements = allElements.filter(el => activeLegends.includes(el.legendType || el.legendLabel));
        return sortElementsHierarchically(filteredElements);
    }

    async function refreshDetailsModal() {
        if (!activeModalRule) return;
        
        const filteredElements = await fetchModalElements(activeModalRule);
        activeModalElements = filteredElements;
        
        const modalList = document.querySelector('#a11y-details-modal .a11y-modal-list');
        const modalTitleArea = document.getElementById('details-modal-title');
        
        if (!modalList || !modalTitleArea) return;

        const countText = filteredElements.length > 0 ? `(${filteredElements.length} Total)` : '';
        modalTitleArea.innerHTML = `Elements: ${activeModalRule.name} ${countText}`;

        modalList.innerHTML = filteredElements.map(el => {
            const pillBg = el.color ? el.color : '#e67e22';
            const pillTxt = getTextColor(pillBg);
            const pillShadow = pillTxt === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none';
            const rawLabel = formatLabel(el.legendLabel, el.label);
            const safeLabel = rawLabel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Remove the Locate button for tracking pixels since they cannot be visually highlighted
            return `
                <div class="a11y-modal-list-item" data-target-id="${el.id}">
                    <div class="a11y-modal-item-info">
                        <span class="a11y-pill-label" style="background-color: ${pillBg}; color:${pillTxt}; text-shadow: ${pillShadow};">${safeLabel}</span>
                        <span class="a11y-selector-path">${el.selector}</span>
                    </div>
                    ${(el.legendType === 'hidden-dup' || el.legendType === 'tracking') ? '' : `
                    <button class="a11y-scroll-btn" aria-label="Scroll element into view">
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
                        </svg>
                    </button>
                    `}
                </div>
            `;
        }).join('');

        modalList.querySelectorAll('.a11y-modal-list-item').forEach(item => {
            const scrollBtn = item.querySelector('.a11y-scroll-btn');
            if (scrollBtn) {
                scrollBtn.addEventListener('click', () => {
                    const targetId = item.dataset.targetId;
                    const elementData = filteredElements.find(e => e.id === targetId);
                    const message = { 
                        action: 'highlightAndScroll', 
                        targetId: targetId,
                        featureId: activeModalRule.id, 
                        color: elementData ? elementData.color : null 
                    };
                    if (elementData && elementData.frameId !== undefined) {
                        safeSendMessage(message, { frameId: elementData.frameId });
                    } else {
                        safeSendMessage(message);
                    }
                });
            }
        });
    }

    const openDocsBtn = document.getElementById("btn-open-docs");
    if (openDocsBtn) {
        openDocsBtn.addEventListener("click", () => {
            const previousActiveElement = document.activeElement;
            const existing = document.getElementById('a11y-docs-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'a11y-docs-modal';
            modal.className = 'a11y-modal-overlay';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'docs-modal-title');

            modal.innerHTML = `
                <div class="a11y-modal-content" style="max-width: 800px; height: 90vh;">
                    <div class="a11y-modal-header">
                        <div class="a11y-modal-title-area">
                            <h2 id="docs-modal-title" style="margin: 0; font-size: 16px; font-weight: 700;">Documentation & Reference</h2>
                        </div>
                        <div class="a11y-modal-actions">
                            <button id="docs-close-btn" class="a11y-btn-icon" aria-label="Close Documentation">✖</button>
                        </div>
                    </div>
                    <div class="a11y-modal-list" id="docs-content-area" tabindex="0">
                        ${window.A11Y_DOCS_HTML || '<div style="color: #d93025; padding: 20px;">Error loading documentation.</div>'}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const closeModal = () => {
                modal.remove();
                document.removeEventListener('keydown', trapDocsFocus);
                if (previousActiveElement) previousActiveElement.focus();
            };

            document.getElementById('docs-close-btn').addEventListener('click', closeModal);

            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1] || firstElement;

            const trapDocsFocus = (e) => {
                if (e.key === 'Escape') closeModal();
                else if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            };

            document.addEventListener('keydown', trapDocsFocus);
            document.getElementById('docs-close-btn').focus();
        });
    }

    // =========================================================================
    // PDF ACCESSIBILITY AUDIT ENGINE
    // =========================================================================

    function closeActiveModal() {
        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) {
            closeBtn.click();
        } else {
            const modal = document.getElementById('a11y-details-modal');
            if (modal) modal.remove();
        }
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function openPdfDetailsModal(check) {
        const existing = document.getElementById('a11y-details-modal');
        if (existing) existing.remove();

        const previousActiveElement = document.activeElement;

        const modal = document.createElement('div');
        modal.id = 'a11y-details-modal';
        modal.className = 'a11y-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', `Details for ${check.title}`);

        const badgeColor = check.pass ? "#1e8e3e" : "#d93025";
        const badgeText = check.pass ? "PASS" : "FAIL";

        modal.innerHTML = `
            <div class="a11y-modal-content" style="max-width: 560px;">
                <div class="a11y-modal-header">
                    <div class="a11y-modal-title-area">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap: wrap;">
                            <h2>${check.title}</h2>
                            <span class="count-badge visible" style="background-color: ${badgeColor}; color: #ffffff; text-transform: uppercase;">
                                ${badgeText}
                            </span>
                            <span class="sim-accuracy-tag ${check.accuracyClass}">${check.accuracyLabel}</span>
                        </div>
                        <p class="a11y-modal-desc" style="margin-top:6px;">${check.wcag}</p>
                    </div>
                    <div class="a11y-modal-actions">
                        <button id="modal-copy-btn" class="a11y-btn-secondary">📋 Copy Details</button>
                        <button id="modal-close-btn" class="a11y-btn-icon" aria-label="Close dialog">✖</button>
                    </div>
                </div>
                <div class="a11y-modal-list" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                    <div style="background: var(--hover-bg); border: 1px solid var(--border-light); border-radius: 6px; padding: 12px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px;">Evaluation Finding</div>
                        <div style="font-size: 13px; font-weight: 600; color: ${badgeColor};">${check.pass ? '✔ ' + check.passMsg : '✖ ' + check.failMsg}</div>
                    </div>

                    <div style="background: var(--hover-bg); border: 1px solid var(--border-light); border-radius: 6px; padding: 12px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px;">Technical Stream Inspection</div>
                        <div style="font-size: 12px; font-family: monospace; color: var(--primary-color); word-break: break-all; background: rgba(0,0,0,0.04); padding: 8px; border-radius: 4px; border: 1px solid var(--border-light);">
                            ${escapeHtml(check.technicalDetail)}
                        </div>
                    </div>

                    <div style="background: var(--hover-bg); border: 1px solid var(--border-light); border-radius: 6px; padding: 12px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px;">Scope & Standards Guidance</div>
                        <div style="font-size: 12px; color: var(--text-color); line-height: 1.5;">${check.info}</div>
                    </div>

                    <div style="background: var(--hover-bg); border: 1px solid var(--border-light); border-radius: 6px; padding: 12px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px;">How to Remediate</div>
                        <div style="font-size: 12px; color: var(--text-color); line-height: 1.5;">${check.remediation}</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            modal.remove();
            document.removeEventListener('keydown', trapFocus);
            if (previousActiveElement) previousActiveElement.focus();
        };

        document.getElementById('modal-close-btn').addEventListener('click', closeModal);

        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1] || firstElement;

        const trapFocus = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) { e.preventDefault(); lastElement.focus(); }
                } else {
                    if (document.activeElement === lastElement) { e.preventDefault(); firstElement.focus(); }
                }
            }
        };

        document.addEventListener('keydown', trapFocus);
        document.getElementById('modal-close-btn').focus();

        document.getElementById('modal-copy-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            chrome.tabs.get(tabId, (currentTab) => {
                const topUrl = currentTab && currentTab.url ? currentTab.url : 'Unknown';
                const topTitle = currentTab && currentTab.title ? currentTab.title : 'Unknown';
                const now = new Date();
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const dateStr = now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

                let copyText = `************************************************************\n`;
                copyText += `WICK-AG-LENS REPORT: PDF GATEKEEPER AUDIT\n`;
                copyText += `************************************************************\n`;
                copyText += `• Generated:  ${dateStr} (${timeZone})\n`;
                copyText += `• Document:   ${topTitle}\n`;
                copyText += `• Source URL: ${topUrl}\n`;
                copyText += `============================================================\n\n`;

                copyText += `------------------------------------------------------------\n`;
                copyText += `AUDIT: ${check.title.toUpperCase()} [${badgeText}]\n`;
                copyText += `Standard: ${check.wcag}\n`;
                copyText += `Status: ${check.pass ? check.passMsg : check.failMsg}\n`;
                copyText += `Technical Detail: ${check.technicalDetail}\n`;
                copyText += `Remediation: ${check.remediation}\n`;
                copyText += `------------------------------------------------------------\n`;

                navigator.clipboard.writeText(copyText.trim()).then(() => {
                    const origText = btn.textContent;
                    btn.textContent = '✔ Copied!';
                    setTimeout(() => btn.textContent = origText, 2000);
                });
            });
        });
    }

    function showPdfStatus(message, type = "info") {
        const statusEl = document.getElementById("pdf-status-msg");
        if (!statusEl) return;

        let bgColor = "rgba(26, 115, 232, 0.08)";
        let borderColor = "rgba(26, 115, 232, 0.35)";
        let accentBorder = "#1a73e8";
        let textColor = "#174ea6";
        let icon = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

        if (type === "warning") {
            bgColor = "rgba(242, 153, 0, 0.08)";
            borderColor = "rgba(242, 153, 0, 0.4)";
            accentBorder = "#f29900";
            textColor = "#b06000";
            icon = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        } else if (type === "error") {
            bgColor = "rgba(217, 48, 37, 0.08)";
            borderColor = "rgba(217, 48, 37, 0.4)";
            accentBorder = "#d93025";
            textColor = "#c5221f";
            icon = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        }

        statusEl.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 8px;">
                ${icon}
                <div style="flex: 1; word-break: break-word;">${message}</div>
            </div>
        `;
        statusEl.style.display = "block";
        statusEl.style.backgroundColor = bgColor;
        statusEl.style.color = textColor;
        statusEl.style.border = `1px solid ${borderColor}`;
        statusEl.style.borderLeft = `4px solid ${accentBorder}`;
        statusEl.style.padding = "10px 12px";
        statusEl.style.borderRadius = "6px";
        statusEl.style.fontSize = "13px";
        statusEl.style.lineHeight = "1.45";
    }

    function hidePdfStatus() {
        const statusEl = document.getElementById("pdf-status-msg");
        if (statusEl) statusEl.style.display = "none";
    }

    function resetPdfResultsUI(placeholderMessage) {
        closeActiveModal(); 
        hidePdfStatus();
        
        currentPdfChecks = [];
        currentPdfFailCount = 0;

        const listEl = document.getElementById("pdf-results-list");
        const footerEl = document.getElementById("pdf-summary-footer");
        const badgeEl = document.getElementById("pdf-status-badge");
        const pagesEl = document.getElementById("pdf-doc-pages");
        const copyPdfBtn = document.getElementById("copy-report-pdf");

        if (copyPdfBtn) copyPdfBtn.classList.remove("visible");

        if (pagesEl) {
            pagesEl.textContent = "";
            pagesEl.style.display = "none";
        }

        if (listEl) {
            listEl.innerHTML = `
                <div style="font-size: 13px; color: var(--text-secondary, #5f6368); text-align: center; padding: 28px 16px; line-height: 1.5; border: 1px solid var(--border-light); border-radius: 6px;">
                    ${placeholderMessage || "Navigate to a direct PDF URL in the tab to run the gatekeeper audit."}
                </div>
            `;
        }
        if (footerEl) {
            footerEl.style.display = "none";
            footerEl.textContent = "";
        }
        if (badgeEl) {
            badgeEl.textContent = "";
            badgeEl.classList.remove("visible");
        }
    }

    function renderPdfAuditUI(results, docName) {
        closeActiveModal(); 
        hidePdfStatus();
        
        const listEl = document.getElementById("pdf-results-list");
        const footerEl = document.getElementById("pdf-summary-footer");
        const badgeEl = document.getElementById("pdf-status-badge");
        const pagesEl = document.getElementById("pdf-doc-pages");
        const copyPdfBtn = document.getElementById("copy-report-pdf");

        if (!listEl) return;
        
        if (pagesEl) {
            if (results.pageCount && results.pageCount > 0) {
                pagesEl.textContent = `${results.pageCount} ${results.pageCount === 1 ? 'Page' : 'Pages'}`;
                pagesEl.style.display = "inline";
            } else {
                pagesEl.textContent = "";
                pagesEl.style.display = "none";
            }
        }

        const checks = [
            {
                title: "Tagged PDF (Structure Tree)",
                wcag: "WCAG 1.3.1 (A) & ISO 14289-1 (PDF/UA)",
                accuracyClass: "accuracy-high",
                accuracyLabel: "High Confidence",
                accuracyTitle: "Strict binary check of Catalog MarkInfo dictionary",
                pass: results.isTagged,
                passMsg: "Marked = true. Structural tags are present.",
                failMsg: "Untagged Document. Screen readers cannot interpret reading order or structure.",
                technicalDetail: `Catalog /MarkInfo << /Marked ${results.isTagged ? 'true' : 'false'} >>`,
                info: "Evaluates the Catalog's '/MarkInfo' dictionary. While this confirms the document contains a structural tag tree required by screen readers, it does not evaluate whether all tags (headings, tables, lists) are semantically accurate.",
                remediation: "In Word, export with 'Document structure tags for accessibility' checked. In InDesign, enable 'Create Tagged PDF' in the export dialog. In Acrobat Pro, run the Accessibility Checker and select 'Autotag Document'."
            },
            {
                title: "Document Title",
                wcag: "WCAG 2.4.2 (A)",
                accuracyClass: "accuracy-approx",
                accuracyLabel: "Moderate Confidence",
                accuracyTitle: "Metadata dictionary scanner (heuristic)",
                pass: results.hasTitle,
                passMsg: `Title specified: "${results.titleValue}"` + (results.displayDocTitle ? " (DisplayDocTitle enabled)" : ""),
                failMsg: "Missing Document Title in metadata dictionary.",
                technicalDetail: `Info Dictionary: /Title ${results.hasTitle ? `"${results.titleValue}"` : '[Missing]'} | ViewerPreferences: /DisplayDocTitle ${results.displayDocTitle ? 'true' : 'false'}`,
                info: "Searches the Info dictionary for literal or hex-encoded /Title metadata. This check cannot detect placeholder titles (e.g. 'Untitled') or titles stored exclusively in compressed object streams (/ObjStm) without full decompression.",
                remediation: "Set the Document Title in your authoring software (File > Info > Title in Word) or in Adobe Acrobat (File > Properties > Description). In Initial View, set 'Show: Document Title' instead of 'File Name'."
            },
            {
                title: "Primary Language",
                wcag: "WCAG 3.1.1 (A)",
                accuracyClass: "accuracy-high",
                accuracyLabel: "High Confidence",
                accuracyTitle: "Strict Catalog property validation",
                pass: results.hasLang,
                passMsg: `Language set: "${results.langValue}"`,
                failMsg: "Root document language is not defined (/Lang missing).",
                technicalDetail: `Catalog /Lang ${results.hasLang ? `"${results.langValue}"` : '[Missing]'}`,
                info: "Scans the Document Catalog for the root '/Lang' ISO language code identifier. A missing entry is a definitive structural failure under WCAG 3.1.1, preventing speech synthesizers from choosing the correct phonetic dictionary.",
                remediation: "In Adobe Acrobat Pro, open File > Properties > Advanced > Reading Options and select the primary document Language (e.g., 'English'). In Word or InDesign, ensure the document proofing language is set before PDF export."
            },
            {
                title: "Accessibility Extraction Permission",
                wcag: "Robust Principle (User Security Bit 10)",
                accuracyClass: "accuracy-high",
                accuracyLabel: "High Confidence",
                accuracyTitle: "Strict bitmask calculation",
                pass: results.accessibilityAllowed,
                passMsg: results.isEncrypted ? "Allowed (Encryption permits assistive device extraction)." : "Allowed (Document is unencrypted).",
                failMsg: "Locked out. Security encryption has Bit 10 cleared, preventing assistive text extraction.",
                technicalDetail: `Encryption: ${results.isEncrypted ? 'Active (/Encrypt)' : 'None (Unencrypted Document)'} | Bit 10 (0x200): ${results.accessibilityAllowed ? '1 (Extraction Permitted)' : '0 (Locked Out)'}`,
                info: "Parses standard user access permissions (/P) and evaluates Bit 10 (value 512, 0x200). If this bit is 0, screen readers and assistive devices are mathematically prohibited from extracting text contents.",
                remediation: "If applying password security in Acrobat Pro, ensure 'Enable text access for screen reader devices for the visually impaired' (Bit 10) remains checked."
            }
        ];

        let failCount = 0;

        const rowsHtml = checks.map((c, idx) => {
            if (!c.pass) failCount++;
            const badgeColor = c.pass ? "#1e8e3e" : "#d93025";
            const badgeText = c.pass ? "PASS" : "FAIL";
            const icon = c.pass ? "✔" : "✖";

            return `
                <div class="feature-row" style="padding-left: 10px;">
                    <div class="feature-main">
                        <div class="feature-content" style="flex: 1; padding-right: 12px;">
                            <div class="feature-title" style="display:flex; align-items:center; gap:8px; flex-wrap: wrap;">
                                ${c.title}
                                <span class="sim-accuracy-tag ${c.accuracyClass}" title="${c.accuracyTitle}">${c.accuracyLabel}</span>
                                <span class="count-badge visible" style="background-color: ${badgeColor}; color: #ffffff; text-transform: uppercase;">
                                    ${badgeText}
                                </span>
                            </div>
                            <p style="color: ${badgeColor}; font-weight: 500; font-size: 12px; margin: 6px 0 0 0;">
                                ${icon} ${c.pass ? c.passMsg : c.failMsg}
                            </p>
                            <div class="info-panel pdf-info-panel" id="pdf-info-panel-${idx}" style="display: none; margin-top: 10px;">
                                <div class="info-section"><strong>Standard:</strong> ${c.wcag}</div>
                                <div class="info-section"><strong>Logic & Bounds:</strong> ${c.info}</div>
                                <div class="info-section"><strong>How to fix:</strong> ${c.remediation}</div>
                            </div>
                        </div>
                        <div class="actions-area" style="display:flex; flex-direction:column; gap:6px;">
                            <button type="button" class="icon-btn pdf-detail-btn" id="pdf-view-${idx}" data-check-index="${idx}" title="View Technical Details & Remediation" aria-label="View Details">
                                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                            </button>
                            <button type="button" class="icon-btn info-btn-pdf" id="pdf-info-btn-${idx}" title="Why is this important?" aria-label="More Info">
                                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        listEl.innerHTML = `
            <div class="category-group" id="pdf-group-global">
                <div class="category-header">
                    <button class="category-expand-btn" aria-expanded="true" aria-controls="pdf-group-global">
                        <span class="category-header-title">Document-Level Gatekeepers</span>
                        <span class="category-count-info visible">4 Checks</span>
                        <span class="category-chevron">▼</span>
                    </button>
                </div>
                ${rowsHtml}
            </div>
        `;

        const expandBtn = listEl.querySelector('.category-expand-btn');
        const groupEl = listEl.querySelector('#pdf-group-global');
        if (expandBtn && groupEl) {
            expandBtn.addEventListener("click", () => {
                const isCollapsed = groupEl.classList.toggle('collapsed');
                expandBtn.setAttribute("aria-expanded", !isCollapsed);
            });
        }

        listEl.querySelectorAll('.info-btn-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const infoPanel = e.currentTarget.closest('.feature-main').querySelector('.pdf-info-panel');
                if (infoPanel) {
                    infoPanel.style.display = (infoPanel.style.display === "none") ? "block" : "none";
                }
            });
        });

        listEl.querySelectorAll('.pdf-detail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-check-index'), 10);
                if (!isNaN(idx) && checks[idx]) {
                    openPdfDetailsModal(checks[idx]);
                }
            });
        });

        if (badgeEl) {
            badgeEl.textContent = `${4 - failCount} of 4 Passed`;
            badgeEl.classList.add("visible");
        }

        if (footerEl) {
            footerEl.style.display = "block";
            if (failCount === 0) {
                footerEl.style.backgroundColor = "rgba(30, 142, 62, 0.1)";
                footerEl.style.color = "#1e8e3e";
                footerEl.style.border = "1px solid rgba(30, 142, 62, 0.3)";
                footerEl.textContent = "✔ Document passes all critical programmatic gatekeepers.";
            } else {
                footerEl.style.backgroundColor = "rgba(217, 48, 37, 0.1)";
                footerEl.style.color = "#d93025";
                footerEl.style.border = "1px solid rgba(217, 48, 37, 0.3)";
                footerEl.textContent = `✖ Found ${failCount} critical gatekeeper barrier${failCount > 1 ? 's' : ''}. Document is not accessible.`;
            }
        }

        currentPdfChecks = checks;
        currentPdfFailCount = failCount;
        if (copyPdfBtn) copyPdfBtn.classList.add("visible");
    }

    const copyPdfBtn = document.getElementById("copy-report-pdf");
    if (copyPdfBtn) {
        copyPdfBtn.addEventListener("click", (e) => {
            const btnEl = e.currentTarget;
            if (!currentPdfChecks || currentPdfChecks.length === 0) return;

            chrome.tabs.get(tabId, (currentTab) => {
                const topUrl = currentTab && currentTab.url ? currentTab.url : 'Unknown';
                const topTitle = currentTab && currentTab.title ? currentTab.title : 'Unknown';
                const now = new Date();
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const dateStr = now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

                const passedCount = currentPdfChecks.length - currentPdfFailCount;

                let report = `************************************************************\n`;
                report += `WICK-AG-LENS REPORT: PDF GATEKEEPER AUDIT\n`;
                report += `************************************************************\n`;
                report += `• Generated:  ${dateStr} (${timeZone})\n`;
                report += `• Document:   ${topTitle}\n`;
                report += `• Source URL: ${topUrl}\n`;
                report += `• Summary:    ${passedCount} Passed | ${currentPdfFailCount} Failed\n`;
                report += `============================================================\n\n\n`;

                currentPdfChecks.forEach(check => {
                    const badgeText = check.pass ? "PASS" : "FAIL";
                    report += `------------------------------------------------------------\n`;
                    report += `AUDIT: ${check.title.toUpperCase()} [${badgeText}]\n`;
                    report += `Standard: ${check.wcag}\n`;
                    report += `Status: ${check.pass ? check.passMsg : check.failMsg}\n`;
                    report += `Technical Detail: ${check.technicalDetail}\n`;
                    report += `Remediation: ${check.remediation}\n`;
                    report += `------------------------------------------------------------\n\n`;
                });

                navigator.clipboard.writeText(report.trim()).then(() => {
                    const originalText = btnEl.textContent;
                    btnEl.textContent = '✔';
                    btnEl.title = 'Report Copied!';
                    setTimeout(() => {
                        btnEl.textContent = originalText;
                        btnEl.title = 'Copy Tab Report to Clipboard';
                    }, 2000);
                });
            });
        });
    }

    async function auditPdfUrl(url) {
        try {
            closeActiveModal();
            showPdfStatus("Fetching and analyzing PDF binary stream...", "info");
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to download PDF.`);
            const buffer = await response.arrayBuffer();
            if (window.A11yPdfScanner) {
                const auditResults = window.A11yPdfScanner.scan(buffer);
                lastAuditedPdfUrl = url;
                const fileName = url.split('/').pop().split('?')[0] || "Document.pdf";
                renderPdfAuditUI(auditResults, fileName);
            }
        } catch (err) {
            lastAuditedPdfUrl = null;
            resetPdfResultsUI("Analysis failed to fetch document.");
            showPdfStatus("Error scanning PDF: " + err.message, "error");
        }
    }

    function inspectPdfTabIfActive(forceScan = false, knownUrl = null) {
        if (!chrome.tabs || !chrome.devtools || !chrome.devtools.inspectedWindow) return;

        const processUrl = (url) => {
            if (!url) {
                if (forceScan) showPdfStatus("Unable to inspect active tab URL.", "error");
                return;
            }

            const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
            const isPdf = cleanUrl.endsWith('.pdf');
            const urlEl = document.getElementById("pdf-doc-url");
            const isSameAuditedDoc = (lastAuditedPdfUrl !== null && lastAuditedPdfUrl === url);

            if (isPdf) {
                if (urlEl) urlEl.textContent = url;

                if (!modeBtnPdf.classList.contains("active")) {
                    setAppMode("pdf", false);
                }

                if (forceScan || pdfAutoScanEnabled) {
                    auditPdfUrl(url);
                } else {
                    if (!isSameAuditedDoc) {
                        lastAuditedPdfUrl = null;
                        resetPdfResultsUI("PDF analysis is paused. Toggle 'Scan Active PDF' ON to analyze this document.");
                        showPdfStatus("PDF detected. Toggle 'Scan Active PDF' ON to enable automatic auditing.", "info");
                    }
                }
            } else {
                lastAuditedPdfUrl = null;
                if (urlEl) {
                    urlEl.textContent = `Current tab is not a PDF (${url})`;
                }
                resetPdfResultsUI("The active tab is a standard HTML webpage. PDF audits only evaluate direct PDF document files.");
                showPdfStatus("Notice: Current tab is an HTML webpage. PDF Mode gatekeeper audits do not apply.", "warning");
            }
        };

        if (knownUrl) {
            processUrl(knownUrl);
        } else {
            chrome.tabs.get(tabId, (tab) => {
                if (!chrome.runtime.lastError && tab) {
                    processUrl(tab.url);
                } else {
                    processUrl(null);
                }
            });
        }
    }

    const pdfToggle = document.getElementById("pdf-auto-scan-toggle");
    if (pdfToggle) {
        pdfToggle.addEventListener("change", (e) => {
            pdfAutoScanEnabled = e.target.checked;
            chrome.storage.local.set({ [STORAGE_KEY_PDF_AUTOSCAN]: pdfAutoScanEnabled });
            if (pdfAutoScanEnabled) {
                inspectPdfTabIfActive(true);
            } else {
                lastAuditedPdfUrl = null;
                resetPdfResultsUI("PDF analysis is paused. Toggle 'Scan Active PDF' ON to analyze this document.");
                showPdfStatus("PDF analysis is paused. Previous results cleared.", "info");
            }
        });
    }

    // Dynamic Navigation Listeners
    if (chrome.devtools && chrome.devtools.network) {
        chrome.devtools.network.onNavigated.addListener((url) => {
            for (let featureId in frameCounts) {
                delete frameCounts[featureId];
                updateFeatureBadges(featureId);
            }
            inspectPdfTabIfActive(false, url);
        });
    }

    // Safely sync HTML audits when the new page is completely done loading
    if (chrome.tabs && chrome.tabs.onUpdated) {
        chrome.tabs.onUpdated.addListener((updatedTabId, changeInfo, tab) => {
            if (updatedTabId === tabId) {
                if (changeInfo.url) {
                    inspectPdfTabIfActive(false, changeInfo.url);
                }
                if (changeInfo.status === "complete" && tab.url) {
                    inspectPdfTabIfActive(false, tab.url);
                    
                    // Re-sync standard HTML highlights aggressively on full load
                    setTimeout(() => {
                        if (modeBtnInspect && modeBtnInspect.classList.contains("active")) {
                            restoreActiveAuditHighlights();
                        }
                        if (modeBtnSimulate && modeBtnSimulate.classList.contains("active")) {
                            sendSimulateStateToContent();
                        }
                    }, 250);
                }
            }
        });
    }

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            if (modeBtnPdf && modeBtnPdf.classList.contains("active")) {
                inspectPdfTabIfActive(false);
            }
        }
    });

    // 8. FINAL INITIALIZATION via Scoped Storage
    chrome.storage.local.get([STORAGE_KEY_MODE, STORAGE_KEY_FEATURES, STORAGE_KEY_GROUPS, STORAGE_KEY_SIM, STORAGE_KEY_OPTIONS, STORAGE_KEY_PDF_AUTOSCAN], (result) => {
        
        if (!config || !config.tabs) return;

        // 8.1 Build UI First
        config.tabs.forEach(tab => {
            const container = document.getElementById(tab.id === "tab-violations" ? "violations-container" : "informative-container");
            if (!container) return;

            tab.categories.forEach(cat => {
                const groupDiv = document.createElement("div");
                groupDiv.className = "category-group";
                groupDiv.id = `group-${cat.id}`;

                const headerDiv = document.createElement("div");
                headerDiv.className = "category-header";

                headerDiv.innerHTML = `
                    <label class="toggle-switch category-toggle-wrapper">
                        <input type="checkbox" class="category-toggle" data-cat="${cat.id}" data-tab="${tab.id}" aria-label="Toggle all ${cat.label}">
                        <span class="slider"></span>
                    </label>
                    <button class="category-expand-btn" aria-expanded="true" aria-controls="group-${cat.id}">
                        <span class="category-header-title">${cat.label}</span>
                        <span class="category-count-info" id="cat-count-${cat.id}"></span>
                        <span class="category-chevron">▼</span>
                    </button>
                `;
                groupDiv.appendChild(headerDiv);

                const expandBtn = headerDiv.querySelector('.category-expand-btn');
                expandBtn.addEventListener("click", () => {
                    const isCollapsed = groupDiv.classList.toggle('collapsed');
                    expandBtn.setAttribute("aria-expanded", !isCollapsed);
                    saveCollapsedState();

                    if (tab.id === 'tab-violations') evalViolationsCollapseState();
                    else evalInformativeCollapseState();
                });

                cat.features.forEach(feature => {
                    const rowDiv = document.createElement("div");
                    rowDiv.className = "feature-row";
                    rowDiv.id = `row-${feature.id}`;

                    const severityHtml = feature.severity ? `<span class="severity-badge severity-${feature.severity.toLowerCase()}">${feature.severity}</span>` : '';
                    const wcagLabelHtml = formatWcagLabel(feature.wcag);

                    let legendHtml = '';
                    if (feature.legends) {
                        feature.legends.forEach(leg => {
                            const legWcagHtml = (leg.wcag && leg.wcag !== feature.wcag) ? formatWcagLabel(leg.wcag) : '';
                            legendHtml += `
                                <div class="legend-item" data-legend-type="${leg.type}">
                                    <div class="legend-color" style="background-color:${leg.color}; ${leg.type === 'dashed' ? 'border:2px dashed #000;background:transparent' : ''}"></div>
                                    <span>${leg.label} ${legWcagHtml} <span class="count-badge" id="count-${feature.id}-${leg.type}">0</span></span>
                                </div>
                            `;
                        });
                    }
                    
                    let optionsHtml = '';
                    if (feature.options) {
                        optionsHtml = `<div class="feature-options-area" style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border-light); display: none; flex-direction: column; gap: 6px;">`;
                        feature.options.forEach(opt => {
                            optionsHtml += `
                                <label class="filter-checkbox" style="font-size: 12px; cursor: pointer; display: inline-flex;">
                                    <input type="checkbox" class="feature-opt-toggle" data-feature="${feature.id}" data-opt="${opt.id}" ${opt.default ? 'checked' : ''}>
                                    ${opt.label}
                                </label>
                            `;
                        });
                        optionsHtml += `</div>`;
                    }

                    rowDiv.innerHTML = `
                        <div class="feature-main">
                            <label class="toggle-switch">
                                <input type="checkbox" class="feature-toggle" data-feature="${feature.id}" data-tab="${tab.id}" aria-label="Toggle ${feature.label}">
                                <span class="slider"></span>
                            </label>
                            <div class="feature-content">
                                <div class="feature-title">
                                    ${feature.label}
                                    ${severityHtml}
                                    ${wcagLabelHtml}
                                    <span class="count-badge" id="total-${feature.id}">0 elements</span>
                                </div>
                                <div class="feature-desc">${feature.desc}</div>
                                <div class="legend-area">${legendHtml}</div>
                                ${optionsHtml}
                                
                                <div class="info-panel" id="info-${feature.id}">
                                    <div class="info-section">
                                        <strong>What it highlights:</strong>
                                        ${feature.info ? feature.info.what : 'No data'}
                                    </div>
                                    <div class="info-section">
                                        <strong>Why it's important:</strong>
                                        ${feature.info ? feature.info.why : 'No data'}
                                    </div>
                                    ${feature.info && feature.info.fix ? `
                                    <div class="info-section">
                                        <strong>How to fix:</strong>
                                        ${feature.info.fix}
                                    </div>` : ''}
                                </div>
                            </div>
                            <div class="actions-area">
                                <button class="icon-btn view-btn" id="view-${feature.id}" title="View Elements List">
                                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6"></line>
                                        <line x1="8" y1="12" x2="21" y2="12"></line>
                                        <line x1="8" y1="18" x2="21" y2="18"></line>
                                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                    </svg>
                                </button>
                                <button class="icon-btn info-btn" id="infobtn-${feature.id}" title="Why is this important?">
                                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `;
                    groupDiv.appendChild(rowDiv);

                    const viewBtn = rowDiv.querySelector(`#view-${feature.id}`);
                    viewBtn.addEventListener("click", async () => {
                        const ruleMapping = { id: feature.id, name: feature.label, description: feature.desc, severity: feature.severity };
                        const filteredElements = await fetchModalElements(ruleMapping);
                        openDetailsModal(ruleMapping, filteredElements);
                    });
                });
                container.appendChild(groupDiv);
            });
        });

        // 8.2 Bind Global UI Listeners now that DOM elements exist
        document.querySelectorAll(".info-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const btnEl = e.currentTarget;
                const id = btnEl.id.replace("infobtn-", "");
                document.getElementById(`info-${id}`).classList.toggle("visible");
            });
        });

        document.querySelectorAll(".feature-toggle").forEach(toggle => {
            toggle.addEventListener("change", (e) => {
                const featureId = e.target.getAttribute("data-feature");
                const tabName = e.target.getAttribute("data-tab");
                const action = e.target.checked ? "highlight" : "clear";
                
                const optionsArea = e.target.closest('.feature-main').querySelector('.feature-options-area');
                if (optionsArea) {
                    optionsArea.style.display = e.target.checked ? 'flex' : 'none';
                }

                const feature = getFeatureConfigById(featureId);
                const activeLegends = getActiveLegends(feature);

                if (modeBtnInspect && modeBtnInspect.classList.contains("active")) {
                    safeSendMessage({ action, featureId, activeLegends, options: getActiveOptions(featureId) });
                }

                if (!e.target.checked) resetBadges(featureId);
                updateTabHierarchyStates(tabName);
                saveActiveFeaturesState();
            });
        });
        
        document.querySelectorAll(".feature-opt-toggle").forEach(optToggle => {
            optToggle.addEventListener("change", (e) => {
                saveOptionsState();
                const featureId = e.target.getAttribute("data-feature");
                const featureToggle = document.querySelector(`.feature-toggle[data-feature="${featureId}"]`);
                if (featureToggle && featureToggle.checked && modeBtnInspect && modeBtnInspect.classList.contains("active")) {
                    const feature = getFeatureConfigById(featureId);
                    const activeLegends = getActiveLegends(feature);
                    safeSendMessage({ action: 'highlight', featureId, activeLegends, options: getActiveOptions(featureId) });
                }
            });
        });

        document.querySelectorAll(".category-toggle").forEach(catToggle => {
            catToggle.addEventListener("change", (e) => {
                const isChecked = e.target.checked;
                const categoryGroup = e.target.closest(".category-group");
                const tabName = e.target.getAttribute("data-tab");

                if (categoryGroup) {
                    const childToggles = Array.from(categoryGroup.querySelectorAll(".feature-toggle"))
                        .filter(ft => ft.closest('.feature-row').style.display !== 'none');

                    childToggles.forEach(ft => {
                        if (ft.checked !== isChecked) {
                            ft.checked = isChecked;
                            ft.dispatchEvent(new Event('change'));
                        }
                    });
                }
                updateTabHierarchyStates(tabName);
            });
        });

        const handleMasterToggle = (masterId, containerId) => {
            const master = document.getElementById(masterId);
            if (!master) return;
            master.addEventListener("change", (e) => {
                const isChecked = e.target.checked;
                const toggles = Array.from(document.querySelectorAll(`#${containerId} .feature-toggle`))
                    .filter(ft => ft.closest('.feature-row').style.display !== 'none');

                if (toggles.length === 0 && isChecked) {
                    e.target.checked = false;
                    showPanelToast("No audits available. Please select at least one applicable WCAG Version and Conformance Level.");
                    return;
                }

                toggles.forEach(t => {
                    if (t.checked !== isChecked) {
                        t.checked = isChecked;
                        t.dispatchEvent(new Event('change'));
                    }
                });
                updateTabHierarchyStates(containerId);
            });
        };
        handleMasterToggle("master-toggle-violations", "tab-violations");
        handleMasterToggle("master-toggle-informative", "tab-informative");

        // 8.3 Restore Stored States (Suppressing highlight signals to prevent race conditions on boot)
        applyWcagFilters(true);

        const savedMode = result[STORAGE_KEY_MODE] || "inspect";
        const savedOpts = result[STORAGE_KEY_OPTIONS] || {};
        
        if (typeof result[STORAGE_KEY_PDF_AUTOSCAN] !== "undefined") {
            pdfAutoScanEnabled = Boolean(result[STORAGE_KEY_PDF_AUTOSCAN]);
        } else {
            pdfAutoScanEnabled = false;
        }
        const pdfToggleEl = document.getElementById("pdf-auto-scan-toggle");
        if (pdfToggleEl) pdfToggleEl.checked = pdfAutoScanEnabled;

        document.querySelectorAll('.feature-opt-toggle').forEach(t => {
            const key = `${t.dataset.feature}_${t.dataset.opt}`;
            if (savedOpts.hasOwnProperty(key)) {
                t.checked = savedOpts[key];
            }
        });

        const active = result[STORAGE_KEY_FEATURES] || [];
        document.querySelectorAll('.feature-toggle').forEach(toggle => {
            if (toggle.closest('.feature-row').style.display !== 'none') {
                const fid = toggle.getAttribute('data-feature');
                const shouldBeChecked = active.includes(fid);
                if (toggle.checked !== shouldBeChecked) {
                    toggle.checked = shouldBeChecked;
                }
                
                const optionsArea = toggle.closest('.feature-main').querySelector('.feature-options-area');
                if (optionsArea) {
                    optionsArea.style.display = shouldBeChecked ? 'flex' : 'none';
                }
            }
        });
        updateAllHierarchyStates();

        const savedSim = result[STORAGE_KEY_SIM];
        if (savedSim) {
            Object.assign(simState, savedSim);
            if (simState.colorBlindness && simState.colorBlindness !== "none") {
                const cbRadio = document.querySelector(`input[name="sim-cb-option"][value="${simState.colorBlindness}"]`);
                if (cbRadio) cbRadio.checked = true;
            }
            if (simState.impairedVision) {
                const iv = simState.impairedVision;
                if (document.getElementById("sim-cataracts-range")) {
                    document.getElementById("sim-cataracts-range").value = iv.cataracts ?? 0;
                    document.getElementById("sim-cataracts-val").textContent = `${iv.cataracts ?? 0}%`;

                    document.getElementById("sim-diplopia-range").value = iv.diplopia ?? 0;
                    document.getElementById("sim-diplopia-val").textContent = `${iv.diplopia ?? 0}%`;

                    document.getElementById("sim-contrast-range").value = iv.contrast ?? 0;
                    document.getElementById("sim-contrast-val").textContent = `${iv.contrast ?? 0}%`;

                    document.getElementById("sim-yellowing-range").value = iv.yellowing ?? 0;
                    document.getElementById("sim-yellowing-val").textContent = `${iv.yellowing ?? 0}%`;

                    if (iv.fieldLossType) {
                        const flRadio = document.querySelector(`input[name="sim-field-loss-type"][value="${iv.fieldLossType}"]`);
                        if (flRadio) flRadio.checked = true;
                        if (iv.fieldLossType !== "none" && fieldLossGroup) {
                            fieldLossGroup.style.display = "block";
                        }
                    }
                    document.getElementById("sim-field-loss-range").value = iv.fieldLossVal ?? 5;
                    document.getElementById("sim-field-loss-val").textContent = `${iv.fieldLossVal ?? 5}%`;
                }
            }
        }

        connectToContentScript();

        // Ensure App Mode correctly evaluates layout height bounds
        setAppMode(savedMode, false);

        let collapsedGroups = result[STORAGE_KEY_GROUPS];
        if (typeof collapsedGroups === 'undefined') {
            collapsedGroups = Array.from(document.querySelectorAll('.category-group')).map(g => g.id);
        }

        collapsedGroups.forEach(groupId => {
            const groupEl = document.getElementById(groupId);
            if (groupEl) {
                groupEl.classList.add('collapsed');
                const expandBtn = groupEl.querySelector('.category-expand-btn');
                if (expandBtn) expandBtn.setAttribute("aria-expanded", "false");
            }
        });
        
        evalViolationsCollapseState();
        evalInformativeCollapseState();

        // 8.4 Trigger initial scan check if required
        inspectPdfTabIfActive(false);
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (sender.tab && sender.tab.id === tabId) {
            
            if (request.action === "contentScriptReady" || request.action === "softResync") {
                
                if (request.action === "contentScriptReady") {
                    connectToContentScript();
                    for (let fid in frameCounts) {
                        delete frameCounts[fid];
                        updateFeatureBadges(fid);
                    }
                    applyWcagFilters(true); // Suppress redundant highlight messages during init
                    updateAllHierarchyStates();

                    if (modeBtnSimulate && modeBtnSimulate.classList.contains("active")) {
                        sendSimulateStateToContent();
                    }
                }

                if (modeBtnInspect && modeBtnInspect.classList.contains("active")) {
                    restoreActiveAuditHighlights();
                }
                
                if (activeModalRule) {
                    setTimeout(() => { refreshDetailsModal(); }, 250);
                }

                // Dynamic PDF tab re-evaluation on page resync
                inspectPdfTabIfActive(false);
            }

            if (request.action === "updateCounts") {
                if (!frameCounts[request.featureId]) frameCounts[request.featureId] = {};
                frameCounts[request.featureId][sender.frameId ? sender.frameId : 0] = request.totals;
                updateFeatureBadges(request.featureId);
            }
        }
    });

});