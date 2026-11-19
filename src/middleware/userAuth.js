const crypto = require('node:crypto');

const COOKIE_NAME = 'nusa_user';
const SESSION_SECONDS = 7 * 24 * 60 * 60;

function secret() {
  return (process.env.SESSION_SECRET || 'local-workshop-secret') + ':user-session';
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function issueToken(userId) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(String(userId) + ':' + expiresAt).toString('base64url');
  return payload + '.' + sign(payload);
}

function readToken(req) {
  const cookie = (req.headers.cookie || '').split(';').map(function (part) {
    return part.trim();
  }).find(function (part) {
    return part.startsWith(COOKIE_NAME + '=');
  });

  if (!cookie) return '';
  try {
    return decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
  } catch (_error) {
    return '';
  }
}

function verifyToken(token) {
  const pieces = token.split('.');
  if (pieces.length !== 2 || !safeEqual(sign(pieces[0]), pieces[1])) return null;

  let value;
  try {
    value = Buffer.from(pieces[0], 'base64url').toString('utf8');
  } catch (_error) {
    return null;
  }

  const separator = value.lastIndexOf(':');
  if (separator < 1) return null;
  const id = Number(value.slice(0, separator));
  const expiresAt = Number(value.slice(separator + 1));
  if (!Number.isInteger(id) || id < 1 ||
      !Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return { id: id };
}

function cookieHeader(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return COOKIE_NAME + '=' + encodeURIComponent(value) +
    '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + maxAge + secure;
}

function requireUser(req, res, next) {
  const user = verifyToken(readToken(req));
  if (!user) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu.' });
  }
  req.user = user;
  next();
}

function requireUserPage(req, res, next) {
  const user = verifyToken(readToken(req));
  if (!user) {
    return res.redirect('/akun.html?next=%2F');
  }
  req.user = user;
  next();
}

module.exports = {
  COOKIE_NAME: COOKIE_NAME,
  SESSION_SECONDS: SESSION_SECONDS,
  cookieHeader: cookieHeader,
  issueToken: issueToken,
  requireUser: requireUser,
  requireUserPage: requireUserPage,
};
