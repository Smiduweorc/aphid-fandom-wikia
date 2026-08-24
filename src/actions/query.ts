// URL example: https://starwars.fandom.com/api.php?action=query&prop=info&titles=Luke%20Skywalker
// docs: https://starwars.fandom.com/api.php?action=help&modules=query
//
// action=query is a host for submodules rather than a single endpoint: `prop`,
// `list` and `meta` each name a set of modules, and every one of them takes its
// own parameters under its own prefix (`rvprop` for prop=revisions, `srsearch`
// for list=search, `gapprefix` for generator=allpages). Only the parameters
// query itself owns are typed here; submodule parameters go through
// `moduleParams`, which keeps this file finite and lets a caller reach a module
// this wrapper has not described yet.

import type { Operation, QueryValue } from "../operation.js";
import type { MediaWikiErrorResponse } from "./parse.js";

/** Properties fetched for the pages the query works on. */
export type QueryProp =
	| "articlesnippet"
	| "categories"
	| "categoryinfo"
	| "contributors"
	| "deletedrevisions"
	| "duplicatefiles"
	| "extlinks"
	| "fileusage"
	| "imageinfo"
	| "images"
	| "info"
	| "infobox"
	| "iwlinks"
	| "langlinks"
	| "links"
	| "linkshere"
	| "pageimages"
	| "pageprops"
	| "redirects"
	| "revisions"
	| "stashimageinfo"
	| "templates"
	| "transcludedin"
	| "vignetteimages";

/** Enumerations that stand on their own instead of describing given pages. */
export type QueryList =
	| "abusefilters"
	| "abuselog"
	| "allcategories"
	| "alldeletedrevisions"
	| "allfileusages"
	| "allimages"
	| "allinfoboxes"
	| "alllinks"
	| "allpages"
	| "allredirects"
	| "allrevisions"
	| "alltransclusions"
	| "allusers"
	| "backlinks"
	| "blocks"
	| "categorymembers"
	| "checkuser"
	| "checkuserlog"
	| "embeddedin"
	| "exturlusage"
	| "filearchive"
	| "gadgetcategories"
	| "gadgets"
	| "imageusage"
	| "iwbacklinks"
	| "langbacklinks"
	| "logevents"
	| "multilookup"
	| "mystashedfiles"
	| "pagepropnames"
	| "pageswithprop"
	| "prefixsearch"
	| "protectedtitles"
	| "querypage"
	| "random"
	| "recentchanges"
	| "search"
	| "tags"
	| "usercontribs"
	| "users"
	| "watchlist"
	| "watchlistraw"
	/** @deprecated Use `alldeletedrevisions` or `prop=deletedrevisions`. */
	| "deletedrevs";

/** Metadata about the wiki or the current user, unrelated to any page. */
export type QueryMeta =
	| "allmessages"
	| "authmanagerinfo"
	| "filerepoinfo"
	| "languageinfo"
	| "siteinfo"
	| "tokens"
	| "userinfo";

/**
 * A module that produces the pages to work on. The generator's own parameters
 * are prefixed with `g` — `generator: "allpages"` reads `gapprefix`, not
 * `apprefix` — and belong in `moduleParams`.
 */
export type QueryGenerator =
	| "allcategories"
	| "alldeletedrevisions"
	| "allfileusages"
	| "allimages"
	| "alllinks"
	| "allpages"
	| "allredirects"
	| "allrevisions"
	| "alltransclusions"
	| "backlinks"
	| "categories"
	| "categorymembers"
	| "deletedrevisions"
	| "duplicatefiles"
	| "embeddedin"
	| "exturlusage"
	| "fileusage"
	| "images"
	| "imageusage"
	| "iwbacklinks"
	| "langbacklinks"
	| "links"
	| "linkshere"
	| "pageswithprop"
	| "prefixsearch"
	| "protectedtitles"
	| "querypage"
	| "random"
	| "recentchanges"
	| "redirects"
	| "revisions"
	| "search"
	| "templates"
	| "transcludedin"
	| "watchlist"
	| "watchlistraw";

