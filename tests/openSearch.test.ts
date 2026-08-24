import assert from "node:assert/strict";
import { test } from "node:test";

import { ApiClient } from "../index.js";
import {
	getSearchResults,
	type OpenSearchResults,
} from "../src/actions/openSearch.js";

const results: OpenSearchResults = [
	"hk416",
	["HK416", "HK416 (Carbine)"],
	["", ""],
	[
		"https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/HK416",
		"https://roblox-blackhawk-rescue-mission-5.fandom.com/wiki/HK416_(Carbine)",
	],
];

test("getSearchResults describes a GET against api.php", () => {
	const operation = getSearchResults({ search: "hk416" });

	assert.equal(operation.method, "GET");
	assert.equal(operation.path, "api.php");
});

test("getSearchResults maps every option onto the query", () => {
	const operation = getSearchResults({
		search: "hk416",
		namespace: 0,
		limit: "max",
		format: "json",
		warningsaserror: true,
	});

	assert.deepEqual(operation.query, {
		search: "hk416",
		namespace: 0,
		limit: "max",
		format: "json",
		warningsaserror: true,
	});
});

test("getSearchResults leaves omitted options undefined", () => {
	const operation = getSearchResults({ search: "hk416" });

	assert.deepEqual(operation.query, {
		search: "hk416",
		namespace: undefined,
		limit: undefined,
		format: undefined,
		warningsaserror: undefined,
	});
});

test("undefined options are dropped from the request URL", async () => {
	let sent: Request | undefined;
	const client = new ApiClient({
		baseUrl: "https://roblox-blackhawk-rescue-mission-5.fandom.com",
		transport: async (request) => {
			sent = request;
			return new Response(JSON.stringify(results));
		},
	});

	await client.request(getSearchResults({ search: "hk416" }));

	assert.equal(
		sent?.url,
		"https://roblox-blackhawk-rescue-mission-5.fandom.com/api.php?search=hk416"
	);
});

test("every option is serialised onto the request URL", async () => {
	let sent: Request | undefined;
	const client = new ApiClient({
		baseUrl: "https://roblox-blackhawk-rescue-mission-5.fandom.com",
		transport: async (request) => {
			sent = request;
			return new Response(JSON.stringify(results));
		},
	});

	await client.request(
		getSearchResults({
			search: "hk 416",
			namespace: 14,
			limit: 10,
			format: "json",
			warningsaserror: false,
		})
	);

	const url = new URL(sent?.url ?? "");

	assert.equal(url.pathname, "/api.php");
	assert.deepEqual([...url.searchParams], [
		["search", "hk 416"],
		["namespace", "14"],
		["limit", "10"],
		["format", "json"],
		["warningsaserror", "false"],
	]);
});

test("the response decodes into the OpenSearch tuple", async () => {
	const client = new ApiClient({
		baseUrl: "https://roblox-blackhawk-rescue-mission-5.fandom.com",
		transport: async () => new Response(JSON.stringify(results)),
	});

	const [term, titles, descriptions, urls] = await client.request(
		getSearchResults({ search: "hk416" })
	);

	assert.equal(term, "hk416");
	assert.deepEqual(titles, ["HK416", "HK416 (Carbine)"]);
	assert.deepEqual(descriptions, ["", ""]);
	assert.equal(urls.length, 2);
});
