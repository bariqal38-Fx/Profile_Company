const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const HASH_BYTES = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, HASH_BYTES);
  return 'scrypt$' + salt + '$' + Buffer.from(key).toString('hex');
}

async function verifyPassword(password, storedHash) {
  const pieces = String(storedHash || '').split('$');
  if (pieces.length !== 3 || pieces[0] !== 'scrypt' ||
      !/^[a-f0-9]{32}$/.test(pieces[1]) ||
      !/^[a-f0-9]{128}$/.test(pieces[2])) {
    return false;
  }

  const actual = Buffer.from(await scrypt(password, pieces[1], HASH_BYTES));
  const expected = Buffer.from(pieces[2], 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = {
  hashPassword: hashPassword,
  verifyPassword: verifyPassword,
};