interface QueryCommonParameters {
	prop?: QueryProp[];
	list?: QueryList[];
	meta?: QueryMeta[];

	/** Module that generates the pages to work on, in place of a fixed list. */
	generator?: QueryGenerator;

	/** Resolve redirects in `titles`, `pageids`, `revids` and generated pages. */
	redirects?: boolean;
	/** Convert titles to another variant of the wiki's content language. */
	converttitles?: boolean;
	/** Add a `pageids` array listing the keys of `query.pages` in order. */
	indexpageids?: boolean;

	/** Include the current revision of every page as an XML dump. */
	export?: boolean;
	/**
	 * Return that dump as bare XML instead of wrapping it in the JSON result.
	 * The response is then not JSON at all, so {@link query} decodes it as text
	 * and its result type becomes `string`.
	 */
	exportnowrap?: boolean;
	/** Default: "0.11". */
	exportschema?: "0.10" | "0.11";

	/** Return the full URL of a title that turns out to be an interwiki link. */
	iwurl?: boolean;

	/**
	 * Continuation token. Pass `""` on the first request to opt into continuing
	 * at all, then pass back every key of the previous response's `continue`
	 * object through here and `moduleParams`.
	 */
	continue?: string;
	/** Continue with the pre-1.26 `query-continue` format instead. */
	rawcontinue?: boolean;

	/** Default: "json". */
	format?: "json" | "jsonfm" | "xml" | "xmlfm";

	/**
	 * Parameters belonging to the `prop`, `list`, `meta` and `generator`
	 * modules, keyed by the prefixed name the API expects: `rvprop`, `srlimit`,
	 * `gapprefix`. They are written first, so a key one of the typed parameters
	 * above also owns is overwritten by it.
	 */
	moduleParams?: Readonly<Record<string, QueryValue>>;
}

// The three page sources are mutually exclusive: pairing any two answers
// `multisource` ("The "pageids" parameter cannot be used with "titles"").
// A generator is not a fourth source in that sense — it combines with the
// others without error and simply replaces the pages they name.

interface QueryByTitles extends QueryCommonParameters {
	/** Up to 50 titles, or 500 for a client with higher limits. */
	titles: string[];
	pageids?: never;
	revids?: never;
}

interface QueryByPageIds extends QueryCommonParameters {
	pageids: number[];
	titles?: never;
	revids?: never;
}

interface QueryByRevIds extends QueryCommonParameters {
	/**
	 * Almost every module resolves these to their page and then works on its
	 * latest revision; only `prop=revisions` uses the exact revisions.
	 */
	revids: number[];
	titles?: never;
	pageids?: never;
}

/** A query that names no pages: `list`, `meta`, or a bare `generator`. */
interface QueryWithoutPages extends QueryCommonParameters {
	titles?: never;
	pageids?: never;
	revids?: never;
}

export type QueryParameters =
	| QueryByTitles
	| QueryByPageIds
	| QueryByRevIds
	| QueryWithoutPages;

/** The `exportnowrap` form, whose response is XML rather than JSON. */
export type QueryExportParameters = QueryParameters & {
	export: true;
	exportnowrap: true;
};

/** Every field of the variants, for reading a value off the union. */
type AnyQueryParameters = QueryCommonParameters & {
	titles?: string[];
	pageids?: number[];
	revids?: number[];
};

/**
 * A value the JSON format returns as an object keyed by `*` rather than as a
 * bare string, which is how it carries text that may hold markup.
 */
export interface WikiValue {
	readonly "*": string;
}

/** One `titles` entry rewritten by title normalisation or variant conversion. */
export interface TitleConversion {
	readonly from: string;
	readonly to: string;
}

/** One redirect followed by `redirects`. */
export interface TitleRedirect extends TitleConversion {
	/** Fragment of the redirect target, when it points at a section. */
	readonly tofragment?: string;
}

/** One title that turned out to name another wiki. Such a title has no page. */
export interface InterwikiTitle {
	readonly title: string;
	readonly iw: string;
	/** Present with `iwurl`. */
	readonly url?: string;
}

