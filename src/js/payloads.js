// Builds the text that goes inside a QR code for each generator type.
// Pure functions with no DOM access, so they can be unit tested in Node.
import { isURL } from './utils.js';

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

// "example.com/menu" -> "https://example.com/menu" so phone cameras treat it
// as a link. Anything with a scheme, or anything that isn't a bare domain,
// is encoded exactly as typed.
export function normalizeLinkOrText(input = '') {
	const text = input.trim();
	if (!text) return '';
	if (SCHEME_RE.test(text)) return text;
	if (!/\s/.test(text) && isURL(text)) return `https://${text}`;
	return text;
}

// Wi-Fi QR format (ZXing "WIFI:" convention, read by iOS and Android
// cameras). These characters must be backslash-escaped in values.
export const escapeWifi = (value = '') => value.replace(/([\\;,:"])/g, '\\$1');

export function buildWifi({ ssid = '', password = '', security = 'WPA', hidden = false } = {}) {
	if (!ssid) return { error: 'Enter the Wi-Fi network name.' };
	const type = security === 'nopass' ? 'nopass' : security;
	if (type === 'WPA' && password.length < 8) {
		return { error: 'WPA/WPA2/WPA3 passwords are at least 8 characters.' };
	}
	if (type === 'WEP' && !password) return { error: 'Enter the Wi-Fi password.' };

	let text = `WIFI:T:${type};S:${escapeWifi(ssid)};`;
	if (type !== 'nopass') text += `P:${escapeWifi(password)};`;
	if (hidden) text += 'H:true;';
	return { text: `${text};` };
}

// UPI virtual payment address, e.g. name@okaxis or 9876543210@ybl.
export const UPI_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

// NPCI UPI deep link: upi://pay?pa=<id>&pn=<name>&am=<amount>&cu=INR&tn=<note>
export function buildUpi({ pa = '', pn = '', am = '', tn = '' } = {}) {
	const id = pa.trim();
	const name = pn.trim();
	if (!id) return { error: 'Enter your UPI ID.' };
	if (!UPI_ID_RE.test(id)) return { error: 'That UPI ID doesn’t look right. It should look like name@bank.' };
	if (!name) return { error: 'Enter the name that should appear to the payer.' };

	// The id is restricted to [A-Za-z0-9._-@] by UPI_ID_RE, so it is left
	// unencoded: some UPI apps fail to match "%40" in the payee address.
	const params = [`pa=${id}`, `pn=${encodeURIComponent(name)}`];

	const amountText = String(am).trim();
	if (amountText) {
		if (!/^\d+(\.\d{1,2})?$/.test(amountText) || Number(amountText) <= 0) {
			return { error: 'Amount must be a positive number with up to 2 decimals.' };
		}
		params.push(`am=${Number(amountText).toFixed(2)}`);
	}
	params.push('cu=INR');

	const note = tn.trim();
	if (note) params.push(`tn=${encodeURIComponent(note)}`);

	return { text: `upi://pay?${params.join('&')}` };
}
