// Hostname: dot-separated labels of 1-63 chars, alphabetic TLD. Every
// quantifier is bounded, so matching stays linear. (The previous regex nested
// `([a-z\d-]*[a-z\d])*` inside `(...)+`, which backtracked exponentially and
// froze the tab on long dot-less input such as a 40-character token.)
const HOST_RE = /^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}$/i;
const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

// True for http(s) links and bare domains like "example.com/menu".
export const isURL = (url = '') => {
	if (!url || typeof url !== 'string' || /\s/.test(url)) return false;

	let parsed;
	try {
		parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
	} catch (e) {
		return false;
	}

	// "user@example.com" is an email address, not a link.
	if (parsed.username || parsed.password) return false;

	const host = parsed.hostname;
	if (host.length > 253) return false;
	return IPV4_RE.test(host) || HOST_RE.test(host);
};
