// js/api.js (для серверной части)

class ServerAPI {
    constructor() {
        this.baseURL = '/api';
    }

    // Сохранение данных на сервере
    async saveData(data) {
        try {
            const response = await fetch(`${this.baseURL}/save-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Ошибка сохранения данных');
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения на сервере:', error);
            throw error;
        }
    }

    // Загрузка данных с сервера
    async loadData() {
        try {
            const response = await fetch(`${this.baseURL}/get-data`);
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Ошибка загрузки данных');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки с сервера:', error);
            throw error;
        }
    }
}

