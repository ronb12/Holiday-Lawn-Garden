document.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.initializeFirebase();
    const e = document.getElementById('email'),
      a = document.getElementById('password'),
      t = document.getElementById('login-form'),
      s = document.getElementById('googleSignIn'),
      i = document.getElementById('loading-overlay'),
      n = document.getElementById('error-container'),
      o = (e = 'Loading...') => {
        if (i) {
          const a = document.getElementById('loading-message');
          a && (a.textContent = e), (i.style.display = 'flex');
        }
      },
      r = () => {
        i && (i.style.display = 'none');
      },
      l = e => {
        if (n) {
          const a = document.createElement('div');
          (a.className = 'error-message'),
            (a.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${e}`),
            (n.innerHTML = ''),
            n.appendChild(a),
            setTimeout(() => {
              a.remove();
            }, 5e3);
        }
      },
      c = e => {
        if (n) {
          const a = document.createElement('div');
          (a.className = 'success-message'),
            (a.innerHTML = `<i class="fas fa-check-circle"></i> ${e}`),
            (n.innerHTML = ''),
            n.appendChild(a);
        }
      };
    t &&
      t.addEventListener('submit', async t => {
        t.preventDefault(), o('Signing in...'), l('');
        const s = e.value.trim(),
          i = a.value.trim();
        if (!s || !i) return l('Please enter both email and password'), void r();
        try {
          const e = await firebase.auth().signInWithEmailAndPassword(s, i);
          c('Login successful! Redirecting...'),
            localStorage.setItem(
              'user',
              JSON.stringify({
                uid: e.user.uid,
                email: e.user.email,
                displayName: e.user.displayName,
              })
            ),
            setTimeout(() => {
              window.location.href = '/customer-dashboard.html';
            }, 1e3);
        } catch (e) {
          let a = 'Failed to sign in. ';
          switch (e.code) {
            case 'auth/user-not-found':
              a += 'No account found with this email.';
              break;
            case 'auth/wrong-password':
              a += 'Incorrect password.';
              break;
            case 'auth/invalid-email':
              a += 'Invalid email format.';
              break;
            case 'auth/user-disabled':
              a += 'This account has been disabled.';
              break;
            case 'auth/too-many-requests':
              a += 'Too many failed attempts. Please try again later';
              break;
            default:
              a += e.message;
          }
          l(a);
        } finally {
          r();
        }
      }),
      s &&
        s.addEventListener('click', async () => {
          o('Signing in with Google...'), l('');
          try {
            const e = await firebase.auth().signInWithPopup(window.googleProvider);
            c('Login successful! Redirecting...'),
              localStorage.setItem(
                'user',
                JSON.stringify({
                  uid: e.user.uid,
                  email: e.user.email,
                  displayName: e.user.displayName,
                  photoURL: e.user.photoURL,
                })
              ),
              setTimeout(() => {
                window.location.href = '/customer-dashboard.html';
              }, 1e3);
          } catch (e) {
            let a = 'Failed to sign in with Google. ';
            switch (e.code) {
              case 'auth/popup-blocked':
                a += 'Please allow popups for this site.';
                break;
              case 'auth/popup-closed-by-user':
                a += 'Sign-in was cancelled.';
                break;
              case 'auth/cancelled-popup-request':
                a += 'Please try again.';
                break;
              case 'auth/account-exists-with-different-credential':
                a +=
                  'An account already exists with the same email address but different sign-in credentials.';
                break;
              case 'auth/network-request-failed':
                a += 'Network error. Please check your internet connection.';
                break;
              default:
                a += e.message;
            }
            l(a);
          } finally {
            r();
          }
        });
    const d = document.querySelector('.toggle-password');
    d &&
      d.addEventListener('click', () => {
        const e = 'password' === a.type ? 'text' : 'password';
        a.type = e;
        const t = d.querySelector('i');
        t.classList.toggle('fa-eye'), t.classList.toggle('fa-eye-slash');
      });
  } catch (e) {
    const a = document.getElementById('error-container');
    a &&
      (a.innerHTML =
        '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Failed to initialize the application. Please refresh the page.</div>');
  }
});
