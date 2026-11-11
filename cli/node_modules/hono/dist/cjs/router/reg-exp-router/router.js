Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_utils_url = require("../../utils/url.js");
const require_router = require("../../router.js");
const require_router_utils = require("../utils.js");
const require_router_reg_exp_router_matcher = require("./matcher.js");
const require_router_reg_exp_router_node = require("./node.js");
const require_router_reg_exp_router_trie = require("./trie.js");
//#region src/router/reg-exp-router/router.ts
function endsWithWildcard(keys) {
	const tail = keys[keys.length - 1];
	return tail === "[^]*" || tail === "(?:|/[^]*)";
}
function covers(wildcard, target) {
	const last = wildcard.length - 1;
	for (let i = 0; i < last; i++) if (wildcard[i] !== target[i]) return false;
	return wildcard[last] === "[^]*" || target.length === last || target[last] === "/";
}
var RegExpRouter = class {
	name = "RegExpRouter";
	#handlers;
	#tries;
	constructor() {
		this.#handlers = { ["ALL"]: [] };
		this.#tries = { ["ALL"]: new require_router_reg_exp_router_trie.Trie() };
	}
	#insertPath(method, path) {
		try {
			this.#tries[method].insert(path, !/\*|\/:/.test(path));
		} catch (e) {
			throw e === require_router_reg_exp_router_node.PATH_ERROR ? new require_router.UnsupportedPathError(path) : e;
		}
	}
	add(method, path, handler) {
		const handlers = this.#handlers;
		if (!handlers) throw new Error(require_router.MESSAGE_MATCHER_IS_ALREADY_BUILT);
		const tries = this.#tries;
		if (!handlers[method]) {
			tries[method] = new require_router_reg_exp_router_trie.Trie();
			handlers[method] = [...handlers["ALL"]];
			for (const p in tries["ALL"].paths) this.#insertPath(method, p);
		}
		if (path === "/*") path = "*";
		const methods = method === "ALL" ? Object.keys(handlers) : [method];
		const paths = require_utils_url.checkOptionalParameter(path) || [path];
		for (const path of paths) for (const m of methods) {
			if (!tries[m].paths[path]) this.#insertPath(m, path);
			handlers[m].push([handler, path]);
		}
	}
	match = require_router_reg_exp_router_matcher.match;
	buildAllMatchers() {
		const matchers = require_router_utils.createNullObject();
		for (const method of Object.keys(this.#handlers)) matchers[method] = this.#buildMatcher(method);
		this.#handlers = this.#tries = void 0;
		return matchers;
	}
	#buildMatcher(method) {
		const handlers = this.#handlers[method];
		const trie = this.#tries[method];
		const staticMap = require_router_utils.createNullObject();
		const handlerData = [];
		const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
		const own = require_router_utils.createNullObject();
		const entries = handlers.map(([h, p], i) => {
			(own[p] ??= []).push(i);
			return [h, trie.paths[p][1].reduceRight((map, [key, varIndex]) => {
				map[key] = paramReplacementMap[varIndex];
				return map;
			}, require_router_utils.createNullObject())];
		});
		const wildcards = Object.keys(own).filter((p) => endsWithWildcard(trie.paths[p][2]));
		for (const path in trie.paths) {
			const [index, , keys] = trie.paths[path];
			const indexes = [...own[path]];
			for (const p of wildcards) if (p !== path && covers(trie.paths[p][2], keys)) indexes.push(...own[p]);
			const data = indexes.sort((a, b) => a - b).map((i) => entries[i]);
			if (index === -1) {
				const last = Math.max(-1, ...data.flatMap(([, map]) => Object.values(map)));
				staticMap[path] = [data, last === -1 ? require_router_reg_exp_router_matcher.emptyParam : path.match(regexp).slice(0, last + 1)];
			} else handlerData[index] = data;
		}
		return [
			regexp,
			indexReplacementMap.map((i) => handlerData[i]),
			staticMap
		];
	}
};
//#endregion
exports.RegExpRouter = RegExpRouter;
