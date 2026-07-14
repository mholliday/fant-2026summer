/**
 * Free-text donor search.
 *
 * Given a query string, finds donors that have that string — or a small
 * variation of it (a typo / minor spelling difference) — in any of their text
 * fields (e.g. "Exemplars Used", notes, identification). The current version's
 * `data` object is walked recursively, so the search is independent of the
 * exact form schema: add a field to a form and it becomes searchable for free.
 *
 * Matching, in order of strength:
 *   1. Case-insensitive substring of the whole query in a single field
 *      ("knife wound" in "a deep knife wound").
 *   2. Fuzzy, word-by-word: every query word must match some text word within a
 *      small Levenshtein edit distance scaled to the word length (so "exemplar"
 *      matches "exemplers"). For a multi-word query the words may appear
 *      anywhere — in any order, across any fields — not just as a phrase.
 *
 * This runs in JS rather than in the Mongo aggregation because fuzzy matching
 * can't be expressed there. The lab's dataset is small, so scanning current
 * version data per request is fine.
 */

/** Classic iterative Levenshtein edit distance (two-row, O(min) memory). */
const levenshtein = (a, b) => {
  a = String(a);
  b = String(b);
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost    // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
};

/**
 * Edit-distance tolerance for a term of the given length. Short terms allow no
 * (or few) edits to avoid matching almost anything; longer terms allow more.
 */
const maxDistFor = (len) => (len <= 3 ? 0 : len <= 5 ? 1 : len <= 8 ? 2 : 3);

/** Recursively collect every non-empty string value from a nested structure. */
const collectStrings = (value, out = []) => {
  if (value == null) return out;
  if (typeof value === "string") {
    if (value.trim()) out.push(value);
    return out;
  }
  if (typeof value !== "object") return out; // numbers, booleans, etc.
  if (Array.isArray(value)) {
    value.forEach((v) => collectStrings(v, out));
    return out;
  }
  Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
};

/** True if a single text word matches a query term (substring or fuzzy). */
const wordMatches = (word, term) =>
  word.includes(term) || levenshtein(word, term) <= maxDistFor(term.length);

/** Split a lowercased string into word tokens (letters/numbers), dropping the rest. */
const tokenize = (text) => text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/**
 * True if a single field's `text` matches `query`: either the whole query is a
 * substring, or every query word fuzzy-matches some word in the field (in any
 * order/position).
 */
const textMatches = (text, query) => {
  const t = String(text).toLowerCase();
  const q = String(query).toLowerCase().trim();
  if (!q) return false;
  if (t.includes(q)) return true;

  const terms = tokenize(q);
  const words = tokenize(t);
  if (!terms.length || !words.length) return false;
  return terms.every((term) => words.some((w) => wordMatches(w, term)));
};

/**
 * True if a donor matches the query. First tries the whole query as a substring
 * of any single field; otherwise every query word must appear (substring or
 * fuzzy) somewhere across the donor's text — in any order, spread across fields.
 */
const donorMatchesQuery = (donor, query) => {
  const q = String(query ?? "").toLowerCase().trim();
  if (!q) return false;

  const strings = collectStrings(donor && donor.data);
  if (!strings.length) return false;

  // Whole-query phrase inside one field.
  if (strings.some((s) => String(s).toLowerCase().includes(q))) return true;

  // Otherwise: all query words present somewhere across all fields.
  const terms = tokenize(q);
  if (!terms.length) return false;
  const words = [];
  for (const s of strings) words.push(...tokenize(String(s).toLowerCase()));
  return terms.every((term) => words.some((w) => wordMatches(w, term)));
};

/**
 * Filter a list of (already joined) donors by the query and paginate the result.
 * An empty/blank query returns the list unfiltered (just paginated).
 */
const searchDonors = (donors, query, page = 0, donorsPerPage = 10) => {
  const list = Array.isArray(donors) ? donors : [];
  const q = String(query ?? "").trim();
  const matched = q ? list.filter((d) => donorMatchesQuery(d, q)) : list;
  const start = Math.max(0, page) * donorsPerPage;
  return {
    donorsList: matched.slice(start, start + donorsPerPage),
    numDonors: matched.length,
  };
};

module.exports = {
  levenshtein,
  maxDistFor,
  collectStrings,
  wordMatches,
  tokenize,
  textMatches,
  donorMatchesQuery,
  searchDonors,
};
