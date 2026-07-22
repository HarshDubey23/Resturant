import type { Config } from "jest";

const config: Config = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^#api/(.*)$": "<rootDir>/src/app/api/$1",
		"^#components/(.*)$": "<rootDir>/src/components/$1",
		"^#utils/(.*)$": "<rootDir>/src/utils/$1",
		"^#assets/(.*)$": "<rootDir>/src/assets/$1",
		"^#data/(.*)$": "<rootDir>/src/data/$1",
	},
	transform: {
		"^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
	},
};

export default config;
