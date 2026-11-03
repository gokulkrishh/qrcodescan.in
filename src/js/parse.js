// Classifies a scanned QR payload so the result screen can offer the right
// action (open, pay, call, copy password...). Pure, no DOM access.
import { isURL } from './utils.js';

function parseQuery(text) {
	const i = text.indexOf('?');
	return new URLSearchParams(i === -1 ? '' : text.slice(i + 1));
}

// Inverse of buildWifi: "WIFI:T:WPA;S:name;P:pass;H:true;;" with backslash
// escapes. Field order is not fixed.
export function parseWifi(text) {
	const fields = {};
	let key = '';
	let value = '';
	let inValue = false;
	let escaped = false;

	for (const ch of text.slice(5)) {
		if (escaped) {
			if (inValue) value += ch;
			else key += ch;
			escaped = false;
		} else if (ch === '\\') {
			escaped = true;
		} else if (!inValue) {
			if (ch === ':') inValue = true;
			else if (ch !== ';') key += ch;
		} else if (ch === ';') {
			fields[key.toUpperCase()] = value;
			key = '';
			value = '';
			inValue = false;
		} else {
			value += ch;
		}
	}
	if (inValue && key) fields[key.toUpperCase()] = value;

	const unquote = (v = '') => (v.length > 1 && v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v);
	return {
		ssid: unquote(fields.S),
		password: unquote(fields.P),
		security: fields.T || 'nopass',
		hidden: /^true$/i.test(fields.H || ''),
	};
}

function parseVcard(text) {
	// Unfold continuation lines (RFC 6350 §3.2) before reading properties.
	const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
	const get = (name) => {
		const line = lines.find((l) => l.toUpperCase().startsWith(name + ':') || l.toUpperCase().startsWith(name + ';'));
		return line ? line.slice(line.indexOf(':') + 1).trim() : '';
	};
	const n = get('N').split(';').filter(Boolean).reverse().join(' ');
	return { name: get('FN') || n, phone: get('TEL'), email: get('EMAIL'), org: get('ORG').replace(/;/g, ' ').trim() };
}

export function parseQR(raw = '') {
	const text = String(raw).trim();

	if (/^upi:\/\/pay\?/i.test(text)) {
		const q = parseQuery(text);
		return {
			type: 'upi',
			text,
			upi: { pa: q.get('pa') || '', pn: q.get('pn') || '', am: q.get('am') || '', tn: q.get('tn') || '' },
		};
	}

	if (/^WIFI:/i.test(text)) return { type: 'wifi', text, wifi: parseWifi(text) };

	if (/^BEGIN:VCARD/i.test(text)) return { type: 'vcard', text, vcard: parseVcard(text) };

	if (/^tel:/i.test(text)) return { type: 'tel', text, href: text, number: text.slice(4) };

	if (/^mailto:/i.test(text)) {
		return { type: 'email', text, href: text, address: decodeURIComponent(text.slice(7).split('?')[0]) };
	}

	// "SMSTO:number:message" is the common QR form; sms:number?body= also seen.
	const smsto = text.match(/^SMSTO:([^:]*):?([\s\S]*)$/i);
	if (smsto) {
		const body = smsto[2] ? `?body=${encodeURIComponent(smsto[2])}` : '';
		return { type: 'sms', text, href: `sms:${smsto[1]}${body}`, number: smsto[1] };
	}
	if (/^sms:/i.test(text)) return { type: 'sms', text, href: text, number: text.slice(4).split('?')[0] };

	const geo = text.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
	if (geo) {
		return {
			type: 'geo',
			text,
			href: `https://www.google.com/maps/search/?api=1&query=${geo[1]},${geo[2]}`,
		};
	}

	// Only http(s) links ever get an "Open" button, so payloads such as
	// javascript: or data: URLs are always shown as plain text.
	let href = null;
	if (/^https?:\/\//i.test(text)) href = text;
	else if (!/\s/.test(text) && isURL(text)) href = `https://${text}`;

	if (href) {
		try {
			const url = new URL(href);
			if (url.protocol === 'http:' || url.protocol === 'https:') {
				return {
					type: 'url',
					text,
					href: url.href,
					host: url.hostname,
					insecure: url.protocol === 'http:',
					// Punycode hosts can imitate other domains (homograph attacks).
					suspicious: url.hostname.split('.').some((label) => label.startsWith('xn--')),
				};
			}
		} catch (e) {
			// Not a parseable URL; fall through to plain text.
		}
	}

	return { type: 'text', text };
}
