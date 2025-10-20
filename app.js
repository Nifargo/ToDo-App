// Task management class
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.render();
        this.registerServiceWorker();
        this.checkInstallPrompt();
    }

    cacheElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.taskCounter = document.getElementById('taskCounter');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.installPrompt = document.getElementById('installPrompt');
        this.installBtn = document.getElementById('installBtn');
        this.dismissBtn = document.getElementById('dismissBtn');
    }

    attachEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                this.updateFilterButtons();
                this.render();
            });
        });

        // PWA install event listeners
        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => this.handleInstall());
        }
        if (this.dismissBtn) {
            this.dismissBtn.addEventListener('click', () => this.dismissInstall());
        }
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        if (!taskText) {
            this.taskInput.focus();
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.taskInput.value = '';
        this.taskInput.focus();

        // Animation feedback
        this.addTaskBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.addTaskBtn.style.transform = 'scale(1)';
        }, 100);
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    updateFilterButtons() {
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    render() {
        const filteredTasks = this.getFilteredTasks();

        // Update task list
        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✨</div>
                    <div class="empty-state-text">
                        ${this.currentFilter === 'completed' ? 'Немає виконаних завдань' :
                          this.currentFilter === 'active' ? 'Немає активних завдань' :
                          'Додайте своє перше завдання!'}
                    </div>
                </div>
            `;
        } else {
            this.taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        }

        // Update counter
        const activeCount = this.tasks.filter(t => !t.completed).length;
        const taskWord = this.getTaskWord(activeCount);
        this.taskCounter.textContent = `${activeCount} ${taskWord}`;

        // Update clear button
        const completedCount = this.tasks.filter(t => t.completed).length;
        this.clearCompletedBtn.disabled = completedCount === 0;
    }

    createTaskHTML(task) {
        const date = new Date(task.createdAt);
        const formattedDate = date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'short'
        });

        return `
            <li class="task-item ${task.completed ? 'completed' : ''}">
                <input
                    type="checkbox"
                    class="task-checkbox"
                    ${task.completed ? 'checked' : ''}
                    onchange="app.toggleTask(${task.id})"
                >
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <span class="task-date">${formattedDate}</span>
                <button class="btn-delete" onclick="app.deleteTask(${task.id})">×</button>
            </li>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTaskWord(count) {
        if (count === 0) return 'завдань';
        if (count === 1) return 'завдання';
        if (count >= 2 && count <= 4) return 'завдання';
        return 'завдань';
    }

    saveTasks() {
        localStorage.setItem('todo-tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const tasks = localStorage.getItem('todo-tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    // PWA functionality
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    checkInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Show custom install prompt after 3 seconds
            setTimeout(() => {
                if (this.installPrompt) {
                    this.installPrompt.classList.remove('hidden');
                }
            }, 3000);
        });

        this.handleInstall = async () => {
            if (!deferredPrompt) {
                this.showIOSInstructions();
                return;
            }

            this.installPrompt.classList.add('hidden');
            deferredPrompt.prompt();

            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            deferredPrompt = null;
        };

        this.dismissInstall = () => {
            if (this.installPrompt) {
                this.installPrompt.classList.add('hidden');
            }
            localStorage.setItem('installPromptDismissed', 'true');
        };

        // Check if already dismissed
        if (localStorage.getItem('installPromptDismissed') === 'true') {
            if (this.installPrompt) {
                this.installPrompt.classList.add('hidden');
            }
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            if (this.installPrompt) {
                this.installPrompt.classList.add('hidden');
            }
        }
    }

    showIOSInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
            alert('Щоб встановити додаток на iOS:\n\n1. Натисніть кнопку "Поділитися" 📤\n2. Прокрутіть і виберіть "На екран Home"\n3. Натисніть "Додати"');
        }
    }
}

// Initialize app
const app = new TodoApp();

// Add to home screen detection for iOS
if (window.navigator.standalone) {
    console.log('App is running in standalone mode');
}