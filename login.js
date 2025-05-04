document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const userEmail = userCredential.user.email;
      const isAdmin = userEmail === "ronellbradley@bradleyvs.com";

      if (isAdmin) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "customer-dashboard.html";
      }
    })
    .catch(error => {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    });
});
