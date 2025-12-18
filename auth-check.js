// Скрипт для проверки авторизации и изменения ссылок "Профиль"

// Функция для проверки, авторизован ли пользователь
function isUserLoggedIn() {
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    return userId !== null && userId !== undefined && userId !== '';
}

// Функция для обновления ссылок "Профиль" на странице
function updateProfileLinks() {
    // Ищем все ссылки с текстом "Профиль" или с href="reg.html"/"prof.html"
    const allLinks = document.querySelectorAll('a');
    
    allLinks.forEach(link => {
        const linkText = link.textContent.trim().toLowerCase();
        const href = link.getAttribute('href');
        
        // Обновляем ссылки, которые ведут на профиль
        if (linkText === 'профиль' || href === 'reg.html' || href === 'prof.html') {
            if (isUserLoggedIn()) {
                // Если пользователь авторизован, ссылка ведет на профиль
                link.setAttribute('href', 'prof.html');
            } else {
                // Если не авторизован, ссылка ведет на страницу входа
                link.setAttribute('href', 'reg.html');
            }
        }
    });
}

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateProfileLinks();
});

// Экспортируем функцию для использования в других скриптах
if (typeof window !== 'undefined') {
    window.isUserLoggedIn = isUserLoggedIn;
    window.updateProfileLinks = updateProfileLinks;
}

