/*
 * Sanity-check: encrypt a known payload with a fixed DES key and verify
 * that DES output + ASN wrapper match what the Python script would produce.
 * We can't reproduce the random DES key, but we can verify the deterministic
 * pieces by replacing the key generator.
 */
const crypto = require('crypto');

// Inline the same helpers (copied minus randomness) ─────────────────────────
function doPadding(data) {
  const r = data.length % 8;
  return r === 0 ? data : data + 'F'.repeat(8 - r);
}

function encryptDES(plaintext, desKeyBuf, mode) {
  const padded = doPadding(plaintext);
  const raw = Buffer.from(padded, 'utf8');
  const algo = desKeyBuf.length === 24 ? 'des-ede3' : 'des-ede';
  const cipher = crypto.createCipheriv(algo, desKeyBuf, null);
  cipher.setAutoPadding(false);
  const enc = Buffer.concat([cipher.update(raw), cipher.final()]);
  return mode === 'HEX' ? enc.toString('hex').toUpperCase() : enc.toString('base64');
}

function decryptDES(b64, desKeyBuf) {
  const enc = Buffer.from(b64, 'base64');
  const algo = desKeyBuf.length === 24 ? 'des-ede3' : 'des-ede';
  const dec = crypto.createDecipheriv(algo, desKeyBuf, null);
  dec.setAutoPadding(false);
  const out = Buffer.concat([dec.update(enc), dec.final()]);
  return out.toString('utf8').replace(/F+$/, '');
}

function buildAsn(keyHex, keyLen, ivHex) {
  return keyLen === 168
    ? '302C0418' + keyHex + '0410' + ivHex
    : '30240410' + keyHex.substring(0, 32) + '0410' + ivHex;
}

// Test 1: Round-trip DES encrypt/decrypt ────────────────────────────────────
const fixedKey = Buffer.from('0123456789ABCDEFFEDCBA98765432100123456789ABCDEF', 'hex'); // 24 bytes
const payload = '{"formFactorType":"CPI","timestamp":"1716000000000"}';
const enc = encryptDES(payload, fixedKey, 'STRING');
const dec = decryptDES(enc, fixedKey);
console.log('Test 1: DES round-trip');
console.log('  input :', payload);
console.log('  enc   :', enc);
console.log('  dec   :', dec);
console.log('  match :', dec === payload ? 'PASS' : 'FAIL');
console.log();

// Test 2: Padding behaviour ─────────────────────────────────────────────────
console.log('Test 2: Padding');
console.log('  len 7  padded:', JSON.stringify(doPadding('1234567')),  '(expect "1234567F")');
console.log('  len 8  padded:', JSON.stringify(doPadding('12345678')), '(expect "12345678", no padding)');
console.log('  len 9  padded:', JSON.stringify(doPadding('123456789')),'(expect "123456789FFFFFFF")');
console.log();

// Test 3: ASN.1 wrapper ─────────────────────────────────────────────────────
const IV = '99999999999999999999999999999999';
const wrap168 = buildAsn('AA'.repeat(24), 168, IV);
const wrap112 = buildAsn('BB'.repeat(24), 112, IV);
console.log('Test 3: ASN wrapper');
console.log('  168-bit:', wrap168);
console.log('    expect length =', (8 + 48 + 4 + 32), ' got =', wrap168.length);
console.log('  112-bit:', wrap112);
console.log('    expect length =', (8 + 32 + 4 + 32), ' got =', wrap112.length);
console.log();

// Test 4: RSA encrypt and check it's the right size ─────────────────────────
const PUB = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvZB/Tcg5aVFzYo7XcRzSSTU0ToQkoVLRm3eTHx+bDx1nBC8TrTVM62JfKAhWfEMJQZ+m0/IhT4pt0JRmUDdWvEPegD/OezOXUOEWuw5Vp0+maUNzPusz2gW4ezKXQ0i3R0/fTK2/wGDsYS3bwm1bbrPJA6XL+EYkQAjUZ81eHxpsrIS1BUQo4dqkotJeltKMvSDod96O3fxSssmjw+QXblPbeIV9NzoBVJMICMTpYOAtN55VAyu73Ukes2WvEntxflAeRv0cK4xUkVzuCG2X1YMXBtCpmdP0rrGb7ngnBIiVnl0/nuAALlkw58thZ63ue/2bJQ8kiJMr0IzRZndN3QIDAQAB';
const pem = '-----BEGIN PUBLIC KEY-----\n' + PUB.match(/.{1,64}/g).join('\n') + '\n-----END PUBLIC KEY-----\n';
const rsaEnc = crypto.publicEncrypt(
  { key: pem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha1' },
  Buffer.from(wrap168, 'hex')
);
console.log('Test 4: RSA OAEP-SHA1');
console.log('  ciphertext bytes:', rsaEnc.length, '(expect 256 for 2048-bit key)');
console.log('  base64 head     :', rsaEnc.toString('base64').slice(0, 60), '...');