/** A page named only by its identity, as the link-shaped props return it. */
export interface PageRef {
	readonly ns: number;
	readonly title: string;
	/** Absent for a link to a page that does not exist. */
	readonly pageid?: number;
}

/** One entry of `prop=categories`. `hidden` is present and empty when set. */
export interface CategoryLink {
	readonly ns: number;
	readonly title: string;
	readonly sortkey?: string;
	readonly sortkeyprefix?: string;
	readonly hidden?: "";
	readonly timestamp?: string;
}

/** `prop=categoryinfo`, present only on a page in the Category namespace. */
export interface CategoryInfo {
	/** Members of every kind, i.e. `pages + files + subcats`. */
	readonly size: number;
	readonly pages: number;
	readonly files: number;
	readonly subcats: number;
	readonly hidden?: "";
}

/** One logged-in contributor of `prop=contributors`. */
export interface Contributor {
	readonly userid: number;
	readonly name: string;
}

/** One revision of `prop=revisions` or `prop=deletedrevisions`. */
export interface Revision {
	readonly revid?: number;
	readonly parentid?: number;
	readonly minor?: "";
	readonly user?: string;
	readonly userid?: number;
	/** Present and empty when the edit was made logged out. */
	readonly anon?: "";
	readonly timestamp?: string;
	readonly size?: number;
	readonly sha1?: string;
	readonly comment?: string;
	readonly parsedcomment?: string;
	readonly tags?: readonly string[];
	readonly contentmodel?: string;
	readonly contentformat?: string;
	/** The wikitext, with `rvprop=content` and no `rvslots`. */
	readonly "*"?: string;
	/** The wikitext by slot, with `rvslots=main`. */
	readonly slots?: Readonly<Record<string, WikiValue & { readonly contentmodel?: string; readonly contentformat?: string }>>;
	readonly userhidden?: "";
	readonly commenthidden?: "";
	readonly texthidden?: "";
	readonly suppressed?: "";
}

/** One upload of `prop=imageinfo`, `prop=stashimageinfo` or `list=allimages`. */
export interface ImageInfo {
	readonly timestamp?: string;
	readonly user?: string;
	readonly userid?: number;
	readonly size?: number;
	readonly width?: number;
	readonly height?: number;
	readonly comment?: string;
	readonly parsedcomment?: string;
	readonly canonicaltitle?: string;
	readonly url?: string;
	readonly descriptionurl?: string;
	readonly descriptionshorturl?: string;
	readonly thumburl?: string;
	readonly thumbwidth?: number;
	readonly thumbheight?: number;
	readonly sha1?: string;
	readonly mime?: string;
	readonly mediatype?: string;
	readonly bitdepth?: number;
	readonly metadata?: readonly unknown[] | null;
	readonly commonmetadata?: readonly unknown[] | null;
	readonly extmetadata?: Readonly<Record<string, unknown>>;
}

/** One file of `prop=duplicatefiles`. */
export interface DuplicateFile {
	readonly name: string;
	readonly user?: string;
	readonly timestamp?: string;
	/** Present and empty when the duplicate lives on a shared repository. */
	readonly shared?: "";
}

/** One entry of `prop=langlinks`. */
export interface LangLink extends WikiValue {
	readonly lang: string;
	readonly url?: string;
	readonly langname?: string;
	readonly autonym?: string;
}

/** One entry of `prop=iwlinks`. */
export interface IwLink extends WikiValue {
	readonly prefix: string;
	readonly url?: string;
}

/** One protection entry of `prop=info`. */
export interface PageProtection {
	readonly type: string;
	readonly level: string;
	readonly expiry: string;
	readonly source?: string;
	readonly cascade?: "";
}

/** A `pageimages` or `vignetteimages` thumbnail. */
export interface PageImage {
	readonly source: string;
	readonly width: number;
	readonly height: number;
}

/**
 * One node of the infobox template's structure, as `prop=infobox` describes it.
 * A node either names its wikitext sources or nests further nodes, so the shape
 * is recursive and only the discriminator is guaranteed.
 */
