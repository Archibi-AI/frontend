import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Architecture rules (Archibi-AI/documents architecture/04 §1). The `import`
// plugin is already registered by eslint-config-next, so only rules are added.
const boundaries = {
  rules: {
    "import/no-default-export": "error",
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          { target: "./src/shared", from: "./src/features", message: "shared must not depend on features" },
          { target: "./src/shared", from: "./src/app", message: "shared must not depend on app" },
          { target: "./src/features", from: "./src/app", message: "features must not depend on app routes" },
        ],
      },
    ],
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.name='fetch'] > Literal[value=/^https?:/]",
        message: "Absolute-URL fetch is only allowed in src/server/django, src/server/session/refresh.ts and src/server/ai-jobs/runner.ts.",
      },
      {
        selector: "CallExpression[callee.name='fetch'] > TemplateLiteral",
        message: "Build URLs only in src/server/django (djangoFetch) or the allowed server modules.",
      },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "error",
  },
};

const nextFileConventions = {
  files: [
    "src/app/**/{page,layout,route,not-found,error,global-error,loading,template,default}.tsx",
    "src/app/**/route.ts",
    "src/proxy.ts",
    "*.config.{ts,mjs}",
    "playwright.config.ts",
    "vitest.config.ts",
  ],
  rules: { "import/no-default-export": "off" },
};

const allowedFetchers = {
  files: ["src/server/django/**", "src/server/http/**", "src/server/session/refresh.ts", "src/server/ai-jobs/runner.ts", "tests/**", "src/test/**"],
  rules: { "no-restricted-syntax": "off" },
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  boundaries,
  nextFileConventions,
  allowedFetchers,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "tests/lint-fixtures/**", "playwright-report/**", "test-results/**", "coverage/**"]),
]);
