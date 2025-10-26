// Task management class
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentView = 'tasks';
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
        this.taskDate = document.getElementById('taskDate');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.taskSummary = document.getElementById('taskSummary');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.navBtns = document.querySelectorAll('.nav-btn');

        // Modal elements
        this.modal = document.getElementById('taskModal');
        this.closeModal = document.getElementById('closeModal');
        this.cancelTask = document.getElementById('cancelTask');
        this.saveTask = document.getElementById('saveTask');

        // PWA elements
        this.installPrompt = document.getElementById('installPrompt');
        this.installBtn = document.getElementById('installBtn');
        this.dismissBtn = document.getElementById('dismissBtn');
    }

    attachEventListeners() {
        // Floating add button opens modal
        this.addTaskBtn.addEventListener('click', () => this.openModal());

        // Modal controls
        this.closeModal.addEventListener('click', () => this.closeModalDialog());
        this.cancelTask.addEventListener('click', () => this.closeModalDialog());
        this.saveTask.addEventListener('click', () => this.addTask());

        // Close modal on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModalDialog();
            }
        });

        // Enter key to save task
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                this.updateFilterButtons();
                this.render();
            });
        });

        // Navigation buttons
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentView = e.currentTarget.dataset.view;
                this.updateNavButtons();
                this.handleViewChange();
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

    openModal() {
        this.modal.classList.add('show');
        this.taskInput.value = '';
        this.taskDate.value = '';
        setTimeout(() => this.taskInput.focus(), 100);
    }

    closeModalDialog() {
        this.modal.classList.remove('show');
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
            createdAt: new Date().toISOString(),
            dueDate: this.taskDate.value || null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.closeModalDialog();

        // Animation feedback
        this.addTaskBtn.style.transform = 'scale(0.9) rotate(90deg)';
        setTimeout(() => {
            this.addTaskBtn.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
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

    getFilteredTasks() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        switch (this.currentFilter) {
            case 'today':
                return this.tasks.filter(t => {
                    if (!t.dueDate) return false;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                });
            case 'month':
                return this.tasks.filter(t => {
                    if (!t.dueDate) return false;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= today && dueDate <= endOfMonth;
                });
            case 'all':
            default:
                // Show all tasks with due dates from today onwards, plus tasks without due dates
                return this.tasks.filter(t => {
                    if (!t.dueDate) return true;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= today;
                }).sort((a, b) => {
                    // Sort by due date, tasks without due date go last
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
        }
    }

    updateFilterButtons() {
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    updateNavButtons() {
        this.navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
    }

    handleViewChange() {
        if (this.currentView === 'calendar') {
            alert('Calendar - feature in development');
        } else if (this.currentView === 'settings') {
            alert('Settings - feature in development');
        }
    }

    render() {
        const filteredTasks = this.getFilteredTasks();

        // Update task summary in header
        const todayTasks = this.tasks.filter(t => {
            if (!t.dueDate) return false;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dueDate = new Date(t.dueDate);
            return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }).length;

        this.taskSummary.textContent = todayTasks > 0
            ? `You have ${todayTasks} ${this.getTaskWord(todayTasks)} for today`
            : 'No tasks for today';

        // Update task list
        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✨</div>
                    <div class="empty-state-text">
                        ${this.getEmptyStateText()}
                    </div>
                </div>
            `;
        } else {
            this.taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        }
    }

    getEmptyStateText() {
        switch (this.currentFilter) {
            case 'today':
                return 'No tasks for today';
            case 'month':
                return 'No tasks for this month';
            default:
                return 'No upcoming tasks';
        }
    }

    createTaskHTML(task) {
        let dateDisplay = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            dateDisplay = dueDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short'
            });
        }

        return `
            <li class="task-item ${task.completed ? 'completed' : ''}">
                <input
                    type="checkbox"
                    class="task-checkbox"
                    ${task.completed ? 'checked' : ''}
                    onchange="app.toggleTask(${task.id})"
                >
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                ${dateDisplay ? `<span class="task-date">${dateDisplay}</span>` : ''}
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
        return count === 1 ? 'task' : 'tasks';
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
            const swPath = window.location.pathname.includes('/ToDo-App')
                ? '/ToDo-App/service-worker.js'
                : '/service-worker.js';

            navigator.serviceWorker.register(swPath, { scope: '/ToDo-App/' })
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
            alert('To install the app on iOS:\n\n1. Tap the "Share" button 📤\n2. Scroll and select "Add to Home Screen"\n3. Tap "Add"');
        }
    }
}

// Initialize app
const app = new TodoApp();

// Add to home screen detection for iOS
if (window.navigator.standalone) {
    console.log('App is running in standalone mode');
}