export interface InfoboxNode {
	readonly type: string;
	/** `[]` rather than an object for a node that draws on no parameter. */
	readonly sources?:
	| Readonly<Record<string, { readonly label?: string; readonly primary?: "" }>>
	| readonly never[];
	readonly metadata?: readonly InfoboxNode[];
}

/** One infobox of `prop=infobox`: its layout, not the values filled into it. */
export interface PageInfobox {
	readonly id: number;
	readonly parser_tag_version: number;
	readonly metadata: readonly InfoboxNode[];
}

/**
 * One page of `query.pages`, keyed there by page ID — or by a negative
 * placeholder for a title that has no page.
 *
 * Only `ns` and `title` always come back. Everything else appears when the
 * matching `prop` was requested, so all of it is optional even though a given
 * `prop` list makes some of it certain.
 */
export interface QueryPage {
	readonly ns: number;
	readonly title: string;
	/** Absent for a missing or invalid page. */
	readonly pageid?: number;
	/** Present and empty when the title is well formed but has no page. */
	readonly missing?: "";
	/** Present and empty when the title cannot exist at all. */
	readonly invalid?: "";
	readonly invalidreason?: string;
	/** Present and empty when a missing page is nonetheless known, e.g. a file on a shared repository. */
	readonly known?: "";
	readonly special?: "";

	// prop=info
	readonly contentmodel?: string;
	readonly pagelanguage?: string;
	readonly pagelanguagehtmlcode?: string;
	readonly pagelanguagedir?: string;
	readonly touched?: string;
	readonly lastrevid?: number;
	readonly length?: number;
	/** Present and empty when the page is a redirect. */
	readonly redirect?: "";
	readonly new?: "";
	readonly protection?: readonly PageProtection[];
	readonly restrictiontypes?: readonly string[];
	readonly displaytitle?: string;
	readonly talkid?: number;
	readonly watchers?: number;
	/** With `inprop=url`. */
	readonly fullurl?: string;
	readonly editurl?: string;
	readonly canonicalurl?: string;

	// prop=articlesnippet
	/** A plain-text opening of the article, truncated with an ellipsis. */
	readonly extract?: string;

	// page-shaped props
	readonly categories?: readonly CategoryLink[];
	readonly categoryinfo?: CategoryInfo;
	readonly contributors?: readonly Contributor[];
	/** Count of logged-out contributors, which are not named individually. */
	readonly anoncontributors?: number;
	readonly revisions?: readonly Revision[];
	readonly deletedrevisions?: readonly Revision[];
	readonly links?: readonly PageRef[];
	readonly templates?: readonly PageRef[];
	readonly images?: readonly PageRef[];
	readonly linkshere?: readonly (PageRef & { readonly redirect?: "" })[];
	readonly transcludedin?: readonly (PageRef & { readonly redirect?: "" })[];
	readonly fileusage?: readonly (PageRef & { readonly redirect?: "" })[];
	readonly redirects?: readonly (PageRef & { readonly fragment?: string })[];
	readonly extlinks?: readonly WikiValue[];
	readonly langlinks?: readonly LangLink[];
	readonly iwlinks?: readonly IwLink[];
	readonly duplicatefiles?: readonly DuplicateFile[];
	readonly imageinfo?: readonly ImageInfo[];
	/** Which repository a file lives on, e.g. `"local"` or `"shared"`. */
	readonly imagerepository?: string;

	/**
	 * Page properties set by the content. Values are always strings, so a
	 * structured one arrives as JSON that still has to be parsed — Fandom's
	 * `infoboxes` here is a JSON string, unlike the array `prop=infobox` gives.
	 */
	readonly pageprops?: Readonly<Record<string, string>>;

	// prop=infobox
	readonly infoboxes?: readonly PageInfobox[];

	// prop=pageimages and prop=vignetteimages, which share their output keys
	readonly thumbnail?: PageImage;
	readonly original?: PageImage;
	readonly pageimage?: string;
}

