module.exports = {
  ascending: (a, b) => {
    if (a.size < b.size || b.size === undefined) { return -1; }
    if (a.size > b.size) { return 1; }
    return 0;
  },
  descending: (a, b) => {
    if (a.size > b.size || b.size === undefined) { return -1; }
    if (a.size < b.size) { return 1; }
    return 0;
  }
}