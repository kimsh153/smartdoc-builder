// Server-side stub for html2canvas (browser-only library)
function html2canvas() {
  return Promise.resolve({ toDataURL: () => '', width: 0, height: 0 })
}
module.exports = html2canvas
module.exports.default = html2canvas
