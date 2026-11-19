const loginGate = document.querySelector('#login-gate');
const dashboard = document.querySelector('#admin-dashboard');
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');
const logoutButton = document.querySelector('#logout-button');
const serviceForm = document.querySelector('#service-form');
const serviceStatus = document.querySelector('#service-status');
const serviceList = document.querySelector('#service-list');
const messageList = document.querySelector('#message-list');
const serviceCount = document.querySelector('#service-count');
const serviceLabelCount = document.querySelector('#service-label-count');
const messageCount = document.querySelector('#message-count');
const dbStatus = document.querySelector('#db-status');
const cancelEdit = document.querySelector('#cancel-edit');
let editingId = null;

async function api(url, options) {
  const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(result && result.message ? result.message : 'Permintaan belum berhasil.');
    error.status = response.status;
    throw error;
  }
  return result;
}

function setStatus(element, message, isError) {
  element.textContent = message || '';
  element.classList.toggle('is-error', Boolean(isError));
}

function showDashboard() {
  loginGate.hidden = true;
  dashboard.hidden = false;
  logoutButton.hidden = false;
  document.querySelector('#today-date').textContent = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date());
  loadDashboard();
}

function showLogin() {
  loginGate.hidden = false;
  dashboard.hidden = true;
  logoutButton.hidden = true;
}

async function checkSession() {
  try {
    await api('/api/admin/me');
    showDashboard();
  } catch (_error) {
    showLogin();
    dbStatus.textContent = 'Belum login';
  }
}

async function loadDashboard() {
  await Promise.all([loadServices(), loadMessages(), checkDatabase()]);
}

async function checkDatabase() {
  try {
    const result = await api('/api/health');
    dbStatus.textContent = result.database === 'connected' ? 'Terhubung' : 'Periksa koneksi';
  } catch (_error) {
    dbStatus.textContent = 'Periksa koneksi';
  }
}

function makeAction(label, className, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = className || '';
  button.addEventListener('click', handler);
  return button;
}

async function loadServices() {
  try {
    const items = await api('/api/layanan');
    serviceCount.textContent = String(items.length).padStart(2, '0');
    serviceLabelCount.textContent = items.length + ' layanan';
    serviceList.replaceChildren();

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Belum ada layanan. Gunakan form untuk menambahkan layanan pertama.';
      serviceList.append(empty);
      return;
    }

    items.forEach(function (item) {
      const row = document.createElement('article');
      row.className = 'service-row';
      const copy = document.createElement('div');
      const category = document.createElement('span');
      category.className = 'mono';
      category.textContent = item.kategori.toUpperCase();
      const title = document.createElement('h4');
      title.textContent = item.nama;
      const description = document.createElement('p');
      description.textContent = item.deskripsi;
      copy.append(category, title, description);

      const actions = document.createElement('div');
      actions.className = 'row-actions';
      actions.append(
        makeAction('Ubah', '', function () { startEditing(item); }),
        makeAction('Hapus', 'delete-action', function () { deleteService(item.id); })
      );
      row.append(copy, actions);
      serviceList.append(row);
    });
  } catch (error) {
    serviceList.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = error.message;
    serviceList.append(empty);
  }
}

