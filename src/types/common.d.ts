import _mongoose, { connect } from "mongoose";

declare global {
	declare module "*.svg" {
		import { FC, SVGProps } from "react";

		const SVG: FC<SVGProps<SVGSVGElement>>;
		export default SVG;
	}

	interface NextResponseError {
		status: number;
		message: string;
	}

	 
	var mongoose: {
		promise: ReturnType<undefined | typeof connect>;
		conn: typeof _mongoose | null;
	};
}
