// Built-in connectors. Add your own file here and list it below,
// or supply extra connectors at deploy time via the CONNECTORS_JSON variable.
import wikipedia from "./wikipedia.js";
import hackernews from "./hackernews.js";
import geocode from "./geocode.js";
import weather from "./weather.js";
import currency from "./currency.js";
import github from "./github.js";
import reader from "./reader.js";
import openlibrary from "./openlibrary.js";

export default [wikipedia, hackernews, geocode, weather, currency, github, reader, openlibrary];
