module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: ["airbnb-base", "airbnb-typescript/base", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@stylistic/eslint-plugin-ts"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.eslint.json", "./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  rules: {
    indent: ["error", 2],
    "import/no-unresolved": "off",
    "import/prefer-default-export": "off",
    "import/extensions": ["warn", "never"],
    "comma-dangle": "off",
    "@typescript-eslint/comma-dangle": "off",
    "comma-style": ["error", "last"],
    "max-len": [
      "error",
      {
        code: 120,
        comments: 120,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
  },
  ignorePatterns: ["node_modules", ".git", "coverage", "dist"],
};
