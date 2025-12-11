document.addEventListener('DOMContentLoaded', function() {
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', function(event) {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            localStorage.setItem('name', name);
            localStorage.setItem('email', email);
            window.location.href = 'profil.html';
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Предотвращаем перезагрузку страницы

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;

            // Сохраняем данные в localStorage
            localStorage.setItem('name', name);
            localStorage.setItem('email', email);

            // Переходим на страницу профиля
            window.location.href = 'prof.html';
        });
    } else {
        console.error('Кнопка "Регистрация" не найдена!');
    }
});