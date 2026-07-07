const { encryptDESRaw } = require('./des');

// ─── ISO-0 (Format 0) PIN block ───────────────────────────────────────────────

function xorHexStrings(a, b) {
  if (a.length !== b.length) throw new Error(`xorHex: length mismatch (${a.length} vs ${b.length})`);
  let out = '';
  for (let i = 0; i < a.length; i += 2) {
    out += ((parseInt(a.substr(i, 2), 16) ^ parseInt(b.substr(i, 2), 16)) & 0xff)
      .toString(16).padStart(2, '0').toUpperCase();
  }
  return out;
}

/**
 * Build the cleartext ISO-0 PIN block hex from a clear PIN and device number.
 * Mirrors generatePinBlock() from the Java reference:
 *   pinBlock = "0" + len + PIN, padded with "F" to 16 chars
 *   PAN      = "0000" + deviceNumber[len-13 .. len-1]   (12 digits)
 *   result   = xorHex(pinBlock, PAN)
 */
function buildPinBlockHex(clearPin, deviceNumber) {
  if (!clearPin)     throw new Error('clearPin is required for this PIN-set endpoint');
  if (!deviceNumber) throw new Error('deviceNumber missing from payload (required for PIN block)');
  const pin = String(clearPin);
  const dev = String(deviceNumber);
  if (pin.length > 12)      throw new Error('PIN length not supported (max 12)');
  if (dev.length < 13)      throw new Error(`deviceNumber too short (need ≥13 chars, got ${dev.length})`);
  if (!/^\d+$/.test(pin))   throw new Error('PIN must be numeric');

  let pinBlock = '0' + pin.length + pin;
  while (pinBlock.length !== 16) pinBlock += 'F';

  const len = dev.length;
  const pan = '0000' + dev.substring(len - 13, len - 1);
  if (pan.length !== 16) throw new Error('PAN computation produced wrong length');

  return xorHexStrings(pinBlock, pan);
}

module.exports = { xorHexStrings, buildPinBlockHex, encryptDESRaw };
