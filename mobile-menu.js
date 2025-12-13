// Современный скрипт для мобильного меню (гамбургер)
(function() {
    'use strict';
    
    let menuInitialized = false;
    
    function initMobileMenu() {
        // Предотвращаем повторную инициализацию
        if (menuInitialized) {
            return;
        }
        
        // Проверяем, есть ли header на странице
        const header = document.querySelector('header');
        if (!header) {
            console.log('[Mobile Menu] Header не найден');
            return;
        }
        
        // Проверяем, нет ли уже гамбургер-меню
        if (document.querySelector('.hamburger')) {
            console.log('[Mobile Menu] Гамбургер уже существует');
            menuInitialized = true;
            return;
        }
        
        // Получаем все ссылки из header
        const headerLinks = Array.from(header.querySelectorAll('a'));
        if (headerLinks.length === 0) {
            console.log('[Mobile Menu] Ссылки в header не найдены');
            return;
        }
        
        console.log('[Mobile Menu] Найдено ссылок:', headerLinks.length);
        
        // Создаем гамбургер-кнопку
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.type = 'button';
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
        try {
            header.appendChild(hamburger);
            document.body.appendChild(mobileMenu);
            document.body.appendChild(overlay);
            console.log('[Mobile Menu] Элементы добавлены в DOM');
        } catch (e) {
            console.error('[Mobile Menu] Ошибка при добавлении элементов:', e);
            return;
        }
        
        // Функция открытия меню
        function openMenu() {
            console.log('[Mobile Menu] Открытие меню');
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
            console.log('[Mobile Menu] Закрытие меню');
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
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            const isActive = mobileMenu.classList.contains('active');
            console.log('[Mobile Menu] Переключение меню, текущее состояние:', isActive);
            
            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        }
        
        // Обработчики событий
        hamburger.addEventListener('click', function(e) {
            console.log('[Mobile Menu] Клик по гамбургеру');
            toggleMenu(e);
        }, false);
        
        // Также добавляем обработчик touchstart для мобильных
        hamburger.addEventListener('touchend', function(e) {
            console.log('[Mobile Menu] Touch по гамбургеру');
            e.preventDefault();
            toggleMenu(e);
        }, false);
        
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
        }, false);
        
        // Закрываем меню при клике на ссылку
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('[Mobile Menu] Клик по ссылке в меню');
                closeMenu();
            }, false);
        });
        
        // Закрываем меню по ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMenu();
            }
        }, false);
        
        // Закрываем меню при изменении размера окна (если стали больше 767px)
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 767 && mobileMenu.classList.contains('active')) {
                    closeMenu();
                }
            }, 250);
        }, false);
        
        menuInitialized = true;
        console.log('[Mobile Menu] Инициализация завершена успешно');
    }
    
    // Запускаем инициализацию
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        // DOM уже загружен
        initMobileMenu();
    }
    
    // Также пробуем инициализировать после небольшой задержки на случай, если скрипт загрузился раньше
    setTimeout(initMobileMenu, 100);
})();
