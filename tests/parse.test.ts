import assert from "node:assert/strict";
import { test } from "node:test";

import { ApiClient } from "../index.js";
import { parse, type ParseResponse } from "../src/actions/parse.js";

const baseUrl = "https://starwars.fandom.com";

test("parse describes a GET against api.php", () => {
	const operation = parse({ page: "Luke Skywalker" });

	assert.equal(operation.method, "GET");
	assert.equal(operation.path, "api.php");
});

test("defaults format to json", () => {
	const operation = parse({ page: "Luke Skywalker" });

	assert.equal(operation.query?.action, "parse");
	assert.equal(operation.query?.format, "json");
});

test("each page-selecting variant maps onto its own query key", () => {
	assert.equal(parse({ page: "Luke Skywalker" }).query?.page, "Luke Skywalker");
	assert.equal(parse({ pageid: 42 }).query?.pageid, 42);
	assert.equal(parse({ oldid: 123 }).query?.oldid, 123);

	const byText = parse({
		text: "'''Luke Skywalker'''",
		title: "Luke Skywalker",
		contentmodel: "wikitext",
		revid: 7,
	});
	assert.equal(byText.query?.text, "'''Luke Skywalker'''");
	assert.equal(byText.query?.title, "Luke Skywalker");
	assert.equal(byText.query?.contentmodel, "wikitext");
	assert.equal(byText.query?.revid, 7);
});

test("prop is joined with |", () => {
	const operation = parse({
		page: "Luke Skywalker",
		prop: ["text", "categories", "links"],
	});

	assert.equal(operation.query?.prop, "text|categories|links");
});

test("leaves omitted options undefined", () => {
	const operation = parse({ page: "Luke Skywalker" });

	assert.deepEqual(operation.query, {
		action: "parse",
		format: "json",
		page: "Luke Skywalker",
		pageid: undefined,
		oldid: undefined,
		text: undefined,
		title: undefined,
		revid: undefined,
		contentmodel: undefined,
		contentformat: undefined,
		prop: undefined,
		summary: undefined,
		section: undefined,
		sectiontitle: undefined,
		wrapoutputclass: undefined,
		useskin: undefined,
		redirects: undefined,
		usearticle: undefined,
		parsoid: undefined,
		pst: undefined,
		onlypst: undefined,
		effectivelanglinks: undefined,
		disablepp: undefined,
		disablelimitreport: undefined,
		disableeditsection: undefined,
		disablestylededuplication: undefined,
		showstrategykeys: undefined,
		generatexml: undefined,
		preview: undefined,
		sectionpreview: undefined,
		disabletoc: undefined,
		mobileformat: undefined,
	});
});

test("boolean flags become 1 when set to true", () => {
	const operation = parse({
		page: "Luke Skywalker",
		redirects: true,
		usearticle: true,
		parsoid: true,
		pst: true,
		onlypst: true,
		effectivelanglinks: true,
		disablepp: true,
		disablelimitreport: true,
		disableeditsection: true,
		disablestylededuplication: true,
		showstrategykeys: true,
		generatexml: true,
		preview: true,
		sectionpreview: true,
		disabletoc: true,
		mobileformat: true,
	});

	assert.equal(operation.query?.redirects, 1);
	assert.equal(operation.query?.usearticle, 1);
	assert.equal(operation.query?.parsoid, 1);
	assert.equal(operation.query?.pst, 1);
	assert.equal(operation.query?.onlypst, 1);
	assert.equal(operation.query?.effectivelanglinks, 1);
	assert.equal(operation.query?.disablepp, 1);
	assert.equal(operation.query?.disablelimitreport, 1);
	assert.equal(operation.query?.disableeditsection, 1);
	assert.equal(operation.query?.disablestylededuplication, 1);
	assert.equal(operation.query?.showstrategykeys, 1);
	assert.equal(operation.query?.generatexml, 1);
	assert.equal(operation.query?.preview, 1);
	assert.equal(operation.query?.sectionpreview, 1);
	assert.equal(operation.query?.disabletoc, 1);
	assert.equal(operation.query?.mobileformat, 1);
});

