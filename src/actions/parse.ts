// https://starwars.fandom.com/api.php?action=help&modules=parse, according to this some items are mutually exclusive


// this is a complicated endpoint so there will be a lot of comments
import type { Operation } from "../operation.js";

type ParseProp =
	| "text"
	| "langlinks"
	| "categories"
	| "categorieshtml"
	| "links"
	| "templates"
	| "images"
	| "externallinks"
	| "sections"
	| "tocdata"
	| "revid"
	| "displaytitle"
	| "subtitle"
	| "headhtml"
	| "modules"
	| "jsconfigvars"
	| "encodedjsconfigvars"
	| "indicators"
	| "iwlinks"
	| "wikitext"
	| "properties"
	| "limitreportdata"
	| "limitreporthtml"
	| "parsetree"
	| "parsewarnings"
	| "parsewarningshtml"
	| "headitems"; // deprecated

type UseSkin =
	| "apioutput"
	| "authentication-popup"
	| "fallback"
	| "fandomdesktop"
	| "json";

type ContentFormat =
	| "application/json"
	| "application/octet-stream"
	| "application/unknown"
	| "application/x-binary"
	| "text/css"
	| "text/javascript"
	| "text/plain"
	| "text/unknown"
	| "text/x-wiki"
	| "unknown/unknown";

type ContentModel =
	| "GadgetDefinition"
	| "GeoJSON"
	| "GeoJson"
	| "Scribunto"
	| "css"
	| "interactivemap"
	| "javascript"
	| "json"
	| "sanitized-css"
	| "text"
	| "unknown"
	| "wikitext";

interface ParseCommonParams {
	summary?: string;
	redirects?: boolean;

	/** Default: text|langlinks|categories|links|templates|images|externallinks|sections|tocdata|revid|displaytitle|iwlinks|properties|parsewarnings */
	prop?: ParseProp[];

	/** Default: "mw-parser-output" */
	wrapoutputclass?: string;

	usearticle?: boolean;
	parsoid?: boolean;
	pst?: boolean;
	onlypst?: boolean;
	/** @deprecated */
	effectivelanglinks?: boolean;

	section?: string;
	sectiontitle?: string;

	/** @deprecated Use disablelimitreport instead. */
	disablepp?: boolean;
	disablelimitreport?: boolean;
	disableeditsection?: boolean;
	disablestylededuplication?: boolean;
	showstrategykeys?: boolean;
	/** @deprecated Replaced by prop=parsetree. */
	generatexml?: boolean;
	preview?: boolean;
	sectionpreview?: boolean;
	disabletoc?: boolean;

	useskin?: UseSkin;
	contentformat?: ContentFormat;
	mobileformat?: boolean;

	/** Default: "json". */
	format?: "json" | "jsonfm" | "xml" | "xmlfm";
}

// Each variant represents one valid way of telling the API what to parse.
// Verified against the live wiki: page+pageid, page+pageid+oldid and page+text
// each answer `invalidparammix`, so these four are strictly exclusive.
interface ParseByPage extends ParseCommonParams {
	page: string;
	pageid?: never;
	oldid?: never;
	text?: never;
	title?: never;
}

interface ParseByPageId extends ParseCommonParams {
	pageid: number;
	page?: never;
	oldid?: never;
	text?: never;
	title?: never;
}

interface ParseByOldId extends ParseCommonParams {
	oldid: number;
	page?: never;
	pageid?: never;
	text?: never;
	title?: never;
}

interface ParseByText extends ParseCommonParams {
	text: string;
	/** Page the wikitext is parsed as, which is what {{PAGENAME}} resolves to. Defaults to "API". */
	title?: string;
	contentmodel?: ContentModel;
	revid?: number; // for {{REVISIONID}} etc.
	page?: never;
	pageid?: never;
	oldid?: never;
}

export type ParseParams = ParseByPage | ParseByPageId | ParseByOldId | ParseByText;

/** Every field of the four variants, for reading a value off the union. */
type AnyParseParams = ParseCommonParams & {
	page?: string;
	pageid?: number;
	oldid?: number;
	text?: string;
	title?: string;
	contentmodel?: ContentModel;
	revid?: number;
};

/**
 * An HTML fragment. `format=json` wraps every chunk of markup the parser
 * produces in an object under `*` rather than returning a bare string.
 */
export interface WikiHtml {
	readonly "*": string;
}

/** One entry of `prop=categories`. `hidden` is present and empty when set. */
export interface ParseCategory {
	readonly sortkey: string;
	readonly hidden?: "";
	readonly "*": string;
}

/**
 * One entry of `prop=links` or `prop=templates`. `exists` is the presence
 * flag: an empty string when the target exists, absent for a red link.
 */
export interface ParsePageLink {
	readonly ns: number;
	readonly exists?: "";
	readonly "*": string;
}

/** One entry of `prop=langlinks`. */
export interface ParseLangLink {
	readonly lang: string;
	readonly url: string;
	readonly langname: string;
	readonly autonym: string;
	readonly "*": string;
}

/** One entry of `prop=iwlinks`. */
export interface ParseIwLink {
	readonly prefix: string;
	readonly url: string;
	readonly "*": string;
}

/** One heading of `prop=sections`. */
export interface ParseSection {
	readonly toclevel: number;
	/** The `h` level as a string, e.g. `"2"` for an `<h2>`. */
	readonly level: string;
	readonly line: string;
	readonly number: string;
	readonly index: string;
	/** `false` for a section that came from parsed text rather than a page. */
	readonly fromtitle: string | false;
	readonly byteoffset: number | null;
	readonly anchor: string;
	readonly linkAnchor: string;
}

