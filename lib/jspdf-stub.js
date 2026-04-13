// Server-side stub for jspdf (browser-only library)
class jsPDF {
  addPage() { return this }
  addImage() { return this }
  save() {}
  output() { return null }
  setProperties() { return this }
}
module.exports = { jsPDF }
module.exports.default = module.exports
