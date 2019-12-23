import { UnicornInfo } from "./UnicornInfo";
import { LicenseInfo } from "./LicenseInfo";

export interface PostInfo {
	id: string;
	excerpt: string;
	html: string;
	frontmatter: {
		title: string;
		published: string;
		tags: string[];
		edited?: string; // This does not exist currently, but we want it to in the future
		description: string;
		authors: Array<UnicornInfo>;
		license: LicenseInfo;
	};
	fields: {
		slug: string;
	};
	wordCount: {
		words: number;
	};
}
