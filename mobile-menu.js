// Современный скрипт для мобильного меню (гамбургер)
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли header на странице
    const header = document.querySelector('header');
    if (!header) return;
    
    // Проверяем, нет ли уже гамбургер-меню
    if (document.querySelector('.hamburger')) return;
    
    // Получаем все ссылки из header
    const headerLinks = header.querySelectorAll('a');
    if (headerLinks.length === 0) return;
    
    // Создаем гамбургер-кнопку
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Открыть меню');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    
    // Создаем мобильное меню
    const mobileMenu = document.createElement('nav');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.setAttribute('aria-label', 'Навигационное меню');
    
    // Копируем ссылки в мобильное меню
    headerLinks.forEach((link, index) => {
        const menuLink = link.cloneNode(true);
        menuLink.style.display = 'block';
        menuLink.style.opacity = '0';
        menuLink.style.transform = 'translateX(20px)';
        menuLink.style.transition = `all 0.3s ease ${index * 0.05}s`;
        mobileMenu.appendChild(menuLink);
    });
    
    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    
    // Добавляем элементы в DOM
    header.appendChild(hamburger);
    document.body.appendChild(mobileMenu);
    document.body.appendChild(overlay);
    
    // Функция открытия меню
    function openMenu() {
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        mobileMenu.classList.add('active');
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Анимация появления ссылок
        setTimeout(() => {
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.style.opacity = '1';
                link.style.transform = 'translateX(0)';
            });
        }, 50);
    }
    
    // Функция закрытия меню
    function closeMenu() {
        // Анимация исчезновения ссылок
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.style.opacity = '0';
            link.style.transform = 'translateX(20px)';
        });
        
        setTimeout(() => {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }, 200);
    }
    
    // Функция переключения меню
    function toggleMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (mobileMenu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    // Обработчики событий
    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);
    
    // Закрываем меню при клике на ссылку
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });
    
    // Закрываем меню по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Закрываем меню при изменении размера окна (если стали больше 767px)
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 767 && mobileMenu.classList.contains('active')) {
                closeMenu();
            }
        }, 250);
    });
    
    // Предотвращаем скролл фона при открытом меню на мобильных
    mobileMenu.addEventListener('touchmove', function(e) {
        const menuScrollTop = mobileMenu.scrollTop;
        const menuHeight = mobileMenu.offsetHeight;
        const menuScrollHeight = mobileMenu.scrollHeight;
        const touch = e.touches[0];
        const scrollTop = menuScrollTop;
        
        // Если скроллим вверх от начала меню или вниз от конца
        if ((scrollTop === 0 && touch.clientY > e.touches[0].clientY) ||
            (scrollTop + menuHeight >= menuScrollHeight && touch.clientY < e.touches[0].clientY)) {
            e.preventDefault();
        }
    }, { passive: false });
});
