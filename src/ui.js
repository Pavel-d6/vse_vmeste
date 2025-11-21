// ui.js - Интерфейс
class UIManager {
    constructor(app) {
        this.app = app;
    }

    initNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pageId = e.target.dataset.page;
                this.showPage(pageId);
                
                // ДОБАВЛЕНО: загружаем фонды при переходе на страницу
                if (pageId === 'funds') {
                    this.app.api.loadFunds();
                }
            });
        });
    }

    showPage(pageId) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        const targetBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
        const targetPage = document.getElementById(`${pageId}-page`);
        
        if (targetBtn) targetBtn.classList.add('active');
        if (targetPage) targetPage.classList.add('active');
    }

    initButtons() {
        // УБРАНО: кнопка test-btn больше не нужна
        const addFundBtn = document.getElementById('add-fund-btn');
        if (addFundBtn) {
            addFundBtn.addEventListener('click', () => {
                this.showAddFundForm();
            });
        }
    }

    showAddFundForm() {
        const formHtml = `
            <form id="add-fund-form">
                <div class="form-group">
                    <label>Название фонда:</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea name="description" required></textarea>
                </div>
                <div class="form-group">
                    <label>Веб-сайт:</label>
                    <input type="url" name="website">
                </div>
                <div class="form-group">
                    <label>Контактный email:</label>
                    <input type="email" name="contact_email">
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button type="submit" class="btn-primary">Добавить фонд</button>
                </div>
            </form>
        `;
        
        this.showModal('Добавить фонд', formHtml);
        
        setTimeout(() => {
            const form = document.getElementById('add-fund-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.app.api.createFund(new FormData(e.target));
                });
            }
        }, 100);
    }

    initModal() {
        this.modal = document.getElementById('modal');
        if (this.modal) {
            const closeBtn = this.modal.querySelector('#modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideModal();
                });
            }
            
            // Закрытие по клику вне модального окна
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        }
    }

    showModal(title, content) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        if (modalTitle && modalBody && this.modal) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            this.modal.style.display = 'flex';
        }
    }

    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    updateStats() {
        const element = document.getElementById('requests-count');
        if (element) {
            element.textContent = `Заявок: ${this.app.helpRequests.length}`;
        }
    }

    displayFunds(funds) {
        const fundsList = document.getElementById('funds-list');
        if (!fundsList) return;

        if (!funds || funds.length === 0) {
            fundsList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border-radius: 12px;">
                    <p style="font-size: 1.2rem; color: #666; margin-bottom: 1rem;">📋 Пока нет благотворительных фондов</p>
                    <p style="color: #999;">Фонды появятся здесь после добавления</p>
                </div>
            `;
            return;
        }

        fundsList.innerHTML = funds.map(fund => `
            <div class="fund-card">
                ${fund.image_url ? `<img src="${fund.image_url}" alt="${fund.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">` : ''}
                <h3 style="margin-bottom: 0.5rem; color: #2c3e50;">${fund.name}</h3>
                <p style="color: #666; margin-bottom: 1rem; line-height: 1.5;">${fund.description}</p>
                <div style="border-top: 1px solid #eee; padding-top: 1rem; margin-top: 1rem;">
                    ${fund.website ? `<p style="margin-bottom: 0.5rem;"><a href="${fund.website}" target="_blank" style="color: #3498db; text-decoration: none;">🌐 Перейти на сайт</a></p>` : ''}
                    ${fund.contact_email ? `<p style="margin-bottom: 0.5rem; color: #666;">📧 ${fund.contact_email}</p>` : ''}
                    <p style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">Добавлен: ${new Date(fund.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
            </div>
        `).join('');
    }

    // Добавляем методы фильтрации
    initFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const urgencyFilter = document.getElementById('urgency-filter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (urgencyFilter) {
            urgencyFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    applyFilters() {
        const category = document.getElementById('category-filter')?.value;
        const urgency = document.getElementById('urgency-filter')?.value;
        
        let filtered = [...this.app.helpRequests];
        
        if (category) {
            filtered = filtered.filter(r => r.category === category);
        }
        
        if (urgency) {
            filtered = filtered.filter(r => r.urgency === urgency);
        }
        
        this.app.map.updateMapMarkers(filtered);
        
        // Обновляем счетчик
        const element = document.getElementById('requests-count');
        if (element) {
            element.textContent = `Заявок: ${filtered.length} из ${this.app.helpRequests.length}`;
        }
    }
}