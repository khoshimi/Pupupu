const API_BASE_URL = 'http://localhost:3000/api';

const getStoredValue = (key) => sessionStorage.getItem(key) || localStorage.getItem(key);

// Функция для получения userId из хранилища
function getUserId() {
    return getStoredValue('userId');
}

function getUserEmail() {
    return getStoredValue('userEmail');
}

// Функция для загрузки работ из API
async function loadWorks() {
    const userId = getUserId();
    if (!userId) {
        return [];
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/works/user/${userId}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки работ');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
        return [];
    }
}

// Функция для отображения работ
async function displayWorks() {
    const works = await loadWorks();
    const container = document.getElementById('worksContainer');
    
    if (works.length === 0) {
        container.innerHTML = '<p class="no-works">У вас пока нет работ. Добавьте первую работу!</p>';
        return;
    }
    
    container.innerHTML = works.map((work) => `
        <div class="work-card">
            <div class="work-header">
                <h3 class="work-title">${escapeHtml(work.title)}</h3>
                <button class="delete-btn" onclick="deleteWork(${work.id})" title="Удалить работу">
                    <ion-icon name="close-circle-outline"></ion-icon>
                </button>
            </div>
            ${work.image_url ? `<img src="${work.image_url}" alt="${escapeHtml(work.title)}" class="work-image">` : ''}
            <p class="work-description">${escapeHtml(work.description)}</p>
            <div class="work-tags">
                ${work.tags.map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}
            </div>
            <div class="work-gallery">
                <span class="gallery-badge">Галерея: ${getGalleryName(work.gallery)}</span>
            </div>
        </div>
    `).join('');
}

// Функция для получения названия галереи
function getGalleryName(gallery) {
    const galleryNames = {
        'gd': 'ГД',
        'il': 'ИЛ',
        'wd': 'ВД',
        'zj': 'ЗЖ'
    };
    return galleryNames[gallery] || gallery;
}

// Функция для экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Функция для удаления работы
async function deleteWork(workId) {
    if (confirm('Вы уверены, что хотите удалить эту работу?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/works/${workId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления работы');
            }
            
            await displayWorks();
        } catch (error) {
            console.error('Ошибка удаления работы:', error);
            alert('Ошибка при удалении работы');
        }
    }
}

