import { GetPictureResult } from "@astrojs/image/dist/lib/get-picture";

export interface IFramePlaceholderProps {
	width: number;
	height: number;
	src: string;
	pageTitle: string;
	pageIcon: GetPictureResult;
}

/** @jsxImportSource hastscript */
export function IFramePlaceholder({ height, width, ...props }: IFramePlaceholderProps) {
	return (
		<div
			class="iframe-replacement-container"
			data-iframeurl={props.src}
			style={`height: ${Number(height) ? `${height}px` : height}; width: ${Number(width) ? `${width}px` : width};`}
		>
			<picture>
				{props.pageIcon.sources.map((source) => (
					<source {...source} />
				))}
				<img
					{...props.pageIcon.image as any}
					class="iframe-replacement-icon"
					alt=""
					loading="lazy"
					decoding="async"
					data-nozoom="true"
				/>
			</picture>
			<p class="iframe-replacement-title">
				<span class="visually-hidden">An embedded webpage:</span>
				{props.pageTitle}
			</p>
			<button class="iframe-replacement-button">Run embed</button>
		</div>
	);
}
