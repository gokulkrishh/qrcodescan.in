import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLinkOrText, buildWifi, buildUpi, escapeWifi } from '../src/js/payloads.js';
import { parseQR, parseWifi } from '../src/js/parse.js';

test('normalizeLinkOrText adds https:// only to bare domains', () => {
	assert.equal(normalizeLinkOrText('  example.com/menu '), 'https://example.com/menu');
	assert.equal(normalizeLinkOrText('http://example.com'), 'http://example.com');
	assert.equal(normalizeLinkOrText('mailto:a@b.co'), 'mailto:a@b.co');
	assert.equal(normalizeLinkOrText('hello world'), 'hello world');
	assert.equal(normalizeLinkOrText(''), '');
});

test('buildWifi escapes special characters and round-trips through parseWifi', () => {
	const ssid = 'Café;Guest:"5G"\\';
	const password = 'p@ss;word,1';
	const { text, error } = buildWifi({ ssid, password, security: 'WPA', hidden: true });
	assert.equal(error, undefined);
	assert.equal(text, `WIFI:T:WPA;S:${escapeWifi(ssid)};P:${escapeWifi(password)};H:true;;`);
	assert.deepEqual(parseWifi(text), { ssid, password, security: 'WPA', hidden: true });
});

test('buildWifi validates input', () => {
	assert.ok(buildWifi({ ssid: '' }).error);
	assert.ok(buildWifi({ ssid: 'x', password: 'short', security: 'WPA' }).error);
	assert.equal(buildWifi({ ssid: 'Open', security: 'nopass', password: 'ignored' }).text, 'WIFI:T:nopass;S:Open;;');
});

test('buildUpi builds an NPCI deep link and round-trips through parseQR', () => {
	const { text } = buildUpi({ pa: 'sharma.store@okaxis', pn: 'Sharma & Sons', am: '250.5', tn: 'Order #42' });
	assert.equal(text, 'upi://pay?pa=sharma.store@okaxis&pn=Sharma%20%26%20Sons&am=250.50&cu=INR&tn=Order%20%2342');
	const parsed = parseQR(text);
	assert.equal(parsed.type, 'upi');
	assert.deepEqual(parsed.upi, { pa: 'sharma.store@okaxis', pn: 'Sharma & Sons', am: '250.50', tn: 'Order #42' });
});

test('buildUpi validates input', () => {
	assert.ok(buildUpi({ pa: '' }).error);
	assert.ok(buildUpi({ pa: 'not-an-id', pn: 'A' }).error);
	assert.ok(buildUpi({ pa: 'a1@ybl', pn: '' }).error);
	assert.ok(buildUpi({ pa: 'a1@ybl', pn: 'A', am: '-5' }).error);
	assert.ok(buildUpi({ pa: 'a1@ybl', pn: 'A', am: '1.234' }).error);
	assert.equal(buildUpi({ pa: '9876543210@ybl', pn: 'A' }).text, 'upi://pay?pa=9876543210@ybl&pn=A&cu=INR');
});

test('parseQR classifies links and only offers http(s) hrefs', () => {
	const url = parseQR('https://example.com/a?u=https://x.y/z');
	assert.equal(url.type, 'url');
	assert.equal(url.host, 'example.com');
	assert.equal(url.insecure, false);

	assert.equal(parseQR('example.com').href, 'https://example.com/');
	assert.equal(parseQR('http://example.com').insecure, true);
	assert.equal(parseQR('https://xn--pple-43d.com').suspicious, true);

	for (const unsafe of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'hello world', 'file:///etc/passwd']) {
		const r = parseQR(unsafe);
		assert.equal(r.type, 'text', unsafe);
		assert.equal(r.href, undefined, unsafe);
	}
});

test('parseQR handles tel, mailto, sms, geo and vCard', () => {
	assert.equal(parseQR('tel:+919876543210').type, 'tel');
	assert.equal(parseQR('mailto:hi@example.com?subject=Hi').address, 'hi@example.com');
	assert.equal(parseQR('SMSTO:+911234:Hello there').href, 'sms:+911234?body=Hello%20there');
	assert.equal(parseQR('geo:12.97,77.59').href, 'https://www.google.com/maps/search/?api=1&query=12.97,77.59');
	const card = parseQR('BEGIN:VCARD\nVERSION:3.0\nN:Kumar;Ravi\nTEL;TYPE=CELL:+911234\nEMAIL:r@k.in\nEND:VCARD');
	assert.equal(card.type, 'vcard');
	assert.deepEqual(card.vcard, { name: 'Ravi Kumar', phone: '+911234', email: 'r@k.in', org: '' });
});

test('isURL is linear-time on long input (ReDoS regression)', async () => {
	const { isURL } = await import('../src/js/utils.js');
	const t = Date.now();
	for (const s of ['x'.repeat(5000), 'a-'.repeat(3000) + '!', 'ab.'.repeat(2000) + '-']) assert.equal(isURL(s), false);
	assert.ok(Date.now() - t < 200, `took ${Date.now() - t}ms`);
	assert.equal(parseQR('A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0').type, 'text');
});

test('isURL accepts real links and rejects look-alikes', async () => {
	const { isURL } = await import('../src/js/utils.js');
	for (const ok of ['example.com', 'sub.example.co.in/path?q=1#x', 'https://a.io', 'http://192.168.1.1:8080/', 'example.com:8080/x']) {
		assert.equal(isURL(ok), true, ok);
	}
	for (const bad of ['hello', 'a.b', 'user@example.com', 'javascript:alert(1)', 'example.com hello', '']) {
		assert.equal(isURL(bad), false, bad);
	}
});
