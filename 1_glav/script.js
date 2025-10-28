document.addEventListener('DOMContentLoaded', function() {
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselList = document.querySelector('.carousel-list');
    const slides = document.querySelectorAll('.carousel-slide');
    const slideCount = slides.length;
    const paginationContainer = document.querySelector('.carousel-pagination');
    const slideWidth = 220;
    let currentIndex = 0;

    let isTransitioning = false;

    // Клонируем первый и последний слайд для зацикливания
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slideCount - 1].cloneNode(true);

    carouselList.appendChild(firstClone);
    carouselList.insertBefore(lastClone, slides[0]);

    const allSlides = document.querySelectorAll('.carousel-slide');
    const allSlideCount = allSlides.length;

    let initialTranslate = -slideWidth;

    carouselList.style.transform = `translateX(${initialTranslate}px)`;

    function updateCarousel() {
        if (isTransitioning) return;
        isTransitioning = true;

        allSlides.forEach(slide => slide.classList.remove('active'));
        allSlides[currentIndex + 1].classList.add('active');

        const translateX = -(currentIndex + 1) * slideWidth + (carouselContainer.offsetWidth - slideWidth) / 2;
        carouselList.style.transform = `translateX(${translateX}px)`;

        updatePagination();

        setTimeout(() => {isTransitioning = false;}, 500); // Время анимации (transition) в CSS
    }

    function initPagination() {
        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('span');
            dot.classList.add('pagination-dot');
            dot.dataset.index = i;
            dot.addEventListener('click', function() {
                if (isTransitioning) return; // Предотвращаем новые переходы во время анимации
                currentIndex = parseInt(this.dataset.index);
                updateCarousel();
            });
            paginationContainer.appendChild(dot);
        }
        updatePagination();
    }

    function updatePagination() {
        const dots = document.querySelectorAll('.pagination-dot');
        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentIndex].classList.add('active');
    }

    // Функция для переключения слайда при нажатии на картинку
    allSlides.forEach(function(slide, index) {
        slide.addEventListener('click', function() {
            if (isTransitioning) return; // Предотвращаем новые переходы во время анимации
            if (index === 0) { // Нажали на клонированный последний слайд
                currentIndex = slideCount - 1;
            } else if (index === allSlideCount - 1) { // Нажали на клонированный первый слайд
                currentIndex = 0;
            } else {
                currentIndex = index - 1;
            }
            updateCarousel();
        });
    });

    // Функция "зацикливания" карусели
    carouselList.addEventListener('transitionend', () => {
        if (currentIndex < 0) {
            carouselList.style.transition = 'none';
            currentIndex = slideCount - 1;
            updateCarousel();
            carouselList.offsetHeight;
            carouselList.style.transition = 'transform 0.5s ease-in-out';

        } else if (currentIndex >= slideCount) {
            carouselList.style.transition = 'none';
            currentIndex = 0;
            updateCarousel();
            carouselList.offsetHeight;
            carouselList.style.transition = 'transform 0.5s ease-in-out';
        }
    });

    initPagination();
    updateCarousel();
});