function startEditing(item) {
  editingId = item.id;
  serviceForm.elements.nama.value = item.nama;
  serviceForm.elements.kategori.value = item.kategori;
  serviceForm.elements.deskripsi.value = item.deskripsi;
  document.querySelector('#service-form-title').textContent = 'Ubah layanan';
  document.querySelector('#service-submit').innerHTML = 'Simpan perubahan <span aria-hidden="true">→</span>';
  cancelEdit.hidden = false;
  setStatus(serviceStatus, 'Sedang mengubah: ' + item.nama);
  serviceForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetServiceForm() {
  editingId = null;
  serviceForm.reset();
  document.querySelector('#service-form-title').textContent = 'Tambah layanan';
  document.querySelector('#service-submit').innerHTML = 'Simpan layanan <span aria-hidden="true">→</span>';
  cancelEdit.hidden = true;
  setStatus(serviceStatus, '');
}

async function deleteService(id) {
  const confirmed = window.confirm('Hapus layanan ini dari website?');
  if (!confirmed) return;
  try {
    await api('/api/layanan/' + id, { method: 'DELETE' });
    setStatus(serviceStatus, 'Layanan berhasil dihapus.');
    if (editingId === id) resetServiceForm();
    await loadServices();
  } catch (error) {
    setStatus(serviceStatus, error.message, true);
  }
}

async function loadMessages() {
  try {
    const items = await api('/api/admin/pesan');
    messageCount.textContent = String(items.length).padStart(2, '0');
    messageList.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Belum ada pesan. Pesan dari formulir website akan muncul di sini.';
      messageList.append(empty);
      return;
    }

    items.forEach(function (item) {
      const card = document.createElement('article');
      card.className = 'message-card';
      const content = document.createElement('div');
      const head = document.createElement('div');
      head.className = 'message-head';
      const name = document.createElement('h3');
      name.textContent = item.nama;
      const email = document.createElement('a');
      email.href = 'mailto:' + encodeURIComponent(item.email);
      email.textContent = item.email;
      head.append(name, email);
      const company = document.createElement('p');
      company.className = 'message-company';
      company.textContent = item.perusahaan || 'Tanpa nama bisnis';
      const body = document.createElement('p');
      body.className = 'message-text';
      body.textContent = item.pesan;
      content.append(head, company, body);

      const meta = document.createElement('div');
      meta.className = 'message-meta';
      const date = document.createElement('time');
      date.dateTime = item.created_at;
      date.textContent = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium', timeStyle: 'short',
      }).format(new Date(item.created_at));
      const status = document.createElement('select');
      status.setAttribute('aria-label', 'Status pesan dari ' + item.nama);
      ['baru', 'dibaca', 'ditangani'].forEach(function (value) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
        option.selected = item.status === value;
        status.append(option);
      });
      status.addEventListener('change', function () {
        updateMessageStatus(item.id, status.value);
      });
      const remove = makeAction('Hapus pesan', '', function () {
        deleteMessage(item.id);
      });
      meta.append(date, status, remove);
      card.append(content, meta);
      messageList.append(card);
    });
  } catch (error) {
    messageList.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = error.message;
    messageList.append(empty);
  }
}

async function updateMessageStatus(id, status) {
  try {
    await api('/api/admin/pesan/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status }),
    });
  } catch (error) {
    window.alert(error.message);
    await loadMessages();
  }
}

async function deleteMessage(id) {
  if (!window.confirm('Hapus pesan ini dari inbox?')) return;
  try {
    await api('/api/admin/pesan/' + id, { method: 'DELETE' });
    await loadMessages();
  } catch (error) {
    window.alert(error.message);
  }
}

loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  setStatus(loginStatus, '');
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await api('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginForm.elements.username.value,
        password: loginForm.elements.password.value,
      }),
    });
    loginForm.reset();
    showDashboard();
  } catch (error) {
    setStatus(loginStatus, error.message, true);
  } finally {
    button.disabled = false;
  }
});

serviceForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  setStatus(serviceStatus, '');
  if (!serviceForm.reportValidity()) return;

  const button = document.querySelector('#service-submit');
  button.disabled = true;
  const item = {
    nama: serviceForm.elements.nama.value.trim(),
    kategori: serviceForm.elements.kategori.value.trim(),
    deskripsi: serviceForm.elements.deskripsi.value.trim(),
  };

  try {
    const wasEditing = Boolean(editingId);
    await api(editingId ? '/api/layanan/' + editingId : '/api/layanan', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    resetServiceForm();
    setStatus(serviceStatus, wasEditing ? 'Layanan berhasil diperbarui.' : 'Layanan baru berhasil ditambahkan.');
    await loadServices();
  } catch (error) {
    setStatus(serviceStatus, error.message, true);
  } finally {
    button.disabled = false;
  }
});

cancelEdit.addEventListener('click', resetServiceForm);
logoutButton.addEventListener('click', async function () {
  try {
    await api('/api/admin/logout', { method: 'POST' });
  } finally {
    showLogin();
  }
});
document.querySelector('#refresh-messages').addEventListener('click', loadMessages);

checkSession();