/** One result of `list=search`. */
export interface SearchResult {
	readonly ns: number;
	readonly title: string;
	readonly pageid: number;
	readonly size?: number;
	readonly wordcount?: number;
	/** HTML, with the matched terms wrapped in `<span class="searchmatch">`. */
	readonly snippet?: string;
	readonly titlesnippet?: string;
	readonly sectiontitle?: string;
	readonly sectionsnippet?: string;
	readonly categorysnippet?: string;
	readonly redirecttitle?: string;
	readonly redirectsnippet?: string;
	readonly isfilematch?: boolean;
	readonly timestamp?: string;
}

/** The `searchinfo` companion of `list=search`. */
export interface SearchInfo {
	readonly totalhits?: number;
	readonly suggestion?: string;
	readonly suggestionsnippet?: string;
	readonly rewrittenquery?: string;
	readonly rewrittenquerysnippet?: string;
}

/** One category of `list=allcategories`. Its name is the `*` value. */
export interface AllCategoriesEntry extends WikiValue {
	readonly size?: number;
	readonly pages?: number;
	readonly files?: number;
	readonly subcats?: number;
	readonly hidden?: "";
}

/** One file of `list=allimages`, which repeats the `imageinfo` fields. */
export interface AllImagesEntry extends ImageInfo {
	readonly name: string;
	readonly ns?: number;
	readonly title?: string;
}

/**
 * One infobox template of Fandom's `list=allinfoboxes`. This module answers
 * with `pageid` and `ns` as strings, unlike the rest of the API.
 */
export interface AllInfoboxesEntry {
	readonly pageid: string;
	readonly ns: string;
	readonly title: string;
	readonly label: string;
}

/** One user of `list=allusers` or `list=users`. */
export interface UserEntry {
	readonly userid?: number;
	readonly name: string;
	readonly missing?: "";
	readonly invalid?: "";
	readonly editcount?: number;
	readonly registration?: string;
	readonly groups?: readonly string[];
	readonly implicitgroups?: readonly string[];
	readonly rights?: readonly string[];
	readonly blockid?: number;
	readonly blockedby?: string;
	readonly blockreason?: string;
	readonly blockexpiry?: string;
	readonly gender?: string;
}

/** One edit of `list=usercontribs`. */
export interface UserContribution {
	readonly userid?: number;
	readonly user: string;
	readonly pageid: number;
	readonly revid: number;
	readonly parentid?: number;
	readonly ns: number;
	readonly title: string;
	readonly timestamp: string;
	readonly new?: "";
	readonly minor?: "";
	/** Present and empty when this is the page's current revision. */
	readonly top?: "";
	readonly comment?: string;
	readonly parsedcomment?: string;
	readonly size?: number;
	readonly sizediff?: number;
	readonly tags?: readonly string[];
}

/** One member of `list=categorymembers`. */
export interface CategoryMember extends PageRef {
	readonly sortkey?: string;
	readonly sortkeyprefix?: string;
	/** `"page"`, `"subcat"` or `"file"`. */
	readonly type?: string;
	readonly timestamp?: string;
}

/** One page of `list=random`, which names the page id `id`, not `pageid`. */
export interface RandomPage {
	readonly id: number;
	readonly ns: number;
	readonly title: string;
	readonly redirect?: "";
}

/** One change of `list=recentchanges`. */
export interface RecentChange {
	/** `"edit"`, `"new"`, `"log"`, `"categorize"` or `"external"`. */
	readonly type: string;
	readonly ns?: number;
	readonly title?: string;
	readonly pageid?: number;
	readonly revid?: number;
	readonly old_revid?: number;
	readonly rcid?: number;
	readonly user?: string;
	readonly userid?: number;
	readonly anon?: "";
	readonly bot?: "";
	readonly new?: "";
	readonly minor?: "";
	readonly oldlen?: number;
	readonly newlen?: number;
	readonly timestamp?: string;
	readonly comment?: string;
	readonly parsedcomment?: string;
	readonly tags?: readonly string[];
	readonly redirect?: "";
	readonly logid?: number;
	readonly logtype?: string;
	readonly logaction?: string;
	readonly logparams?: Readonly<Record<string, unknown>>;
}

