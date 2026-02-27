
const API = 'http://127.0.0.1:5000';

// ===== STATE =====
let token = localStorage.getItem('edu_token');
let userRole = localStorage.getItem('edu_role');
let selectedRole = 'student';

// ===== INIT =====
if (token && userRole) {
  loadDashboard();
}

// ===== PAGE NAVIGATION =====
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
}

// ===== TABS (Login / Register) =====
function setTab(tab) {
  document.getElementById('form-login').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('authTitle').textContent = tab === 'login' ? 'Welcome back'   : 'Create account';
  document.getElementById('authSub').textContent   = tab === 'login'
    ? 'Sign in to your account to continue'
    : 'Join EduPortal today';
}

// ===== ROLE TOGGLE =====
function setRole(r) {
  selectedRole = r;
  document.getElementById('roleStudent').classList.toggle('active', r === 'student');
  document.getElementById('roleTeacher').classList.toggle('active', r === 'teacher');
}

// ===== ALERT HELPER =====
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `alert ${type} show`;
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ===== LOADING STATE =====
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (loading) {
    btn._orig    = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled  = true;
  } else {
    btn.innerHTML = btn._orig || btn.innerHTML;
    btn.disabled  = false;
  }
}

// ===== LOGIN =====
async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    return showAlert('loginErr', 'Please fill all fields');
  }

  setLoading('loginBtn', true);
  try {
    const res  = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    token    = data.access_token;
    userRole = data.role;
    localStorage.setItem('edu_token', token);
    localStorage.setItem('edu_role', userRole);
    loadDashboard();
  } catch (e) {
    showAlert('loginErr', e.message);
  } finally {
    setLoading('loginBtn', false);
  }
}

// ===== REGISTER =====
async function doRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!name || !email || !password) {
    return showAlert('registerErr', 'Please fill all fields');
  }
  if (password.length < 6) {
    return showAlert('registerErr', 'Password must be at least 6 characters');
  }

  setLoading('registerBtn', true);
  try {
    const res  = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: selectedRole })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    showAlert('registerOk', '✓ Account created! Please login.', 'success');
    setTimeout(() => setTab('login'), 1500);
  } catch (e) {
    showAlert('registerErr', e.message);
  } finally {
    setLoading('registerBtn', false);
  }
}

// ===== DASHBOARD LOADER =====
async function loadDashboard() {
  updateNav(true);
  if (userRole === 'student') {
    showPage('student');
    await fetchStudentDashboard();
  } else {
    showPage('teacher');
    await fetchTeacherDashboard();
  }
}

// ===== STUDENT DASHBOARD =====
async function fetchStudentDashboard() {
  try {
    const res  = await fetch(`${API}/student/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    document.getElementById('studentName').textContent  = `Hello, ${data.name} 👋`;
    document.getElementById('studentEmail').textContent = data.email;

    if (data.roll_number) {
      document.getElementById('cardRoll').textContent = data.roll_number;
      document.getElementById('cardDept').textContent = data.department;
      document.getElementById('cardYear').textContent = `Year ${data.year}`;
      document.getElementById('profilePanel').style.display = 'none';
    }
  } catch (e) {
    console.error('Student dashboard error:', e);
  }
}

// ===== TEACHER DASHBOARD =====
async function fetchTeacherDashboard() {
  try {
    const res  = await fetch(`${API}/teacher/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    document.getElementById('teacherName').textContent  = `Hello, ${data.teacher_name} 👋`;
    document.getElementById('teacherEmail').textContent = data.teacher_email;

    const tbody = document.getElementById('studentTableBody');
    if (data.students && data.students.length > 0) {
      tbody.innerHTML = data.students.map((s, i) => `
        <tr>
          <td class="td-muted">${i + 1}</td>
          <td><strong>${s.name}</strong></td>
          <td class="td-muted">${s.email}</td>
          <td><code class="td-code">${s.roll_number}</code></td>
          <td>${s.department}</td>
          <td><span class="badge badge-student">Yr ${s.year}</span></td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Teacher dashboard error:', e);
  }
}

// ===== STUDENT PROFILE SUBMIT =====
async function submitStudentProfile() {
  const roll_number = document.getElementById('rollInput').value.trim();
  const department  = document.getElementById('deptInput').value.trim();
  const year        = document.getElementById('yearInput').value;

  if (!roll_number || !department || !year) {
    return showAlert('profileErr', 'Please fill all fields');
  }

  setLoading('profileBtn', true);
  try {
    const res  = await fetch(`${API}/student/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roll_number, department, year: parseInt(year) })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save profile');

    showAlert('profileOk', '✓ Profile saved!', 'success');
    setTimeout(() => fetchStudentDashboard(), 1000);
  } catch (e) {
    showAlert('profileErr', e.message);
  } finally {
    setLoading('profileBtn', false);
  }
}

// ===== TEACHER PROFILE SUBMIT =====
async function submitTeacherProfile() {
  const subject          = document.getElementById('subjectInput').value.trim();
  const experience_years = document.getElementById('expInput').value;

  if (!subject || !experience_years) {
    return showAlert('teacherProfileErr', 'Please fill all fields');
  }

  setLoading('teacherProfileBtn', true);
  try {
    const res  = await fetch(`${API}/teacher/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subject, experience_years: parseInt(experience_years) })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save profile');

    showAlert('teacherProfileOk', '✓ Profile saved!', 'success');
  } catch (e) {
    showAlert('teacherProfileErr', e.message);
  } finally {
    setLoading('teacherProfileBtn', false);
  }
}

// ===== LOGOUT =====
async function doLogout() {
  try {
    await fetch(`${API}/logout`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) { /* ignore */ }

  token    = null;
  userRole = null;
  localStorage.removeItem('edu_token');
  localStorage.removeItem('edu_role');
  updateNav(false);
  showPage('auth');
  setTab('login');
}

// ===== NAVBAR =====
function updateNav(loggedIn) {
  document.getElementById('navActions').innerHTML = loggedIn
    ? `<button class="btn btn-ghost" onclick="doLogout()">Logout</button>`
    : `
      <button class="btn btn-ghost" onclick="showPage('auth'); setTab('login')">Login</button>
      <button class="btn btn-primary" onclick="showPage('auth'); setTab('register')">Register</button>
    `;
}

// ===== KEYBOARD SUPPORT =====
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const activePage = document.querySelector('.page.active');
  if (!activePage || activePage.id !== 'page-auth') return;
  const loginVisible = document.getElementById('form-login').style.display !== 'none';
  loginVisible ? doLogin() : doRegister();
});