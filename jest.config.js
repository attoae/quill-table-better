/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
    "^.+\\.svg$": "./src/tests/svgTransform.js"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!quill)/"
  ],
};