document.addEventListener('DOMContentLoaded', function() {
    const requestsTableBody = document.getElementById('requestsTableBody');
    const statusFilter = document.getElementById('statusFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');

    async function loadRequests() {
        try {
            const status = statusFilter.value === 'all' ? '' : `status=${statusFilter.value}`;
            const urgency = urgencyFilter.value === 'all' ? '' : `urgency_level=${urgencyFilter.value}`;

            let url = '/api/requests';
            const params = [status, urgency].filter(p => p).join('&');
            if (params) url += `?${params}`;

            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to load requests');

            const requests = await response.json();
            renderRequests(requests);
        } catch (error) {
            console.error('Error:', error);
            requestsTableBody.innerHTML = `<tr><td colspan="7">Ошибка загрузки: ${error.message}</td></tr>`;
        }
    }

    function renderRequests(requests) {
        requestsTableBody.innerHTML = '';

        if (requests.length === 0) {
            requestsTableBody.innerHTML = '<tr><td colspan="7">Нет заявок</td></tr>';
            return;
        }

        requests.forEach(request => {
            const row = document.createElement('tr');

            const urgencyMap = {
                low: 'Низкая',
                medium: 'Средняя',
                high: 'Высокая',
                critical: 'Критическая'
            };

            const statusMap = {
                pending: 'В ожидании',
                in_progress: 'В работе',
                completed: 'Завершено',
                cancelled: 'Отменено'
            };

            row.innerHTML = `
        <td>${request.id}</td>
        <td>${request.machine_name}</td>
        <td>${request.issue_description.substring(0, 50)}${request.issue_description.length > 50 ? '...' : ''}</td>
        <td>${urgencyMap[request.urgency_level] || request.urgency_level}</td>
        <td>${statusMap[request.status] || request.status}</td>
        <td>${new Date(request.created_at).toLocaleString()}</td>
        <td><a href="/request/${request.id}" class="view-btn">Просмотр</a></td>
      `;

            requestsTableBody.appendChild(row);
        });
    }

    statusFilter.addEventListener('change', loadRequests);
    urgencyFilter.addEventListener('change', loadRequests);

    // Первоначальная загрузка
    loadRequests();
});