/** One entry of `list=logevents`. */
export interface LogEvent {
	readonly logid: number;
	readonly ns?: number;
	readonly title?: string;
	readonly pageid?: number;
	readonly logpage?: number;
	readonly revid?: number;
	readonly type?: string;
	readonly action?: string;
	readonly user?: string;
	readonly userid?: number;
	readonly anon?: "";
	readonly timestamp?: string;
	readonly comment?: string;
	readonly parsedcomment?: string;
	readonly tags?: readonly string[];
	/** Shape depends on the log type: a block carries `duration` and `expiry`, a move `target_title`. */
	readonly params?: Readonly<Record<string, unknown>>;
}

/** One change tag of `list=tags`. */
export interface TagEntry {
	readonly name: string;
	readonly displayname?: string;
	readonly description?: string;
	readonly hitcount?: number;
	readonly defined?: "";
	readonly source?: readonly string[];
	readonly active?: "";
}

/** One namespace of `meta=siteinfo&siprop=namespaces`, keyed there by id. */
export interface Namespace extends WikiValue {
	readonly id: number;
	readonly case: string;
	/** The English name, absent for the main namespace. */
	readonly canonical?: string;
	readonly subpages?: "";
	readonly content?: "";
	readonly namespaceprotection?: string;
	readonly defaultcontentmodel?: string;
}

/** `meta=siteinfo&siprop=general`, of which only the well-known keys are named. */
export interface SiteInfoGeneral {
	readonly mainpage: string;
	readonly base: string;
	readonly sitename: string;
	readonly generator: string;
	readonly lang: string;
	readonly case: string;
	readonly server: string;
	readonly servername: string;
	readonly scriptpath: string;
	readonly script: string;
	readonly articlepath: string;
	readonly wikiid?: string;
	readonly logo?: string;
	readonly time?: string;
	readonly timezone?: string;
	readonly maxarticlesize?: number;
	readonly [key: string]: unknown;
}

/** `meta=siteinfo&siprop=statistics`. */
export interface SiteStatistics {
	readonly pages: number;
	readonly articles: number;
	readonly edits: number;
	readonly images: number;
	readonly users: number;
	readonly activeusers: number;
	readonly admins: number;
	readonly jobs: number;
	readonly [key: string]: number;
}

/** `meta=userinfo`, describing whoever the request authenticated as. */
export interface UserInfo {
	/** `0` for an anonymous request, where `name` is the IP address instead. */
	readonly id: number;
	readonly name: string;
	readonly anon?: "";
	readonly groups?: readonly string[];
	readonly implicitgroups?: readonly string[];
	readonly rights?: readonly string[];
	readonly editcount?: number;
	readonly email?: string;
	readonly registrationdate?: string;
	readonly messages?: "";
	readonly [key: string]: unknown;
}

/**
 * The `query` object: the pages the query worked on, plus one key per `list`
 * and `meta` module that ran.
 *
 * The modules named here are the ones this wrapper describes; the index
 * signature keeps every other module reachable as `unknown` rather than a type
 * error, at the cost of not catching a misspelt key.
 */
export interface QueryResult {
	/** Pages keyed by page ID, or by a negative placeholder when there is none. */
	readonly pages?: Readonly<Record<string, QueryPage>>;
	/** With `indexpageids`: the keys of `pages`, as strings, in order. */
	readonly pageids?: readonly string[];

	readonly normalized?: readonly TitleConversion[];
	readonly converted?: readonly TitleConversion[];
	readonly redirects?: readonly TitleRedirect[];
	readonly interwiki?: readonly InterwikiTitle[];

	/** With `export` and without `exportnowrap`: the XML dump. */
	readonly export?: WikiValue;

