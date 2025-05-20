document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(registerForm);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Пароли не совпадают';
            errorMessage.classList.remove('hidden');
            return;
        }

        const data = {
            username: formData.get('username'),
            password: password
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                registerForm.reset();
                errorMessage.classList.add('hidden');
                successMessage.classList.remove('hidden');
            } else {
                const error = await response.json();
                errorMessage.textContent = error.error || 'Ошибка регистрации';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'Произошла ошибка при регистрации';
            errorMessage.classList.remove('hidden');
        }
    });
});