// Функция для загрузки данных пользователя
async function loadUserData() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/user/id/${userId}`);
        if (response.ok) {
            const user = await response.json();
            if (user.avatar_url) {
                document.getElementById('profileAvatar').src = user.avatar_url;
            }
            if (user.email) {
                document.getElementById('profileEmail').value = user.email;
                document.getElementById('profileEmail').classList.add('has-value');
                // Сохраняем email, чтобы он не пропал при перезагрузке
                localStorage.setItem('userEmail', user.email);
            }
            // Не храним пароль, просто показываем заглушку
            document.getElementById('profilePassword').value = '********';
            document.getElementById('profilePassword').classList.add('has-value');
        }
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
    }
}

// Функция для обновления аватара
async function updateAvatar(file) {
    const userId = getUserId();
    if (!userId) {
        alert('Сначала войдите в систему');
        return;
    }
    
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('avatar', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/avatar`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка загрузки аватара');
        }
        
        const result = await response.json();
        if (result.avatar_url) {
            document.getElementById('profileAvatar').src = result.avatar_url;
            alert('Фото профиля успешно обновлено!');
        }
    } catch (error) {
        console.error('Ошибка обновления аватара:', error);
        alert('Ошибка при загрузке фото: ' + error.message);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы модального окна
    const modal = document.getElementById('workModal');
    const addBtn = document.getElementById('addWorkBtn');
    const closeBtn = document.querySelector('.close');
    const form = document.getElementById('workForm');
    const imageInput = document.getElementById('workImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImage');
    const avatarInput = document.getElementById('avatarInput');
    
    // Проверяем, что пользователь авторизован
    const userId = getUserId();
    if (!userId) {
        alert('Сначала войдите в систему');
        window.location.href = 'reg.html';
        return;
    }

    // Подставляем email, если сохранили его после логина
    const storedEmail = getUserEmail();
    if (storedEmail) {
        document.getElementById('profileEmail').value = storedEmail;
        document.getElementById('profileEmail').classList.add('has-value');
    }

    // Загружаем данные пользователя (включая аватар)
    loadUserData();
    
    // Обработка загрузки аватара
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Проверяем размер файла (макс 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Размер файла не должен превышать 5MB');
                    return;
                }
                
                // Показываем предпросмотр
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('profileAvatar').src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Загружаем на сервер
                updateAvatar(file);
            }
        });
    }
    
    // Предпросмотр изображения
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Удаление изображения
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            imageInput.value = '';
            imagePreview.style.display = 'none';
            previewImg.src = '';
        });
    }
    
    // Открытие модального окна
    if (addBtn) {
        addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
        });
    }
    
    // Закрытие модального окна
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            form.reset();
            imagePreview.style.display = 'none';
            previewImg.src = '';
            // Сбрасываем классы для label
            document.querySelectorAll('#workForm .inputbox input, #workForm .inputbox textarea, #workForm .inputbox select').forEach(input => {
                input.classList.remove('has-value');
            });
        });
    }
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            form.reset();
            imagePreview.style.display = 'none';
            previewImg.src = '';
            document.querySelectorAll('#workForm .inputbox input, #workForm .inputbox textarea, #workForm .inputbox select').forEach(input => {
                input.classList.remove('has-value');
            });
        }
    });
    
    // Обработка отправки формы
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('workTitle').value.trim();
            const description = document.getElementById('workDescription').value.trim();
            const tagsInput = document.getElementById('workTags').value.trim();
            const gallery = document.getElementById('workGallery').value;
            const imageFile = imageInput.files[0];
            
            if (!title || !description || !tagsInput || !gallery) {
                alert('Пожалуйста, заполните все обязательные поля');
                return;
            }
            
            // Разделяем теги по запятой и очищаем от пробелов
            const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            if (tags.length === 0) {
                alert('Пожалуйста, добавьте хотя бы один тег');
                return;
            }
            
            // Создаем FormData для отправки файла
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('tags', tags.join(','));
            formData.append('gallery', gallery);
            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/works`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка добавления работы');
                }
                
                const result = await response.json();
                alert('Работа успешно добавлена!');
                
                // Обновляем отображение
                await displayWorks();
                
                // Закрываем модальное окно и очищаем форму
                modal.style.display = 'none';
                form.reset();
                imagePreview.style.display = 'none';
                previewImg.src = '';
                document.querySelectorAll('#workForm .inputbox input, #workForm .inputbox textarea, #workForm .inputbox select').forEach(input => {
                    input.classList.remove('has-value');
                });
            } catch (error) {
                console.error('Ошибка добавления работы:', error);
                alert('Ошибка при добавлении работы: ' + error.message);
            }
        });
    }
    
    // Обработка фокуса для textarea, input и select (для анимации label)
    document.querySelectorAll('#workForm .inputbox input, #workForm .inputbox textarea, #workForm .inputbox select').forEach(input => {
        input.addEventListener('focus', function() {
            if (this.value.trim() !== '' || this.tagName === 'SELECT') {
                this.classList.add('has-value');
            }
        });
        
        input.addEventListener('blur', function() {
            if (this.value.trim() === '' && this.tagName !== 'SELECT') {
                this.classList.remove('has-value');
            } else if (this.tagName === 'SELECT' && this.value !== '') {
                this.classList.add('has-value');
            }
        });
        
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
        
        input.addEventListener('change', function() {
            if (this.value.trim() !== '' || (this.tagName === 'SELECT' && this.value !== '')) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
    
    // Отображаем работы при загрузке
    displayWorks();
});
