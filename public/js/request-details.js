document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/');
    const requestId = pathParts[pathParts.length - 1];

    const requestNumber = document.getElementById('requestNumber');
    const machineName = document.getElementById('machineName');
    const serialNumber = document.getElementById('serialNumber');
    const issueDescription = document.getElementById('issueDescription');
    const urgencyLevel = document.getElementById('urgencyLevel');
    const requestStatus = document.getElementById('requestStatus');
    const contactName = document.getElementById('contactName');
    const contactPhone = document.getElementById('contactPhone');
    const contactEmail = document.getElementById('contactEmail');
    const createdAt = document.getElementById('createdAt');
    const updatedAt = document.getElementById('updatedAt');
    const newStatus = document.getElementById('newStatus');
    const updateStatusBtn = document.getElementById('updateStatusBtn');

    // Загрузка данных заявки
    async function loadRequestDetails() {
        try {
            const response = await fetch(`/api/requests/${requestId}`);
            if (!response.ok) {
                throw new Error('Заявка не найдена');
            }

            const request = await response.json();

            // Заполнение данных
            requestNumber.textContent = request.id;
            machineName.textContent = request.machine_name;
            serialNumber.textContent = request.serial_number || 'Не указан';
            issueDescription.textContent = request.issue_description;

            // Перевод статуса и срочности на русский
            const statusMap = {
                'pending': 'В ожидании',
                'in_progress': 'В работе',
                'completed': 'Завершено',
                'cancelled': 'Отменено'
            };

            const urgencyMap = {
                'low': 'Низкая',
                'medium': 'Средняя',
                'high': 'Высокая',
                'critical': 'Критическая'
            };

            urgencyLevel.textContent = urgencyMap[request.urgency_level];
            requestStatus.textContent = statusMap[request.status];
            contactName.textContent = request.contact_name;
            contactPhone.textContent = request.contact_phone;
            contactEmail.textContent = request.contact_email || 'Не указан';

            // Форматирование даты
            const createdDate = new Date(request.created_at);
            const updatedDate = new Date(request.updated_at);

            createdAt.textContent = createdDate.toLocaleString();
            updatedAt.textContent = updatedDate.toLocaleString();

            // Установка текущего статуса в селекторе
            newStatus.value = request.status;

        } catch (error) {
            console.error('Error loading request details:', error);
            alert(error.message);
        }
    }

    // Обновление статуса
    updateStatusBtn.addEventListener('click', async function() {
        try {
            const response = await fetch(`/api/requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: newStatus.value
                })
            });

            if (response.ok) {
                alert('Статус успешно обновлен');
                loadRequestDetails(); // Перезагружаем данные
            } else {
                throw new Error('Ошибка при обновлении статуса');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert(error.message);
        }
    });

    // Первоначальная загрузка
    loadRequestDetails();
});