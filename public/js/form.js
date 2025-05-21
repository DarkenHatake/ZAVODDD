document.addEventListener('DOMContentLoaded', function() {
    const repairForm = document.getElementById('repairForm');
    const successMessage = document.getElementById('successMessage');
    const requestIdSpan = document.getElementById('requestId');

    if (repairForm) {
        repairForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = {
                machine_name: document.getElementById('machine_name').value,
                serial_number: document.getElementById('serial_number').value,
                issue_description: document.getElementById('issue_description').value,
                urgency_level: document.getElementById('urgency_level').value,
                contact_name: document.getElementById('contact_name').value,
                contact_phone: document.getElementById('contact_phone').value,
                contact_email: document.getElementById('contact_email').value
            };

            try {
                const response = await fetch('/api/requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    requestIdSpan.textContent = result.id;
                    repairForm.reset();
                    successMessage.classList.remove('hidden');
                } else {
                    const error = await response.json();
                    alert('Ошибка: ' + (error.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при отправке заявки');
            }
        });
    }
});