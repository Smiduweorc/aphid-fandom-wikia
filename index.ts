// Public surface. Everything reachable from here is API you have to keep;
// anything else under `src/` is internal and free to change.
//
// The `.js` extension is required: under `nodenext` resolution the specifier
// must match the emitted file, not the `.ts` source.

export { ApiClient } from "./src/client.js";
export type {
	ApiClientOptions,
	RequestOptions,
	Transport,
} from "./src/client.js";

export type {
	HttpMethod,
	Operation,
	QueryParams,
	QueryValue,
	RequestBody,
	RequestHeaders,
} from "./src/operation.js";

export { DEFAULT_HEADERS } from "./src/defaults.js";

export { readJson } from "./src/decode.js";

export {
	ApiError,
	DecodeError,
	HttpError,
	TransportError,
} from "./src/errors.js";

