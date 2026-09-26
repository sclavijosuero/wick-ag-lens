// Creates the panel in the DevTools window
chrome.devtools.panels.create(
  "WICK-AG-Lens",
  "icons/icon48.png",
  "panel/panel.html", 
  function(panel) {
    console.log("WICK-AG-Lens v2.0.0 Panel Created");
  }
);