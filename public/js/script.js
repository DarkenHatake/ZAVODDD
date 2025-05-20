document.addEventListener('DOMContentLoaded', function() {
    const repairForm = document.getElementById('repairForm');
    const successMessage = document.getElementById('successMessage');
    const requestIdSpan = document.getElementById('requestId');

    repairForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(repairForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                requestIdSpan.textContent = result.id;
                repairForm.reset();
                successMessage.classList.remove('hidden');
            } else {
                alert('Ошибка при отправке заявки');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при отправке заявки');
        }
    });
});