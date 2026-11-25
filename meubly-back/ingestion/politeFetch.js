// Requetes "polies" vers les marchands : agent declare, robots.txt, 1 requete / 2 s par hote.
// Aucun contournement : un refus leve BlockedError et la collecte de ce marchand s'arrete.

const CHALLENGE_MARKERS = /captcha|datadome|cf-chl/i;
const RETRY_DELAY_MS = 60_000;
const MAX_RETRIES = 3;

export class BlockedError extends Error {
  constructor(message) {
    super(message);
    this.name = "BlockedError";
  }
}

export class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} ${url}`);
    this.name = "HttpError";
    this.status = status;
  }
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Regles Allow/Disallow pour PrixoliBot : son propre groupe s'il existe, sinon le groupe "*". */
function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const match = raw
      .replace(/#.*/, "")
      .trim()
      .match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "user-agent") {
      if (!lastWasAgent) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (current && value && (key === "allow" || key === "disallow")) {
        current.rules.push({ allow: key === "allow", path: value });
      }
    }
  }
  const own = groups.filter((group) => group.agents.includes("prixolibot"));
  const chosen = own.length ? own : groups.filter((group) => group.agents.includes("*"));
  return chosen.flatMap((group) => group.rules);
}

/** Motif robots.txt ("*" = n'importe quoi, "$" final = fin d'URL) en expression reguliere. */
function toRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped.replace(/\\\$$/, "$")}`);
}

/** La regle la plus longue qui correspond l'emporte ; a egalite, Allow gagne. */
function isAllowed(rules, path) {
  let best = null;
  for (const rule of rules) {
    if (!toRegex(rule.path).test(path)) continue;
    const longer = !best || rule.path.length > best.path.length;
    const tieAllow = best && rule.path.length === best.path.length && rule.allow;
    if (longer || tieAllow) best = rule;
  }
  return !best || best.allow;
}

/**
 * Cree une fonction qui lit une URL marchande et renvoie son corps texte.
 * Rien ne part sur le reseau avant le premier appel.
 * @param {{ botUrl?: string, delayMs?: number, fetchImpl?: typeof fetch, sleep?: (ms: number) => Promise<void> }} [options]
 * @returns {(url: string) => Promise<string>}
 */
export function createPoliteFetch({
  botUrl = "https://github.com/Sacha200/meubly",
  delayMs = 2000,
  fetchImpl = fetch,
  sleep = defaultSleep,
} = {}) {
  const headers = { "User-Agent": `PrixoliBot/1.0 (+${botUrl})` };
  const visitedHosts = new Set();
  const robotsByOrigin = new Map();

  async function request(url) {
    const { host } = new URL(url);
    if (visitedHosts.has(host)) await sleep(delayMs);
    visitedHosts.add(host);
    return fetchImpl(url, { headers });
  }

  async function requestWithRetry(url) {
    for (let attempt = 0; ; attempt++) {
      const response = await request(url);
      if (response.status !== 429 || attempt === MAX_RETRIES) return response;
      await sleep(RETRY_DELAY_MS);
    }
  }

  async function robotsRules(origin) {
    if (!robotsByOrigin.has(origin)) {
      const response = await requestWithRetry(`${origin}/robots.txt`);
      robotsByOrigin.set(origin, response.ok ? parseRobots(await response.text()) : []);
    }
    return robotsByOrigin.get(origin);
  }

  return async function politeFetch(url) {
    const { origin, pathname, search } = new URL(url);
    if (!isAllowed(await robotsRules(origin), pathname + search)) {
      throw new BlockedError(`Interdit par robots.txt : ${url}`);
    }
    const response = await requestWithRetry(url);
    const body = await response.text();
    if (response.status === 403 || (body.length < 20_000 && CHALLENGE_MARKERS.test(body))) {
      throw new BlockedError(`Acces refuse (${response.status}) : ${url}`);
    }
    if (!response.ok) throw new HttpError(response.status, url);
    return body;
  };
}
