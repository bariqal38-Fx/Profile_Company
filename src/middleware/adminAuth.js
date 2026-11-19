const crypto = require('node:crypto');

const COOKIE_NAME = 'nusa_admin';
const SESSION_SECONDS = 8 * 60 * 60;

function sign(value) {
  return crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'local-workshop-secret')
    .update(value)
    .digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function issueToken(username) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(username + ':' + expiresAt).toString('base64url');
  return payload + '.' + sign(payload);
}

function readToken(req) {
  const header = req.headers.cookie || '';
  const cookie = header.split(';').map(function (part) {
    return part.trim();
  }).find(function (part) {
    return part.startsWith(COOKIE_NAME + '=');
  });

  return cookie ? decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)) : '';
}

function verifyToken(token) {
  const pieces = token.split('.');
  if (pieces.length !== 2) return null;

  const payload = pieces[0];
  if (!safeEqual(sign(payload), pieces[1])) return null;

  let decoded;
  try {
    decoded = Buffer.from(payload, 'base64url').toString('utf8');
  } catch (_error) {
    return null;
  }

  const separator = decoded.lastIndexOf(':');
  if (separator < 1) return null;

  const username = decoded.slice(0, separator);
  const expiresAt = Number(decoded.slice(separator + 1));
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return username;
}

function cookieHeader(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return COOKIE_NAME + '=' + encodeURIComponent(value) +
    '; HttpOnly; SameSite=Strict; Path=/; Max-Age=' + maxAge + secure;
}

function requireAdmin(req, res, next) {
  const username = verifyToken(readToken(req));
  if (!username || !safeEqual(username, process.env.ADMIN_USERNAME || 'admin')) {
    return res.status(401).json({ message: 'Silakan login sebagai admin terlebih dahulu.' });
  }

  req.admin = { username: username };
  next();
}

module.exports = {
  COOKIE_NAME: COOKIE_NAME,
  SESSION_SECONDS: SESSION_SECONDS,
  cookieHeader: cookieHeader,
  issueToken: issueToken,
  requireAdmin: requireAdmin,
  safeEqual: safeEqual,
};
