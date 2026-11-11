Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_utils_html = require("../utils/html.js");
const require_helper_html_index = require("../helper/html/index.js");
const require_jsx_constants = require("./constants.js");
const require_jsx_utils = require("./utils.js");
const require_jsx_base = require("./base.js");
const require_jsx_jsx_dev_runtime = require("./jsx-dev-runtime.js");
//#region src/jsx/jsx-runtime.ts
const jsxTemplate = (strings, ...values) => {
	const result = require_helper_html_index.html(strings, ...values);
	return result instanceof Promise ? result.then(require_jsx_base.markRenderedJSX) : require_jsx_base.markRenderedJSX(result);
};
const jsxAttr = (key, v) => {
	if (!require_jsx_utils.isValidAttributeName(key)) return require_utils_html.raw("");
	if (typeof v === "string") {
		const buffer = [`${key}="`];
		require_utils_html.escapeToBuffer(v, buffer);
		return require_utils_html.raw(buffer[0] + "\"");
	}
	let value = v;
	if (typeof value === "function" && (key === "action" || key === "formaction")) value = require_jsx_constants.PERMALINK in value ? value[require_jsx_constants.PERMALINK] : void 0;
	const buffer = [""];
	require_jsx_base.attributeToBuffer(buffer, "", key, value);
	return buffer.length === 1 ? require_utils_html.raw(buffer[0]) : require_utils_html.stringBufferToString(buffer, void 0);
};
const jsxEscape = (value) => value;
//#endregion
exports.Fragment = require_jsx_base.Fragment;
exports.jsx = require_jsx_jsx_dev_runtime.jsxDEV;
exports.jsxAttr = jsxAttr;
exports.jsxEscape = jsxEscape;
exports.jsxTemplate = jsxTemplate;
exports.jsxs = require_jsx_jsx_dev_runtime.jsxDEV;
