// URL exmaple: https://roblox-blackhawk-rescue-mission-5.fandom.com/api.php?action=opensearch&search=hk416
// docs: https://starwars.fandom.com/api.php?action=help&modules=opensearch

import type { Operation } from "../operation.js";

// instead of using the resources style pattern we will separate them via actions

export type OpenSearchResults = [
	searchTerm: string,
	titles: string[],
	descriptions: string[],
	urls: string[],
];

export interface OpenSearchQueryParameters {
	search: string;
	namespace?:
	| 0
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 100
	| 101
	| 112
	| 113
	| 114
	| 115
	| 116
	| 117
	| 120
	| 121
	| 420
	| 421
	| 500
	| 501
	| 502
	| 503
	| 828
	| 829
	| 1200
	| 1201
	| 1202
	| 1203
	| 2000
	| 2001
	| 2002
	| 2900
	| 2901;
	limit?: number | "max"; // will need to do a proper check for numbers between 1-500. Also some wiki media will do up to 1000 instead, which is past the 999 threshold
	redirects?: "return" | "resolve";
	format?: "json" | "jsonfm" | "xml" | "xmlfm";
	warningsaserror?: boolean;
}

export function getSearchResults(options: OpenSearchQueryParameters): Operation<OpenSearchResults> {
	return {
		method: "GET",
		path: "api.php",
		query: {
			search: options.search,
			namespace: options.namespace,
			limit: options.limit,
			format: options.format,
			warningsaserror: options.warningsaserror
		}
	}
}