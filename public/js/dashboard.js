document.addEventListener('DOMContentLoaded', function() {

    // Проверяем авторизацию
    fetch('/api/me', {
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                window.location.href = '/login';
            }
            return response.json();
        })
        .then(user => {
            if (user.role !== 'admin') {
                window.location.href = '/';
            }
            // Продолжаем загрузку данных
            loadRequests();
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            window.location.href = '/login';
        });
    const statusFilter = document.getElementById('statusFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');
    const requestsTableBody = document.getElementById('requestsTableBody');

    // Загрузка заявок
    async function loadRequests() {
        try {
            const status = statusFilter.value === 'all' ? '' : `status=${statusFilter.value}`;
            const urgency = urgencyFilter.value === 'all' ? '' : `urgency_level=${urgencyFilter.value}`;

            let query = '/api/requests';
            const params = [status, urgency].filter(p => p).join('&');
            if (params) query += `?${params}`;

            const response = await fetch(query);
            const requests = await response.json();

            renderRequests(requests);
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    }

    // Отрисовка заявок в таблице
    function renderRequests(requests) {
        requestsTableBody.innerHTML = '';

        if (requests.length === 0) {
            requestsTableBody.innerHTML = '<tr><td colspan="7">Нет заявок</td></tr>';
            return;
        }

        requests.forEach(request => {
            const row = document.createElement('tr');

            // Форматирование даты
            const createdAt = new Date(request.created_at).toLocaleString();

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

            row.innerHTML = `
        <td>${request.id}</td>
        <td>${request.machine_name}</td>
        <td>${request.issue_description.substring(0, 50)}${request.issue_description.length > 50 ? '...' : ''}</td>
        <td>${urgencyMap[request.urgency_level]}</td>
        <td>${statusMap[request.status]}</td>
        <td>${createdAt}</td>
        <td><a href="/request/${request.id}" class="view-btn">Просмотр</a></td>
      `;

            requestsTableBody.appendChild(row);
        });
    }

    // Обработчики фильтров
    statusFilter.addEventListener('change', loadRequests);
    urgencyFilter.addEventListener('change', loadRequests);

    // Первоначальная загрузка
    loadRequests();
});