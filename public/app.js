const serviceGrid = document.querySelector('#service-grid');
const contactForm = document.querySelector('#contact-form');
const contactStatus = document.querySelector('#contact-status');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
const siteLogout = document.querySelector('#site-logout');

function createServiceCard(service, index) {
  const card = document.createElement('article');
  card.className = 'service-card';

  const top = document.createElement('div');
  top.className = 'service-card-top';

  const number = document.createElement('span');
  number.className = 'service-card-index';
  number.textContent = String(index + 1).padStart(2, '0') + ' / NDS';

  const category = document.createElement('span');
  category.className = 'service-category';
  category.textContent = service.kategori;
  top.append(number, category);

  const title = document.createElement('h3');
  title.textContent = service.nama;

  const description = document.createElement('p');
  description.textContent = service.deskripsi;

  const glyph = document.createElement('span');
  glyph.className = 'service-glyph';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = ['↗', '✳', '◌', '⌁'][index % 4];

  card.append(top, title, description, glyph);
  return card;
}

async function loadServices() {
  try {
    const response = await fetch('/api/layanan');
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Layanan belum dapat dimuat.');

    serviceGrid.replaceChildren();
    if (!result.length) {
      const empty = document.createElement('p');
      empty.className = 'service-loading';
      empty.textContent = 'Layanan belum ditambahkan. Admin bisa menambahkannya dari area admin.';
      serviceGrid.append(empty);
      return;
    }

    result.forEach(function (service, index) {
      serviceGrid.append(createServiceCard(service, index));
    });
  } catch (_error) {
    const message = document.createElement('p');
    message.className = 'service-loading service-error';
    message.textContent = 'Layanan belum bisa dimuat. Pastikan server dan database sudah berjalan.';
    serviceGrid.replaceChildren(message);
  }
}

if (contactForm) {
  contactForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    contactStatus.textContent = '';
    contactStatus.classList.remove('is-error');

    if (!contactForm.reportValidity()) return;

    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');

    const data = Object.fromEntries(new FormData(contactForm).entries());
    try {
      const response = await fetch('/api/pesan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Pesan belum terkirim.');
      contactStatus.textContent = result.message;
      contactForm.reset();
    } catch (error) {
      contactStatus.textContent = error.message || 'Koneksi bermasalah. Coba lagi sebentar.';
      contactStatus.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
    }
  });
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', function () {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Buka navigasi' : 'Tutup navigasi');
    navLinks.classList.toggle('is-open', !isOpen);
  });

  navLinks.querySelectorAll('a, button').forEach(function (link) {
    link.addEventListener('click', function () {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Buka navigasi');
      navLinks.classList.remove('is-open');
    });
  });
}

if (siteLogout) {
  siteLogout.addEventListener('click', async function () {
    siteLogout.disabled = true;
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout belum berhasil.');
      window.location.replace('/akun.html');
    } catch (error) {
      window.alert(error.message || 'Koneksi bermasalah. Coba lagi sebentar.');
      siteLogout.disabled = false;
    }
  });
}

document.querySelector('#year').textContent = new Date().getFullYear();
loadServices();
