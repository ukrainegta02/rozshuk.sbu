// База даних локального зберігання
let wantedList = JSON.parse(localStorage.getItem('wantedList')) || [];
let actionsList = JSON.parse(localStorage.getItem('actionsList')) || [];
let auditList = JSON.parse(localStorage.getItem('auditList')) || [];
let logs = JSON.parse(localStorage.getItem('logs')) || [];

// Користувачі
const users = {
    "Полковник": "2222",
    "Дацик": "1131"
};

// Зберігаємо ніки користувачів
let userNicknames = JSON.parse(localStorage.getItem('userNicknames')) || {
    "Полковник": "Полковник",
    "Дацик": "Дацик"
};

let currentUser = null;
let currentNickname = null;

document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.querySelector('.login-screen');
    const fingerprintScreen = document.querySelector('.fingerprint-screen');
    const controlPanel = document.querySelector('.control-panel');
    const fingerprint = document.querySelector('.fingerprint');
    const loginForm = document.getElementById('login-form');
    const menuLinks = document.querySelectorAll('.sidebar a');
    const contents = document.querySelectorAll('.content');
    const addWantedForm = document.getElementById('add-wanted-form');
    const logsLink = document.getElementById('logs-link');
    const loginLink = document.getElementById('login-link');
    const restrictedLinks = document.querySelectorAll('.restricted');
    const sidebar = document.querySelector('.sidebar');
    const contentArea = document.querySelector('.content-area');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');

    // Згортання/розгортання бічної панелі
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        toggleSidebarBtn.classList.toggle('collapsed');
        contentArea.classList.toggle('expanded');
    });

    // Відкриття панелі управління
    fingerprint.addEventListener('click', () => {
        fingerprintScreen.classList.add('hidden');
        controlPanel.classList.add('active');
        contents[0].classList.add('active');
        menuLinks[0].classList.add('active');
    });

    // Авторизація
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const nickname = document.getElementById('login-nickname').value;

        if (users[username] && users[username] === password) {
            currentUser = username;
            currentNickname = nickname;
            // Зберігаємо нік для цього користувача
            userNicknames[username] = nickname;
            localStorage.setItem('userNicknames', JSON.stringify(userNicknames));
            loginScreen.classList.add('hidden');
            controlPanel.classList.add('active');
            restrictedLinks.forEach(link => link.style.display = 'block');
            loginLink.style.display = 'none';
            logsLink.style.display = currentUser === 'Дацик' ? 'block' : 'none';
            addLog(`${nickname} (${username}) увійшов у систему`);
            loadWantedList();
            loadAuditList(); // Оновлюємо аудит після входу
        } else {
            alert('Неправильний логін або пароль!');
        }
    });

    // Перемикання між вкладками
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const contentId = link.getAttribute('data-content');
            if (contentId === 'logout') {
                addLog(`${currentNickname} (${currentUser}) вийшов із системи`);
                controlPanel.classList.remove('active');
                fingerprintScreen.classList.remove('hidden');
                restrictedLinks.forEach(link => link.style.display = 'none');
                loginLink.style.display = 'block';
                contents.forEach(c => c.classList.remove('active'));
                menuLinks.forEach(l => l.classList.remove('active'));
                currentUser = null;
                currentNickname = null;
                loadWantedList();
                loadAuditList();
            } else if (contentId === 'login') {
                loginScreen.classList.remove('hidden');
                controlPanel.classList.remove('active');
            } else {
                menuLinks.forEach(l => l.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                link.classList.add('active');
                document.getElementById(contentId).classList.add('active');
            }
        });
    });

    // Завантаження списку розшуку у вигляді таблиці
    function loadWantedList() {
        const wantedListEl = document.getElementById('wanted-list');
        wantedListEl.innerHTML = '';
        wantedList.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.id}</td>
                <td>${item.article}</td>
                <td><a href="${item.evidence}" target="_blank">Посилання</a></td>
                <td>${item.date}</td>
                <td>${item.addedBy}</td>
                <td>
                    ${currentUser ? `
                    <div class="status-controls">
                        <span class="status ${item.status === 'Під вартою' ? 'rejected' : ''}">${item.status || 'Розшукується'}</span>
                        <select id="status-${index}">
                            <option value="Розшукується" ${item.status !== 'Під вартою' ? 'selected' : ''}>Розшукується</option>
                            <option value="Під вартою" ${item.status === 'Під вартою' ? 'selected' : ''}>Під вартою</option>
                        </select>
                    </div>` : `<span class="status ${item.status === 'Під вартою' ? 'rejected' : ''}">${item.status || 'Розшукується'}</span>`}
                </td>
                <td>
                    ${currentUser ? `
                    <div class="status-controls">
                        <button onclick="updateWantedStatus(${index})"><i class="fas fa-save"></i> Зберегти</button>
                        ${currentUser === 'Дацик' ? `<button class="delete-btn" onclick="deleteWanted(${index})"><i class="fas fa-trash"></i> Видалити</button>` : ''}
                    </div>` : ''}
                </td>
            `;
            wantedListEl.appendChild(row);
        });
    }

    // Оновлення статусу розшуку
    window.updateWantedStatus = function(index) {
        const newStatus = document.getElementById(`status-${index}`).value;
        const oldStatus = wantedList[index].status || 'Розшукується';
        wantedList[index].status = newStatus;
        localStorage.setItem('wantedList', JSON.stringify(wantedList));
        addAction(newStatus === 'Під вартою' ? 'red' : 'green', 
            `Статус розшуку для ${wantedList[index].name} змінено з "${oldStatus}" на "${newStatus}" (${new Date().toLocaleString('uk-UA')})`);
        addLog(`${currentNickname} (${currentUser}) змінив статус розшуку для ${wantedList[index].name} на ${newStatus}`);
        loadWantedList();
    };

    // Видалення з розшуку (тільки для Дацик)
    window.deleteWanted = function(index) {
        const deletedItem = wantedList[index];
        wantedList.splice(index, 1);
        localStorage.setItem('wantedList', JSON.stringify(wantedList));
        addAction('red', `Видалено з розшуку: ${deletedItem.name} (${new Date().toLocaleString('uk-UA')})`);
        addLog(`${currentNickname} (${currentUser}) видалив з розшуку: ${deletedItem.name}`);
        loadWantedList();
    };

    // Додавання в розшук
    addWantedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('Увійдіть у систему для подачі в розшук!');
            return;
        }
        const name = document.getElementById('wanted-name').value;
        const id = document.getElementById('wanted-id').value;
        const article = document.getElementById('wanted-article').value;
        const articleText = document.getElementById('wanted-article').options[document.getElementById('wanted-article').selectedIndex].text;
        const evidence = document.getElementById('wanted-evidence').value;
        const date = new Date().toLocaleString('uk-UA');

        const wantedItem = { 
            name, 
            id, 
            article: articleText, 
            evidence, 
            date, 
            addedBy: currentNickname, 
            status: 'Розшукується' 
        };
        wantedList.push(wantedItem);
        localStorage.setItem('wantedList', JSON.stringify(wantedList));
        addAction('green', `Додано в розшук: ${name} (${date}) за ${articleText}`);
        addLog(`${currentNickname} (${currentUser}) додав у розшук: ${name} за ${articleText}`);
        addWantedForm.reset();
        loadWantedList();
    });

    // Завантаження кадрового аудиту
    function loadAuditList() {
        const auditListEl = document.getElementById('audit-list');
        auditListEl.innerHTML = '';
        auditList.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-user-shield"></i> ${item.message}`;
            auditListEl.appendChild(li);
        });
    }

    // Завантаження дій
    function loadActionsList() {
        const actionsListEl = document.getElementById('actions-list');
        actionsListEl.innerHTML = '';
        actionsList.forEach(item => {
            const li = document.createElement('li');
            li.className = item.status;
            li.innerHTML = `<i class="fas ${item.status === 'green' ? 'fa-check' : item.status === 'red' ? 'fa-times' : 'fa-exclamation-triangle'}"></i> ${item.message}`;
            actionsListEl.appendChild(li);
        });
    }

    // Завантаження логів (тільки для Дацик)
    function loadLogs() {
        const logList = document.getElementById('log-list');
        logList.innerHTML = '';
        logs.forEach((log, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <i class="fas fa-scroll"></i> ${log}
                ${currentUser === 'Дацик' ? `<button onclick="deleteLog(${index})"><i class="fas fa-trash"></i> Видалити</button>` : ''}
            `;
            logList.appendChild(li);
        });
    }

    // Додавання дії
    function addAction(status, message) {
        actionsList.push({ status, message });
        localStorage.setItem('actionsList', JSON.stringify(actionsList));
        loadActionsList();
    }

    // Додавання в аудит
    function addAudit(message) {
        auditList.push({ message });
        localStorage.setItem('auditList', JSON.stringify(auditList));
        loadAuditList();
    }

    // Додавання в логи
    function addLog(message) {
        logs.push(`${message} (${new Date().toLocaleString('uk-UA')})`);
        localStorage.setItem('logs', JSON.stringify(logs));
        if (currentUser === 'Дацик') loadLogs();
    }

    // Видалення логу (тільки для Дацик)
    window.deleteLog = function(index) {
        logs.splice(index, 1);
        localStorage.setItem('logs', JSON.stringify(logs));
        loadLogs();
    };

    // Ініціалізація даних
    loadWantedList();
    loadActionsList();
    loadAuditList();
    if (currentUser === 'Дацик') loadLogs();

    // Додавання тестових даних для аудиту
    if (auditList.length === 0) {
        addAudit(`${userNicknames["Полковник"]}: Активний, останній вхід 24.03.2025`);
        addAudit(`${userNicknames["Дацик"]}: Активний, останній вхід 24.03.2025`);
    }

    // Додавання тестових даних для розшуку (згідно зображення)
    if (wantedList.length === 0) {
        wantedList.push({
            name: "Оляй Боб",
            id: "6768454",
            article: "Стаття 5.10 Хуліганство (15 хв.)",
            evidence: "Посилання",
            date: "24.03.2025, 17:14:17",
            addedBy: "Роман",
            status: "Розшукується"
        });
        wantedList.push({
            name: "Віктор",
            id: "undefined",
            article: "Стаття 5.14 Незаконне використання/носіння зброї (40 хв.)",
            evidence: "Посилання",
            date: "22.03.2025",
            addedBy: "Дацик",
            status: "Під вартою"
        });
        localStorage.setItem('wantedList', JSON.stringify(wantedList));
        loadWantedList();
    }
});