test("boolean flags are dropped from the query when set to false", () => {
	const operation = parse({
		page: "Luke Skywalker",
		redirects: false,
		usearticle: false,
		parsoid: false,
		pst: false,
		onlypst: false,
		effectivelanglinks: false,
		disablepp: false,
		disablelimitreport: false,
		disableeditsection: false,
		disablestylededuplication: false,
		showstrategykeys: false,
		generatexml: false,
		preview: false,
		sectionpreview: false,
		disabletoc: false,
		mobileformat: false,
	});

	assert.equal(operation.query?.redirects, undefined);
	assert.equal(operation.query?.usearticle, undefined);
	assert.equal(operation.query?.parsoid, undefined);
	assert.equal(operation.query?.pst, undefined);
	assert.equal(operation.query?.onlypst, undefined);
	assert.equal(operation.query?.effectivelanglinks, undefined);
	assert.equal(operation.query?.disablepp, undefined);
	assert.equal(operation.query?.disablelimitreport, undefined);
	assert.equal(operation.query?.disableeditsection, undefined);
	assert.equal(operation.query?.disablestylededuplication, undefined);
	assert.equal(operation.query?.showstrategykeys, undefined);
	assert.equal(operation.query?.generatexml, undefined);
	assert.equal(operation.query?.preview, undefined);
	assert.equal(operation.query?.sectionpreview, undefined);
	assert.equal(operation.query?.disabletoc, undefined);
	assert.equal(operation.query?.mobileformat, undefined);
});

test("passes non-boolean options straight onto the query", () => {
	const operation = parse({
		page: "Luke Skywalker",
		summary: "Fixed typo",
		section: "1",
		sectiontitle: "Biography",
		wrapoutputclass: "custom-class",
		useskin: "fandomdesktop",
		contentformat: "text/x-wiki",
	});

	assert.equal(operation.query?.summary, "Fixed typo");
	assert.equal(operation.query?.section, "1");
	assert.equal(operation.query?.sectiontitle, "Biography");
	assert.equal(operation.query?.wrapoutputclass, "custom-class");
	assert.equal(operation.query?.useskin, "fandomdesktop");
	assert.equal(operation.query?.contentformat, "text/x-wiki");
});

test("undefined options are dropped from the request URL", async () => {
	let sent: Request | undefined;
	const client = new ApiClient({
		baseUrl,
		transport: async (request) => {
			sent = request;
			return new Response(
				JSON.stringify({ parse: { title: "Luke Skywalker", pageid: 1 } })
			);
		},
	});

	await client.request(parse({ page: "Luke Skywalker" }));

	const url = new URL(sent?.url ?? "");
	assert.equal(url.pathname, "/api.php");
	assert.deepEqual([...url.searchParams], [
		["action", "parse"],
		["format", "json"],
		["page", "Luke Skywalker"],
	]);
});

test("every option is serialised onto the request URL", async () => {
	let sent: Request | undefined;
	const client = new ApiClient({
		baseUrl,
		transport: async (request) => {
			sent = request;
			return new Response(
				JSON.stringify({ parse: { title: "Luke Skywalker", pageid: 1 } })
			);
		},
	});

	await client.request(
		parse({
			page: "Luke Skywalker",
			prop: ["text", "categories"],
			redirects: true,
			disabletoc: false,
		})
	);

	const url = new URL(sent?.url ?? "");
	assert.deepEqual([...url.searchParams], [
		["action", "parse"],
		["format", "json"],
		["page", "Luke Skywalker"],
		["prop", "text|categories"],
		["redirects", "1"],
	]);
});

test("the response decodes into a ParseResponse", async () => {
	const payload: ParseResponse = {
		parse: {
			title: "Luke Skywalker",
			pageid: 1,
			text: { "*": "<p>Luke Skywalker</p>" },
		},
	};
	const client = new ApiClient({
		baseUrl,
		transport: async () => new Response(JSON.stringify(payload)),
	});

	const response = await client.request(parse({ page: "Luke Skywalker" }));

	assert.deepEqual(response, payload);
});
