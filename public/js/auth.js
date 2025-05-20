document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        userGreeting: document.getElementById('userGreeting'),
        loginLink: document.getElementById('loginLink'),
        registerLink: document.getElementById('registerLink'),
        logoutLink: document.getElementById('logoutLink'),
        adminLink: document.getElementById('adminLink'),
        authError: document.getElementById('authError'),
        authLoader: document.getElementById('authLoader'),
        repairForm: document.getElementById('repairForm'),
        loginPrompt: document.getElementById('loginPrompt')
    };

    async function checkAuth() {
        try {
            elements.authLoader?.classList.remove('hidden');
            elements.authError?.classList.add('hidden');

            const response = await fetch('/api/me', {
                credentials: 'include'
            });

            if (response.ok) {
                const user = await response.json();
                elements.userGreeting.textContent = `Привет, ${user.username}`;

                // Показываем/скрываем элементы
                elements.loginLink?.classList.add('hidden');
                elements.registerLink?.classList.add('hidden');
                elements.logoutLink?.classList.remove('hidden');
                elements.repairForm?.classList.remove('hidden');
                elements.loginPrompt?.classList.add('hidden');

                if (user.role === 'admin') {
                    elements.adminLink?.classList.remove('hidden');
                }
            } else {
                // Не авторизован
                elements.loginLink?.classList.remove('hidden');
                elements.registerLink?.classList.remove('hidden');
                elements.logoutLink?.classList.add('hidden');
                elements.adminLink?.classList.add('hidden');
                elements.repairForm?.classList.add('hidden');
                elements.loginPrompt?.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            elements.authError?.classList.remove('hidden');
            elements.authError.textContent = 'Ошибка проверки авторизации';
        } finally {
            elements.authLoader?.classList.add('hidden');
        }
    }

    elements.logoutLink?.addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            elements.authError?.classList.remove('hidden');
            elements.authError.textContent = 'Ошибка при выходе из системы';
        }
    });

    checkAuth();
});