const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const loginStatus = document.querySelector('#login-status');
const registerStatus = document.querySelector('#register-status');
const tabLogin = document.querySelector('#tab-login');
const tabRegister = document.querySelector('#tab-register');
const formHeading = document.querySelector('#form-heading');
const formKicker = document.querySelector('#form-kicker');
const formDescription = document.querySelector('#form-description');

async function sendRequest(url, options) {
  const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Permintaan belum berhasil.');
  }
  return data;
}

function nextPage() {
  const requested = new URLSearchParams(window.location.search).get('next');
  if (requested && requested.startsWith('/') && !requested.startsWith('//')) {
    return requested;
  }
  return '/';
}

function setStatus(element, message, isError) {
  element.textContent = message || '';
  element.classList.toggle('is-error', Boolean(isError));
}

function setMode(mode) {
  const isLogin = mode === 'login';
  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;
  tabLogin.classList.toggle('is-active', isLogin);
  tabRegister.classList.toggle('is-active', !isLogin);
  tabLogin.setAttribute('aria-selected', String(isLogin));
  tabRegister.setAttribute('aria-selected', String(!isLogin));
  formHeading.textContent = isLogin ? 'Masuk ke akunmu.' : 'Buat akun baru.';
  formKicker.textContent = isLogin ? 'SELAMAT DATANG KEMBALI' : 'MULAI TERHUBUNG';
  formDescription.textContent = isLogin
    ? 'Lanjutkan percakapan dan jelajahi langkah berikutnya.'
    : 'Daftar menggunakan nama, email, dan password baru.';
  setStatus(loginStatus, '');
  setStatus(registerStatus, '');
}

async function checkAccount() {
  try {
    await sendRequest('/api/auth/me');
    window.location.replace(nextPage());
  } catch (_error) {
    setMode('login');
  }
}

tabLogin.addEventListener('click', function () { setMode('login'); });
tabRegister.addEventListener('click', function () { setMode('register'); });
document.querySelectorAll('[data-switch]').forEach(function (button) {
  button.addEventListener('click', function () {
    setMode(button.dataset.switch);
  });
});

loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  setStatus(loginStatus, '');
  if (!loginForm.reportValidity()) return;

  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const result = await sendRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value,
      }),
    });
    window.location.replace(nextPage());
  } catch (error) {
    setStatus(loginStatus, error.message, true);
  } finally {
    button.disabled = false;
  }
});

registerForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  setStatus(registerStatus, '');
  if (!registerForm.reportValidity()) return;

  const password = registerForm.elements.password.value;
  const confirmation = registerForm.elements.konfirmasi.value;
  if (password !== confirmation) {
    setStatus(registerStatus, 'Konfirmasi password belum sama.', true);
    registerForm.elements.konfirmasi.focus();
    return;
  }

  const button = registerForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const result = await sendRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: registerForm.elements.nama.value.trim(),
        email: registerForm.elements.email.value.trim(),
        password: password,
      }),
    });
    registerForm.reset();
    window.location.replace(nextPage());
  } catch (error) {
    setStatus(registerStatus, error.message, true);
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#year').textContent = String(new Date().getFullYear());
checkAccount();
