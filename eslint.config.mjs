import nextVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".wrangler/**",
      "types/worker-bindings.d.ts",
    ],
  },
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default eslintConfig