	readonly search?: readonly SearchResult[];
	readonly searchinfo?: SearchInfo;
	readonly prefixsearch?: readonly PageRef[];
	readonly allpages?: readonly PageRef[];
	readonly allcategories?: readonly AllCategoriesEntry[];
	readonly allimages?: readonly AllImagesEntry[];
	readonly allinfoboxes?: readonly AllInfoboxesEntry[];
	readonly allusers?: readonly UserEntry[];
	readonly users?: readonly UserEntry[];
	readonly usercontribs?: readonly UserContribution[];
	readonly backlinks?: readonly PageRef[];
	readonly embeddedin?: readonly PageRef[];
	readonly imageusage?: readonly PageRef[];
	readonly categorymembers?: readonly CategoryMember[];
	readonly random?: readonly RandomPage[];
	readonly recentchanges?: readonly RecentChange[];
	readonly logevents?: readonly LogEvent[];
	readonly tags?: readonly TagEntry[];
	readonly stashimageinfo?: readonly ImageInfo[];

	readonly general?: SiteInfoGeneral;
	readonly namespaces?: Readonly<Record<string, Namespace>>;
	readonly statistics?: SiteStatistics;
	readonly userinfo?: UserInfo;
	/** Keyed by token name, e.g. `csrftoken`. Anonymous requests get `"+\\"`. */
	readonly tokens?: Readonly<Record<string, string>>;

	readonly [module: string]: unknown;
}

/**
 * Continuation state. Each running module contributes its own key — `sroffset`
 * for search, `rvcontinue` for revisions — and `continue` itself says which
 * modules are still going. Send every key back on the next request to resume.
 */
export interface QueryContinue {
	readonly continue: string;
	readonly [key: string]: string | number;
}

export interface QueryResponse {
	readonly query?: QueryResult;
	/** Present and empty once every page in the batch has been fully returned. */
	readonly batchcomplete?: "";
	/** Present while results remain; absent once the query is exhausted. */
	readonly continue?: QueryContinue;
	/** The `rawcontinue` form, keyed by module rather than flattened. */
	readonly "query-continue"?: Readonly<Record<string, Readonly<Record<string, string | number>>>>;
	/** Non-fatal complaints, keyed by the module that raised them. */
	readonly warnings?: Readonly<Record<string, WikiValue>>;
	/** Per-module result caps applied to this request. */
	readonly limits?: Readonly<Record<string, number>>;
	/** Set when the whole request was rejected; `query` is then absent. */
	readonly error?: MediaWikiErrorResponse["error"];
}

/**
 * MediaWiki reads a boolean parameter like an HTML checkbox: any value at all,
 * `false` included, means true. A false flag has to leave the query entirely.
 */
function flag(value: boolean | undefined): 1 | undefined {
	return value === true ? 1 : undefined;
}

/**
 * Queries the wiki, running whichever `prop`, `list` and `meta` modules are
 * asked for against a set of pages.
 *
 * Multi-valued parameters are joined with `|` because a repeated key does not
 * accumulate: the API keeps only the last one it is given.
 */
export function query(options: QueryExportParameters): Operation<string>;
export function query(options: QueryParameters): Operation<QueryResponse>;
export function query(options: QueryParameters): Operation<QueryResponse> | Operation<string> {
	const o = options as AnyQueryParameters;

	const operation: Operation<QueryResponse> = {
		method: "GET",
		path: "api.php",
		query: {
			...o.moduleParams,

			action: "query",
			format: o.format ?? "json",

			titles: o.titles?.join("|"),
			pageids: o.pageids?.join("|"),
			revids: o.revids?.join("|"),

			prop: o.prop?.join("|"),
			list: o.list?.join("|"),
			meta: o.meta?.join("|"),
			generator: o.generator,

			exportschema: o.exportschema,
			// An empty string is a meaningful value here — it opts into
			// continuation without resuming anything — so only `undefined` may
			// drop the parameter.
			continue: o.continue,

			redirects: flag(o.redirects),
			converttitles: flag(o.converttitles),
			indexpageids: flag(o.indexpageids),
			export: flag(o.export),
			exportnowrap: flag(o.exportnowrap),
			iwurl: flag(o.iwurl),
			rawcontinue: flag(o.rawcontinue),
		},
	};

	// `exportnowrap` answers with the dump itself rather than a JSON envelope,
	// so the default JSON decode would throw on a perfectly good response.
	return o.exportnowrap === true
		? { ...operation, decode: (response: Response) => response.text() }
		: operation;
}
