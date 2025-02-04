import { Root } from "hast";
import replaceAllBetween from "unist-util-replace-all-between";
import { Plugin } from "unified";
import { getHeaderNodeId, slugs } from "rehype-slug-custom-id";
import { Element, Node, Parent, Text } from "hast";
import { TabInfo, Tabs } from "./tabs";
import { toString } from "hast-util-to-string";

const isNodeHeading = (n: Element) =>
	n.type === "element" && /h[1-6]/.exec(n.tagName);

const findLargestHeading = (nodes: Element[]) => {
	let largestSize = Infinity;
	for (const node of nodes) {
		if (!isNodeHeading(node)) continue;
		const size = parseInt(node.tagName.substring(1), 10);
		largestSize = Math.min(largestSize, size);
	}
	return largestSize;
};

const isNodeLargestHeading = (n: Element, largestSize: number) =>
	isNodeHeading(n) && parseInt(n.tagName.substring(1), 10) === largestSize;

const getApproxLineCount = (nodes: Node[], inParagraph?: boolean): number => {
	let lines = 0;

	for (const n of nodes) {
		const isInParagraph =
			inParagraph || (n.type === "element" && (n as Element).tagName === "p");

		// recurse through child nodes
		if ("children" in n) {
			lines += getApproxLineCount(
				(n as Parent).children as Node[],
				isInParagraph,
			);
		}
		// assume that any div/p/br causes a line break
		if (
			n.type === "element" &&
			["div", "p", "br"].includes((n as Element).tagName)
		)
			lines++;
		// assume that any image or embed could add ~10 lines
		if (
			n.type === "element" &&
			["img", "svg", "iframe"].includes((n as Element).tagName)
		)
			lines += 10;
		// approximate line wraps in <p> tag, assuming ~100 chars per line
		if (
			isInParagraph &&
			n.type === "text" &&
			typeof (n as Text).value === "string"
		)
			lines += Math.floor((n as Text).value.length / 100);
	}

	return lines;
};

/**
 * Plugin to add Docsify's tab support.
 * @see https://jhildenbiddle.github.io/docsify-tabs/
 *
 * Given that syntax, output the following:
 * ```
 * <div class="tabs">
 *  <ul role="tablist">
 *    <li role="tab">Header Contents</li>
 *  </ul>
 *  <div role="tabpanel">Body contents</div>
 * </div>
 * ```
 *
 * To align with React Tabs package:
 * @see https://github.com/reactjs/react-tabs
 */
export const rehypeTabs: Plugin<[], Root> = () => {
	return (tree) => {
		const replaceTabNodes = (nodes: Node[]) => {
			let sectionStarted = false;
			const largestSize = findLargestHeading(nodes as Element[]);
			const tabs: TabInfo[] = [];

			for (const localNode of nodes as Element[]) {
				if (!sectionStarted && !isNodeLargestHeading(localNode, largestSize)) {
					continue;
				}
				sectionStarted = true;

				// If this is a heading, start a new tab entry...
				if (isNodeLargestHeading(localNode, largestSize)) {
					// Make sure that all tabs labeled "thing" aren't also labeled "thing2"
					slugs.reset();
					const { id: headerSlug } = getHeaderNodeId(localNode, {
						enableCustomId: true,
					});

					tabs.push({
						slug: headerSlug,
						name: toString(localNode as never),
						contents: [],
						headers: [],
					});

					continue;
				}

				// For any other heading found in the tab contents, append to the nested headers array
				if (isNodeHeading(localNode)) {
					const lastTab = tabs.at(-1);

					// Store the related tab ID in the attributes of the header
					localNode.properties["data-tabname"] = lastTab.slug;

					// Add header ID to array
					tabs.at(-1).headers.push(localNode.properties.id.toString());
				}

				// Otherwise, append the node as tab content
				tabs.at(-1).contents.push(localNode);
			}

			// Determine if the set of tabs should use a constant height (via the "tabs-small" class)
			const tabHeights = tabs.map(({ contents }) =>
				getApproxLineCount(contents),
			);
			const isSmall =
				// all tabs must be <= 30 approx. lines (less than the height of most desktop viewports)
				Math.max(...tabHeights) <= 30 &&
				// the max difference between tab heights must be under 15 lines
				Math.max(...tabHeights) - Math.min(...tabHeights) <= 15;

			return [
				Tabs({
					tabs,
					isSmall,
				}),
			];
		};

		replaceAllBetween(
			tree,
			{ type: "raw", value: "<!-- tabs:start -->" } as never,
			{ type: "raw", value: "<!-- tabs:end -->" } as never,
			replaceTabNodes,
		);
		replaceAllBetween(
			tree,
			{ type: "comment", value: " tabs:start " } as never,
			{ type: "comment", value: " tabs:end " } as never,
			replaceTabNodes,
		);
		return tree;
	};
};
