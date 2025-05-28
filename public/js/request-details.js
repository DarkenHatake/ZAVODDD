document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = window.location.pathname.split('/').pop();
    const statusUpdateSection = document.getElementById('statusUpdateSection');

    async function loadRequestDetails() {
        try {
            const response = await fetch(`/api/requests/${requestId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Заявка не найдена');
            }

            const request = await response.json();

            // Заполняем данные
            document.getElementById('requestNumber').textContent = request.id;
            document.getElementById('machineName').textContent = request.machine_name;
            document.getElementById('serialNumber').textContent = request.serial_number || 'Не указан';
            document.getElementById('issueDescription').textContent = request.issue_description;
            document.getElementById('urgencyLevel').textContent = getUrgencyText(request.urgency_level);
            document.getElementById('requestStatus').textContent = getStatusText(request.status);
            document.getElementById('contactName').textContent = request.contact_name;
            document.getElementById('contactPhone').textContent = request.contact_phone;
            document.getElementById('contactEmail').textContent = request.contact_email || 'Не указан';

            // Форматируем даты
            const createdDate = new Date(request.created_at);
            const updatedDate = new Date(request.updated_at);
            document.getElementById('createdAt').textContent = createdDate.toLocaleString();
            document.getElementById('updatedAt').textContent = updatedDate.toLocaleString();

            // Показываем секцию обновления статуса только для админа
            statusUpdateSection.style.display = 'block';
            document.getElementById('newStatus').value = request.status;

        } catch (error) {
            console.error('Error loading request details:', error);
            document.getElementById('requestDetails').innerHTML =
                `<div class="error">Ошибка загрузки данных: ${error.message}</div>`;
            statusUpdateSection.style.display = 'none';
        }
    }

    // Вспомогательные функции для перевода значений
    function getUrgencyText(level) {
        const levels = {
            low: 'Низкая',
            medium: 'Средняя',
            high: 'Высокая',
            critical: 'Критическая'
        };
        return levels[level] || level;
    }

    function getStatusText(status) {
        const statuses = {
            pending: 'В ожидании',
            in_progress: 'В работе',
            completed: 'Завершено',
            cancelled: 'Отменено'
        };
        return statuses[status] || status;
    }

    // Обработчик обновления статуса
    document.getElementById('updateStatusBtn')?.addEventListener('click', async function() {
        const newStatus = document.getElementById('newStatus').value;

        try {
            const response = await fetch(`/api/requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Статус успешно обновлен');
                loadRequestDetails(); // Перезагружаем данные
            } else {
                throw new Error('Ошибка обновления статуса');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Ошибка при обновлении статуса: ' + error.message);
        }
    });

    // Загружаем данные при открытии страницы
    loadRequestDetails();
});