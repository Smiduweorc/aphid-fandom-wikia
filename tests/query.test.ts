import assert from "node:assert/strict";
import { test } from "node:test";

import { ApiClient } from "../index.js";
import { query, type QueryResponse } from "../src/actions/query.js";

const baseUrl = "https://starwars.fandom.com";

test("query describes a GET against api.php", () => {
	const operation = query({ titles: ["Luke Skywalker"] });

	assert.equal(operation.method, "GET");
	assert.equal(operation.path, "api.php");
});

test("defaults format to json", () => {
	const operation = query({ titles: ["Luke Skywalker"] });

	assert.equal(operation.query?.action, "query");
	assert.equal(operation.query?.format, "json");
});

test("titles, pageids and revids are joined with |", () => {
	const byTitles = query({ titles: ["Luke Skywalker", "Han Solo"] });
	assert.equal(byTitles.query?.titles, "Luke Skywalker|Han Solo");

	const byPageIds = query({ pageids: [1, 2, 3] });
	assert.equal(byPageIds.query?.pageids, "1|2|3");

	const byRevIds = query({ revids: [10, 20] });
	assert.equal(byRevIds.query?.revids, "10|20");
});

test("prop, list and meta are joined with |, generator is passed through as-is", () => {
	const operation = query({
		titles: ["Luke Skywalker"],
		prop: ["info", "revisions"],
		list: ["allpages"],
		meta: ["siteinfo", "userinfo"],
		generator: "categorymembers",
	});

	assert.equal(operation.query?.prop, "info|revisions");
	assert.equal(operation.query?.list, "allpages");
	assert.equal(operation.query?.meta, "siteinfo|userinfo");
	assert.equal(operation.query?.generator, "categorymembers");
});

test("leaves omitted options undefined", () => {
	const operation = query({ titles: ["Luke Skywalker"] });

	assert.deepEqual(operation.query, {
		action: "query",
		format: "json",
		titles: "Luke Skywalker",
		pageids: undefined,
		revids: undefined,
		prop: undefined,
		list: undefined,
		meta: undefined,
		generator: undefined,
		exportschema: undefined,
		continue: undefined,
		redirects: undefined,
		converttitles: undefined,
		indexpageids: undefined,
		export: undefined,
		exportnowrap: undefined,
		iwurl: undefined,
		rawcontinue: undefined,
	});
});

test("boolean flags become 1 when set to true", () => {
	const operation = query({
		titles: ["Luke Skywalker"],
		redirects: true,
		converttitles: true,
		indexpageids: true,
		export: true,
		iwurl: true,
		rawcontinue: true,
	});

	assert.equal(operation.query?.redirects, 1);
	assert.equal(operation.query?.converttitles, 1);
	assert.equal(operation.query?.indexpageids, 1);
	assert.equal(operation.query?.export, 1);
	assert.equal(operation.query?.iwurl, 1);
	assert.equal(operation.query?.rawcontinue, 1);
});

test("boolean flags are dropped from the query when set to false", () => {
	const operation = query({
		titles: ["Luke Skywalker"],
		redirects: false,
		converttitles: false,
		indexpageids: false,
		export: false,
		iwurl: false,
		rawcontinue: false,
	});

	assert.equal(operation.query?.redirects, undefined);
	assert.equal(operation.query?.converttitles, undefined);
	assert.equal(operation.query?.indexpageids, undefined);
	assert.equal(operation.query?.export, undefined);
	assert.equal(operation.query?.iwurl, undefined);
	assert.equal(operation.query?.rawcontinue, undefined);
});

test("an empty string continue opts into continuation without resuming anything", () => {
	const operation = query({ titles: ["Luke Skywalker"], continue: "" });

	assert.equal(operation.query?.continue, "");
});

test("an omitted continue is dropped entirely", () => {
	const operation = query({ titles: ["Luke Skywalker"] });

	assert.equal(operation.query?.continue, undefined);
});

test("moduleParams are spread onto the query", () => {
	const operation = query({
		titles: ["Luke Skywalker"],
		prop: ["revisions"],
		moduleParams: { rvprop: "content", rvslots: "main" },
	});

	assert.equal(operation.query?.rvprop, "content");
	assert.equal(operation.query?.rvslots, "main");
});

test("a typed parameter overrides a moduleParams key of the same name", () => {
	const operation = query({
		titles: ["Luke Skywalker"],
		moduleParams: { titles: "should be overwritten", action: "should be overwritten" },
	});

	assert.equal(operation.query?.titles, "Luke Skywalker");
	assert.equal(operation.query?.action, "query");
});

test("exportnowrap sets both flags and swaps in a text decoder", async () => {
	const operation = query({
		titles: ["Luke Skywalker"],
		export: true,
		exportnowrap: true,
	});

	assert.equal(operation.query?.export, 1);
	assert.equal(operation.query?.exportnowrap, 1);
	assert.equal(typeof operation.decode, "function");

	const decoded = await operation.decode?.(
		new Response("<mediawiki>dump</mediawiki>")
	);
	assert.equal(decoded, "<mediawiki>dump</mediawiki>");
});

test("without exportnowrap the operation carries no custom decoder", () => {
	const operation = query({ titles: ["Luke Skywalker"] });

	assert.equal(operation.decode, undefined);
});

test("undefined options are dropped from the request URL", async () => {
	let sent: Request | undefined;
	const client = new ApiClient({
		baseUrl,
		transport: async (request) => {
			sent = request;
			return new Response(JSON.stringify({ query: {} }));
		},
	});

	await client.request(query({ titles: ["Luke Skywalker"] }));

	const url = new URL(sent?.url ?? "");
	assert.equal(url.pathname, "/api.php");
	assert.deepEqual([...url.searchParams], [
		["action", "query"],
		["format", "json"],
		["titles", "Luke Skywalker"],
	]);
});

test("multi-valued options reach the URL as a single joined parameter", async () => {
	let sent: Request | undefined;
	const client = new ApiClient({
		baseUrl,
		transport: async (request) => {
			sent = request;
			return new Response(JSON.stringify({ query: {} }));
		},
	});

	await client.request(
		query({ titles: ["Luke Skywalker", "Han Solo"], prop: ["info", "revisions"] })
	);

	const url = new URL(sent?.url ?? "");
	assert.equal(url.searchParams.get("titles"), "Luke Skywalker|Han Solo");
	assert.equal(url.searchParams.get("prop"), "info|revisions");
});

test("the response decodes into a QueryResponse", async () => {
	const payload: QueryResponse = {
		query: {
			pages: {
				"1": { ns: 0, title: "Luke Skywalker", pageid: 1 },
			},
		},
		batchcomplete: "",
	};
	const client = new ApiClient({
		baseUrl,
		transport: async () => new Response(JSON.stringify(payload)),
	});

	const response = await client.request(query({ titles: ["Luke Skywalker"] }));

	assert.deepEqual(response, payload);
});

test("exportnowrap decodes the raw response body through the ApiClient", async () => {
	const client = new ApiClient({
		baseUrl,
		transport: async () => new Response("<mediawiki>dump</mediawiki>"),
	});

	const dump = await client.request(
		query({ titles: ["Luke Skywalker"], export: true, exportnowrap: true })
	);

	assert.equal(dump, "<mediawiki>dump</mediawiki>");
});
