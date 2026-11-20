const serviceGrid = document.querySelector('#service-grid');
const requestStatus = document.querySelector('#request-status');
const myRequestList = document.querySelector('#my-request-list');
const contactForm = document.querySelector('#contact-form');
const contactStatus = document.querySelector('#contact-status');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
const siteLogout = document.querySelector('#site-logout');
let previousRequestStatuses = null;

function statusLabel(status) {
  return {
    menunggu: 'Menunggu verifikasi',
    diverifikasi: 'Terverifikasi',
    ditolak: 'Belum dapat diproses',
  }[status] || status;
}

function showRequestMessage(message, isError) {
  requestStatus.textContent = message || '';
  requestStatus.classList.toggle('is-error', Boolean(isError));
}

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

  const choose = document.createElement('button');
  choose.className = 'service-card-action';
  choose.type = 'button';
  choose.textContent = 'Ajukan layanan';
  choose.setAttribute('aria-label', 'Ajukan layanan ' + service.nama);
  choose.addEventListener('click', function () {
    requestService(choose, service);
  });

  card.append(top, title, description, glyph, choose);
  return card;
}

function createRequestCard(item) {
  const card = document.createElement('article');
  card.className = 'my-request-card';
  const content = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = item.nama_layanan;
  const note = document.createElement('p');
  note.textContent = item.catatan || 'Tidak ada catatan tambahan.';
  const date = document.createElement('time');
  date.dateTime = item.created_at;
  date.textContent = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(item.created_at));
  content.append(title, note, date);

  const status = document.createElement('span');
  status.className = 'request-status-badge status-' + item.status;
  status.textContent = statusLabel(item.status);
  card.append(content, status);
  return card;
}

async function loadMyRequests(announceChanges) {
  try {
    const response = await fetch('/api/permintaan-layanan/saya');
    const items = await response.json();
    if (!response.ok) throw new Error(items.message || 'Status permintaan belum bisa dimuat.');

    if (previousRequestStatuses && announceChanges) {
      items.forEach(function (item) {
        const previous = previousRequestStatuses.get(item.id);
        if (previous && previous !== item.status) {
          showRequestMessage('Pembaruan: permintaan ' + item.nama_layanan + ' kini berstatus ' +
            statusLabel(item.status).toLowerCase() + '.', false);
        }
      });
    }

    previousRequestStatuses = new Map(items.map(function (item) {
      return [item.id, item.status];
    }));
    myRequestList.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'request-empty';
      empty.textContent = 'Belum ada permintaan. Pilih layanan di atas untuk memulai.';
      myRequestList.append(empty);
      return;
    }
    items.forEach(function (item) {
      myRequestList.append(createRequestCard(item));
    });
  } catch (error) {
    myRequestList.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'request-empty is-error';
    empty.textContent = error.message || 'Koneksi bermasalah. Coba muat ulang status.';
    myRequestList.append(empty);
  }
}

async function requestService(button, service) {
  button.disabled = true;
  button.textContent = 'Mengirim…';
  showRequestMessage('', false);
  try {
    const response = await fetch('/api/permintaan-layanan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layananId: service.id }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Permintaan layanan belum terkirim.');
    showRequestMessage(result.message, false);
    await loadMyRequests(false);
  } catch (error) {
    showRequestMessage(error.message || 'Koneksi bermasalah. Coba lagi sebentar.', true);
  } finally {
    button.disabled = false;
    button.textContent = 'Ajukan layanan';
  }
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
document.querySelector('#refresh-my-requests').addEventListener('click', function () {
  loadMyRequests(true);
});
loadServices();
loadMyRequests(false);
window.setInterval(function () {
  loadMyRequests(true);
}, 30000);