/** One heading of `prop=tocdata`, which repeats `sections` under newer names. */
export interface ParseTocSection {
	readonly tocLevel: number;
	readonly hLevel: number;
	readonly line: string;
	readonly number: string;
	readonly index: string;
	readonly fromTitle: string | false;
	readonly codepointOffset: number | null;
	readonly anchor: string;
}

export interface ParseTocData {
	readonly sections: readonly ParseTocSection[];
	/** Empty on this wiki, and serialised as `[]` when a PHP map has no keys. */
	readonly extensionData: readonly unknown[] | Readonly<Record<string, unknown>>;
}

/** One page property of `prop=properties`, e.g. `infoboxes` on Fandom. */
export interface ParseProperty {
	readonly name: string;
	readonly "*": string;
}

/**
 * One row of `prop=limitreportdata`. The numbered keys are that row's values:
 * `{ name: "limitreport-ppvisitednodes", "0": 763, "1": 1000000 }`.
 */
export interface ParseLimitReportEntry {
	readonly name: string;
	readonly [value: string]: string | number;
}

/**
 * The `parse` object. Only `title` and `pageid` always come back; every other
 * field appears when the matching `prop` was requested, so all of them are
 * optional even though the defaults return most of them.
 */
export interface ParseResult {
	readonly title: string;
	/** `0` when parsing supplied text rather than a stored page. */
	readonly pageid: number;
	readonly revid?: number;
	readonly text?: WikiHtml;
	readonly wikitext?: WikiHtml;
	readonly parsetree?: WikiHtml;
	readonly categories?: readonly ParseCategory[];
	readonly categorieshtml?: WikiHtml;
	readonly links?: readonly ParsePageLink[];
	readonly templates?: readonly ParsePageLink[];
	readonly langlinks?: readonly ParseLangLink[];
	readonly iwlinks?: readonly ParseIwLink[];
	/** File names without the `File:` prefix, e.g. `"CAP.png"`. */
	readonly images?: readonly string[];
	readonly externallinks?: readonly string[];
	readonly sections?: readonly ParseSection[];
	readonly tocdata?: ParseTocData;
	/** Present and empty when the page shows a table of contents. */
	readonly showtoc?: "";
	readonly displaytitle?: string;
	readonly subtitle?: string;
	readonly headhtml?: WikiHtml;
	readonly modules?: readonly string[];
	readonly modulescripts?: readonly string[];
	readonly modulestyles?: readonly string[];
	readonly jsconfigvars?: Readonly<Record<string, unknown>>;
	readonly encodedjsconfigvars?: string;
	readonly indicators?: readonly unknown[] | Readonly<Record<string, string>>;
	readonly properties?: readonly ParseProperty[];
	readonly limitreportdata?: readonly ParseLimitReportEntry[];
	readonly limitreporthtml?: WikiHtml;
	readonly parsewarnings?: readonly string[];
	readonly parsewarningshtml?: readonly string[];
	readonly headitems?: readonly WikiHtml[];
}

export interface ParseResponse {
	readonly parse: ParseResult;
}

/**
 * What the API answers instead of `parse` when the request is rejected — with
 * HTTP 200, so this arrives as a decoded body rather than an `HttpError`.
 * `ParseParams` already rules out the `invalidparammix` combinations at
 * compile time; a bad title or a missing page still lands here.
 */
export interface MediaWikiErrorResponse {
	readonly error: {
		readonly code: string;
		readonly info: string;
		readonly "*": string;
	};
}

/**
 * MediaWiki reads a boolean parameter like an HTML checkbox: any value at all,
 * `false` included, means true. A false flag has to leave the query entirely.
 */
function flag(value: boolean | undefined): 1 | undefined {
	return value === true ? 1 : undefined;
}

/**
 * Parses a page, a revision or a chunk of wikitext.
 *
 * `prop` is joined with `|` because a repeated key does not accumulate: the
 * API keeps only the last `prop` it is given.
 */
export function parse(options: ParseParams): Operation<ParseResponse> {
	const o = options as AnyParseParams;

	return {
		method: "GET",
		path: "api.php",
		query: {
			action: "parse",
			format: o.format ?? "json",

			page: o.page,
			pageid: o.pageid,
			oldid: o.oldid,
			text: o.text,
			title: o.title,
			revid: o.revid,
			contentmodel: o.contentmodel,
			contentformat: o.contentformat,

			prop: o.prop?.join("|"),
			summary: o.summary,
			section: o.section,
			sectiontitle: o.sectiontitle,
			wrapoutputclass: o.wrapoutputclass,
			useskin: o.useskin,

			redirects: flag(o.redirects),
			usearticle: flag(o.usearticle),
			parsoid: flag(o.parsoid),
			pst: flag(o.pst),
			onlypst: flag(o.onlypst),
			effectivelanglinks: flag(o.effectivelanglinks),
			disablepp: flag(o.disablepp),
			disablelimitreport: flag(o.disablelimitreport),
			disableeditsection: flag(o.disableeditsection),
			disablestylededuplication: flag(o.disablestylededuplication),
			showstrategykeys: flag(o.showstrategykeys),
			generatexml: flag(o.generatexml),
			preview: flag(o.preview),
			sectionpreview: flag(o.sectionpreview),
			disabletoc: flag(o.disabletoc),
			mobileformat: flag(o.mobileformat),
		},
	};
}
