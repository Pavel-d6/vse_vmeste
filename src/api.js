// api.js - Работа с API

class ApiService {
    constructor(app) {
        this.app = app;
        this.backendUrl = 'http://127.0.0.1:8000/api';
    }

    async loadHelpRequests() {
        console.log('📥 Загружаем заявки...');
        try {
            const response = await fetch(`${this.backendUrl}/help-requests/`);
            if (response.ok) {
                const data = await response.json();
                this.app.helpRequests = data.results || data;
                this.app.ui.updateStats();
                console.log(`✅ Загружено ${this.app.helpRequests.length} заявок`);
                
                // Обновляем метки на карте
                if (this.app.map.isMapLoaded) {
                    this.app.map.updateMapMarkers();
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки заявок:', error);
            this.app.helpRequests = [];
            this.app.ui.updateStats();
        }
    }

    async createHelpRequest(requestData) {
        console.log('📝 Создаем заявку:', requestData);
        const token = this.app.auth.getAccessToken();
        
        if (!token) {
            throw new Error('Требуется авторизация');
        }
        
        try {
            const response = await fetch(`${this.backendUrl}/requests/create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Ошибка сервера:', errorData);
                throw new Error(errorData.detail || JSON.stringify(errorData));
            }

            const result = await response.json();
            console.log('✅ Заявка создана:', result);
            return result;

        } catch (error) {
            console.error('❌ Ошибка создания заявки:', error);
            throw error;
        }
    }

    async loadFunds() {
        console.log('📥 Загружаем фонды...');
        try {
            const response = await fetch(`${this.backendUrl}/funds/`);
            if (response.ok) {
                const data = await response.json();
                const funds = data.results || data;
                console.log(`✅ Загружено ${funds.length} фондов`);
                this.app.ui.displayFunds(funds);
            } else {
                console.error('❌ Ошибка загрузки фондов:', response.status);
                this.app.ui.displayFunds([]);
            }
        } catch (error) {
            console.error("❌ Ошибка загрузки фондов:", error);
            this.app.ui.displayFunds([]);
        }
    }

    async createFund(formData) {
        console.log('📝 Создаем фонд...');
        const token = this.app.auth.getAccessToken();
        
        if (!token) {
            this.app.ui.showModal('Ошибка', 'Требуется авторизация для добавления фонда');
            return;
        }
        
        try {
            const fundData = Object.fromEntries(formData.entries());
            
            const response = await fetch(`${this.backendUrl}/funds/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(fundData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка создания фонда');
            }

            const result = await response.json();
            console.log('✅ Фонд создан:', result);
            
            this.app.ui.hideModal();
            this.app.ui.showModal('Успех', '✅ Фонд успешно добавлен!');
            
            // Перезагружаем фонды
            await this.loadFunds();

        } catch (error) {
            console.error('❌ Ошибка создания фонда:', error);
            this.app.ui.showModal('Ошибка', '❌ ' + error.message);
        }
    }
}