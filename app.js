// Task management class
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentView = 'tasks';
        this.searchQuery = '';
        this.isSearchActive = false;
        this.editingTaskId = null; // Track which task is being edited
        this.moveTimer = null; // Timer for delayed task movement
        this.pendingMoveTaskId = null; // Track task waiting to be moved
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
        this.taskDateWrapper = document.querySelector('.date-input-wrapper');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.taskSummary = document.getElementById('taskSummary');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.navBtns = document.querySelectorAll('.nav-btn');

        // Search elements
        this.searchBtn = document.getElementById('searchBtn');
        this.searchContainer = document.getElementById('searchContainer');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');

        // Modal elements
        this.modal = document.getElementById('taskModal');
        this.modalTitle = this.modal.querySelector('.modal-header h3');
        this.closeModal = document.getElementById('closeModal');
        this.cancelTask = document.getElementById('cancelTask');
        this.saveTask = document.getElementById('saveTask');

        // PWA elements
        this.installPrompt = document.getElementById('installPrompt');
        this.installBtn = document.getElementById('installBtn');
        this.dismissBtn = document.getElementById('dismissBtn');

        // Toast elements
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        this.undoBtn = document.getElementById('undoBtn');
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

        // Search functionality
        this.searchBtn.addEventListener('click', () => this.toggleSearch());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());

        // PWA install event listeners
        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => this.handleInstall());
        }
        if (this.dismissBtn) {
            this.dismissBtn.addEventListener('click', () => this.dismissInstall());
        }

        // Toast undo button
        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', () => this.undoComplete());
        }

        // Date input placeholder toggle
        if (this.taskDate && this.taskDateWrapper) {
            this.taskDate.addEventListener('input', () => this.updateDatePlaceholder());
            this.taskDate.addEventListener('change', () => this.updateDatePlaceholder());
        }
    }

    updateDatePlaceholder() {
        if (this.taskDate.value) {
            this.taskDateWrapper.classList.add('has-value');
        } else {
            this.taskDateWrapper.classList.remove('has-value');
        }
    }

    openModal(taskId = null) {
        if (taskId) {
            // Edit mode
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                this.editingTaskId = taskId;
                this.taskInput.value = task.text;
                this.taskDate.value = task.dueDate || '';
                this.modalTitle.textContent = 'Edit Task';
            }
        } else {
            // Create mode
            this.editingTaskId = null;
            this.taskInput.value = '';
            this.taskDate.value = '';
            this.modalTitle.textContent = 'New Task';
        }

        this.modal.classList.add('show');
        setTimeout(() => {
            this.taskInput.focus();
            this.updateDatePlaceholder();
        }, 100);
    }

    closeModalDialog() {
        this.modal.classList.remove('show');
        this.editingTaskId = null;
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        if (!taskText) {
            this.taskInput.focus();
            return;
        }

        if (this.editingTaskId) {
            // Update existing task
            const task = this.tasks.find(t => t.id === this.editingTaskId);
            if (task) {
                task.text = taskText;
                task.dueDate = this.taskDate.value || null;
            }
        } else {
            // Create new task
            const task = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: this.taskDate.value || null
            };
            this.tasks.unshift(task);
        }

        this.saveTasks();
        this.render();
        this.closeModalDialog();

        // Animation feedback
        if (!this.editingTaskId) {
            this.addTaskBtn.style.transform = 'scale(0.9) rotate(90deg)';
            setTimeout(() => {
                this.addTaskBtn.style.transform = 'scale(1) rotate(0deg)';
            }, 200);
        }
    }

    editTask(id) {
        this.openModal(id);
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const wasCompleted = task.completed;
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        this.saveTasks();

        if (task.completed && !wasCompleted) {
            // Task was just marked as completed
            // Cancel any existing timer
            if (this.moveTimer) {
                clearTimeout(this.moveTimer);
                this.moveTimer = null;
            }

            // Hide any existing toast
            this.hideToast();

            // Set pending task ID
            this.pendingMoveTaskId = id;

            // Show toast with undo option
            this.showToast('Task completed! Moving to bottom in 5 seconds...');

            // Set timer to move task after 5 seconds
            this.moveTimer = setTimeout(() => {
                this.pendingMoveTaskId = null;
                this.moveTimer = null;
                this.hideToast();
                this.render(); // Re-render to move task to bottom
            }, 5000);

            // Render immediately but task stays in place (controlled by sorting logic)
            this.render();
        } else {
            // Task was uncompleted or toggled while timer was active
            // Cancel timer if this task was pending
            if (this.pendingMoveTaskId === id) {
                if (this.moveTimer) {
                    clearTimeout(this.moveTimer);
                    this.moveTimer = null;
                }
                this.pendingMoveTaskId = null;
                this.hideToast();
            }
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

        let filtered;

        switch (this.currentFilter) {
            case 'today':
                filtered = this.tasks.filter(t => {
                    if (!t.dueDate) return false;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                });
                break;
            case 'month':
                filtered = this.tasks.filter(t => {
                    if (!t.dueDate) return false;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= today && dueDate <= endOfMonth;
                });
                break;
            case 'all':
            default:
                // Show all tasks with due dates from today onwards, plus tasks without due dates
                filtered = this.tasks.filter(t => {
                    if (!t.dueDate) return true;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= today;
                });
                break;
        }

        // Sort: completed tasks go last, then by due date
        // But keep pending tasks (with active timer) in their original position
        filtered = filtered.sort((a, b) => {
            // Keep task with pending move in its current position among incomplete tasks
            const aPending = a.completed && a.id === this.pendingMoveTaskId;
            const bPending = b.completed && b.id === this.pendingMoveTaskId;

            // If a is pending, treat it as incomplete for sorting
            const aIsComplete = a.completed && !aPending;
            const bIsComplete = b.completed && !bPending;

            // Completed tasks (not pending) always go to the end
            if (aIsComplete && !bIsComplete) return 1;
            if (!aIsComplete && bIsComplete) return -1;

            // If both have same completion status, sort by due date
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        // Apply search filter if query is 3+ characters
        if (this.searchQuery.length >= 3) {
            filtered = filtered.filter(task =>
                task.text.toLowerCase().includes(this.searchQuery)
            );
        }

        return filtered;
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
                <button class="btn-edit" onclick="app.editTask(${task.id})" title="Edit task">✏️</button>
                <button class="btn-delete" onclick="app.deleteTask(${task.id})" title="Delete task">×</button>
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

    // Search functionality
    toggleSearch() {
        this.isSearchActive = !this.isSearchActive;

        if (this.isSearchActive) {
            // Show search container
            this.searchContainer.classList.remove('hidden');
            // Switch to "All" filter
            this.currentFilter = 'all';
            this.updateFilterButtons();
            this.render(); // Re-render to show all tasks
            // Focus on search input
            setTimeout(() => this.searchInput.focus(), 100);
        } else {
            // Hide search container
            this.searchContainer.classList.add('hidden');
            // Clear search
            this.clearSearch();
        }
    }

    handleSearch(query) {
        this.searchQuery = query.trim().toLowerCase();

        // Show/hide clear button
        if (this.searchQuery.length > 0) {
            this.clearSearchBtn.classList.add('visible');
        } else {
            this.clearSearchBtn.classList.remove('visible');
        }

        // Re-render tasks with search filter
        this.render();
    }

    clearSearch() {
        this.searchQuery = '';
        this.searchInput.value = '';
        this.clearSearchBtn.classList.remove('visible');
        this.render();
    }

    // Toast notification methods
    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.remove('hidden');
        this.toast.classList.add('show');
    }

    hideToast() {
        this.toast.classList.remove('show');
        this.toast.classList.add('hidden');
    }

    undoComplete() {
        // Cancel the timer if it's still running
        if (this.moveTimer) {
            clearTimeout(this.moveTimer);
            this.moveTimer = null;
        }

        // Restore the task to incomplete state
        if (this.pendingMoveTaskId) {
            const task = this.tasks.find(t => t.id === this.pendingMoveTaskId);
            if (task) {
                task.completed = false;
                task.completedAt = null;
                this.pendingMoveTaskId = null;
                this.saveTasks();
                this.render();
            }
        }

        this.hideToast();
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