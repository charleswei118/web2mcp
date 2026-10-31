// Tiny zero-dependency XML -> JSON converter for `response: "xml"` connectors.
// Good enough for API payloads (Atom, RSS, arXiv, PubMed...): elements, attributes,
// text, CDATA and entities. Not a validating parser: no DTDs, no external entities.
//
// Mapping:
//   <a>text</a>                      -> { a: "text" }
//   <a x="1">text</a>                -> { a: { "@x": "1", "#text": "text" } }
//   <a><b>1</b><b>2</b></a>          -> { a: { b: ["1", "2"] } }   (repeats become arrays)
//   <atom:link href="..."/>          -> { link: { "@href": "..." } } (namespace prefixes dropped)
//   <empty/>                         -> { empty: "" }

const ENTITIES = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const local = (name) => name.slice(name.indexOf(":") + 1);

function addChild(obj, key, value) {
  if (!(key in obj)) obj[key] = value;
  else if (Array.isArray(obj[key])) obj[key].push(value);
  else obj[key] = [obj[key], value];
}

/** Collapse an element node into its JSON value. */
function finish(node) {
  const text = node.text.join("").trim();
  const keys = Object.keys(node.obj);
  if (!keys.length) return text;
  if (text) node.obj["#text"] = text;
  return node.obj;
}

const ATTR_RE = /([^\s=/]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

/** Parse an XML string into a plain JSON object keyed by the root element name. */
export function xmlToJson(xml) {
  if (typeof xml !== "string") throw new Error("xmlToJson expects a string");
  const root = { name: "#root", obj: {}, text: [] };
  const stack = [root];
  let i = 0;
  const n = xml.length;
  while (i < n) {
    const lt = xml.indexOf("<", i);
    const top = stack[stack.length - 1];
    if (lt < 0) {
      top.text.push(decodeEntities(xml.slice(i)));
      break;
    }
    if (lt > i) top.text.push(decodeEntities(xml.slice(i, lt)));

    if (xml.startsWith("<!--", lt)) {
      const end = xml.indexOf("-->", lt + 4);
      i = end < 0 ? n : end + 3;
    } else if (xml.startsWith("<![CDATA[", lt)) {
      const end = xml.indexOf("]]>", lt + 9);
      top.text.push(xml.slice(lt + 9, end < 0 ? n : end));
      i = end < 0 ? n : end + 3;
    } else if (xml.startsWith("<?", lt)) {
      const end = xml.indexOf("?>", lt + 2);
      i = end < 0 ? n : end + 2;
    } else if (xml.startsWith("<!", lt)) {
      // DOCTYPE and other declarations (internal subsets are skipped, never expanded).
      let depth = 0;
      let j = lt + 2;
      for (; j < n; j++) {
        if (xml[j] === "[") depth++;
        else if (xml[j] === "]") depth--;
        else if (xml[j] === ">" && depth <= 0) break;
      }
      i = j + 1;
    } else if (xml[lt + 1] === "/") {
      const end = xml.indexOf(">", lt);
      if (end < 0) throw new Error("Malformed XML: unterminated closing tag");
      const name = local(xml.slice(lt + 2, end).trim());
      if (stack.length < 2 || stack[stack.length - 1].name !== name) {
        throw new Error(`Malformed XML: unexpected </${name}>`);
      }
      const node = stack.pop();
      addChild(stack[stack.length - 1].obj, name, finish(node));
      i = end + 1;
    } else {
      // Opening tag: find its end while respecting quoted attribute values.
      let j = lt + 1;
      let quote = null;
      for (; j < n; j++) {
        const c = xml[j];
        if (quote) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === ">") break;
      }
      if (j >= n) throw new Error("Malformed XML: unterminated tag");
      let body = xml.slice(lt + 1, j);
      const selfClosing = body.endsWith("/");
      if (selfClosing) body = body.slice(0, -1);
      const m = /^[^\s/>]+/.exec(body);
      if (!m) throw new Error("Malformed XML: empty tag name");
      const name = local(m[0]);
      const node = { name, obj: {}, text: [] };
      for (const a of body.slice(m[0].length).matchAll(ATTR_RE)) {
        const key = a[1];
        if (key === "xmlns" || key.startsWith("xmlns:")) continue;
        node.obj["@" + local(key)] = decodeEntities(a[3] ?? a[4]);
      }
      if (selfClosing) addChild(top.obj, name, finish(node));
      else stack.push(node);
      i = j + 1;
    }
  }
  if (stack.length !== 1) throw new Error(`Malformed XML: <${stack[stack.length - 1].name}> is not closed`);
  return root.obj;
}
