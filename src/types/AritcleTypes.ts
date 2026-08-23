import * as cheerio from "cheerio";

export interface Article {
	url: string;
	id: string;
	title: string;
}

export interface EnrichedArticle extends Article {
	img?: string;
	images?: string[];
	article?: string;
	rawContent?: string;
	rawHtml?: string;
	rawPageContent?: string;
}

export interface GetArticleOptions {
	images?: boolean;
	rawContent?: boolean;
	rawPageContent?: boolean;
}

export type CheerioAPI = ReturnType<typeof cheerio.load>;
