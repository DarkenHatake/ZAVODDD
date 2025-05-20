document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();

                // Проверяем роль пользователя
                if (result.user.role === 'admin') {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/';
                }
            } else {
                const error = await response.json();
                errorMessage.textContent = error.error || 'Ошибка входа';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'Произошла ошибка при входе';
            errorMessage.classList.remove('hidden');
        }
    });
});