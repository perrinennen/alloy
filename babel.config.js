module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: [
            "last 2 Chrome versions",
            "last 2 Firefox versions",
            "last 2 Safari versions",
            "Explorer >= 10"
          ]
        }
      }
    ]
  ],
  plugins: [
    [
      "@babel/plugin-transform-template-literals",
      {
        loose: true
      }
    ]
  ]
};