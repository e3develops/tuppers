// Prefijos -webkit- para Safari antiguo (sticky, user-select, etc.)
module.exports = {
  plugins: {
    autoprefixer: { overrideBrowserslist: ['ios >= 12', 'safari >= 12'] },
  },
}
