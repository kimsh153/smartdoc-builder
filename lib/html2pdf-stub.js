// Server-side stub for html2pdf.js (browser-only library)
// Used by turbopack resolveAlias to prevent SSR bundling errors
module.exports = function html2pdf() {
  const api = {
    set: () => api,
    from: () => api,
    save: () => Promise.resolve(),
    outputPdf: () => Promise.resolve(null),
    output: () => Promise.resolve(null),
  }
  return api
}
module.exports.default = module.exports
