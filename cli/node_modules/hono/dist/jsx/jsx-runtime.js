import { escapeToBuffer, raw, stringBufferToString } from "../utils/html.js";
import { html } from "../helper/html/index.js";
import { PERMALINK } from "./constants.js";
import { isValidAttributeName } from "./utils.js";
import { Fragment, attributeToBuffer, markRenderedJSX } from "./base.js";
import { jsxDEV } from "./jsx-dev-runtime.js";
//#region src/jsx/jsx-runtime.ts
const jsxTemplate = (strings, ...values) => {
	const result = html(strings, ...values);
	return result instanceof Promise ? result.then(markRenderedJSX) : markRenderedJSX(result);
};
const jsxAttr = (key, v) => {
	if (!isValidAttributeName(key)) return raw("");
	if (typeof v === "string") {
		const buffer = [`${key}="`];
		escapeToBuffer(v, buffer);
		return raw(buffer[0] + "\"");
	}
	let value = v;
	if (typeof value === "function" && (key === "action" || key === "formaction")) value = PERMALINK in value ? value[PERMALINK] : void 0;
	const buffer = [""];
	attributeToBuffer(buffer, "", key, value);
	return buffer.length === 1 ? raw(buffer[0]) : stringBufferToString(buffer, void 0);
};
const jsxEscape = (value) => value;
//#endregion
export { Fragment, jsxDEV as jsx, jsxAttr, jsxEscape, jsxTemplate, jsxDEV as jsxs };
