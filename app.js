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
        this.initializeFirebaseMessaging();

        // Sync tasks from Firestore on startup (multi-device sync)
        this.syncOnStartup();
    }

    async syncOnStartup() {
        // Wait a bit for Firebase to initialize
        setTimeout(async () => {
            try {
                await this.syncTasksFromFirestore();
            } catch (error) {
                console.error('Startup sync failed:', error);
            }
        }, 1000);
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

        // View containers
        this.tasksContainer = document.querySelector('.tasks-container');
        this.settingsView = document.getElementById('settingsView');
        this.filterTabs = document.querySelector('.filter-tabs');
        this.bottomNav = document.querySelector('.bottom-nav');

        // Settings elements
        this.settingsView = document.getElementById('settingsView');
        this.notificationsSettingsView = document.getElementById('notificationsSettingsView');
        this.openNotificationsSettingsBtn = document.getElementById('openNotificationsSettings');
        this.backToSettingsBtn = document.getElementById('backToSettings');
        this.toggleNotificationsBtn = document.getElementById('toggleNotifications');
        this.testNotificationBtn = document.getElementById('testNotification');
        this.browserStatus = document.getElementById('browserStatus');
        this.serviceStatus = document.getElementById('serviceStatus');
        this.tokenStatus = document.getElementById('tokenStatus');
        this.notificationTimeSelect = document.getElementById('notificationTime');
        this.notifyDueTodayCheckbox = document.getElementById('notifyDueToday');
        this.notifyOverdueCheckbox = document.getElementById('notifyOverdue');
        this.notifyDueTomorrowCheckbox = document.getElementById('notifyDueTomorrow');
        this.timeHelpBtn = document.getElementById('timeHelpBtn');
        this.timeTooltip = document.getElementById('timeTooltip');
        this.closeTimeTooltip = document.getElementById('closeTimeTooltip');
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

        // Settings navigation
        if (this.openNotificationsSettingsBtn) {
            this.openNotificationsSettingsBtn.addEventListener('click', () => this.showNotificationsSettings());
        }
        if (this.backToSettingsBtn) {
            this.backToSettingsBtn.addEventListener('click', () => this.showMainSettings());
        }

        // Settings event listeners
        if (this.toggleNotificationsBtn) {
            this.toggleNotificationsBtn.addEventListener('click', () => this.handleToggleNotifications());
        }
        if (this.testNotificationBtn) {
            this.testNotificationBtn.addEventListener('click', () => this.sendTestNotification());
        }
        if (this.notificationTimeSelect) {
            this.notificationTimeSelect.addEventListener('change', (e) => this.handleNotificationTimeChange(e.target.value));
        }
        if (this.notifyDueTodayCheckbox) {
            this.notifyDueTodayCheckbox.addEventListener('change', (e) => this.handleNotifyCheckboxChange('dueToday', e.target.checked));
        }
        if (this.notifyOverdueCheckbox) {
            this.notifyOverdueCheckbox.addEventListener('change', (e) => this.handleNotifyCheckboxChange('overdue', e.target.checked));
        }
        if (this.notifyDueTomorrowCheckbox) {
            this.notifyDueTomorrowCheckbox.addEventListener('change', (e) => this.handleNotifyCheckboxChange('dueTomorrow', e.target.checked));
        }
        if (this.timeHelpBtn) {
            this.timeHelpBtn.addEventListener('click', () => this.showTimeTooltip());
        }
        if (this.closeTimeTooltip) {
            this.closeTimeTooltip.addEventListener('click', () => this.hideTimeTooltip());
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

        let taskToSync;
        if (this.editingTaskId) {
            // Update existing task
            const task = this.tasks.find(t => t.id === this.editingTaskId);
            if (task) {
                task.text = taskText;
                task.dueDate = this.taskDate.value || null;
                taskToSync = task;
            }
        } else {
            // Create new task
            const task = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: this.taskDate.value || null,
                subtasks: [], // Subtasks
                expanded: false, // Expanded state
                // Firestore sync fields
                userId: this.getUserId(),
                syncedAt: null, // Will be set after first sync
                lastNotificationDate: null // Last date notification was sent (YYYY-MM-DD)
            };
            this.tasks.unshift(task);
            taskToSync = task;
        }

        this.saveTasks();
        this.render();
        this.closeModalDialog();

        // Auto-sync to Firestore
        if (taskToSync) {
            this.syncTaskToFirestore(taskToSync);
        }

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

        // Auto-sync to Firestore
        this.syncTaskToFirestore(task);

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

        // Auto-delete from Firestore
        this.deleteTaskFromFirestore(id);
    }

    // Subtask methods
    toggleExpand(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.expanded = !task.expanded;
        this.saveTasks();
        this.render();
    }

    addSubtask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const input = document.getElementById(`subtask-input-${taskId}`);
        if (!input) return;

        const subtaskText = input.value.trim();
        if (!subtaskText) {
            input.focus();
            return;
        }

        // Create subtask
        const subtask = {
            id: Date.now(),
            text: subtaskText,
            completed: false
        };

        // Initialize subtasks array if it doesn't exist
        if (!task.subtasks) {
            task.subtasks = [];
        }

        task.subtasks.push(subtask);

        // Automatically expand task
        task.expanded = true;

        this.saveTasks();
        this.render();

        // Auto-sync to Firestore
        this.syncTaskToFirestore(task);

        // Focus on input after rendering
        setTimeout(() => {
            const newInput = document.getElementById(`subtask-input-${taskId}`);
            if (newInput) newInput.focus();
        }, 50);
    }

    deleteSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
        this.saveTasks();
        this.render();

        // Auto-sync to Firestore
        this.syncTaskToFirestore(task);
    }

    toggleSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (!subtask) return;

        subtask.completed = !subtask.completed;
        this.saveTasks();
        this.render();

        // Auto-sync to Firestore
        this.syncTaskToFirestore(task);
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
                // Show ALL tasks - including overdue, today, future, and tasks without due dates
                filtered = this.tasks;
                break;
        }

        // Sort: Overdue first, then incomplete, then completed
        // But keep pending tasks (with active timer) in their original position
        filtered = filtered.sort((a, b) => {
            // Keep task with pending move in its current position among incomplete tasks
            const aPending = a.completed && a.id === this.pendingMoveTaskId;
            const bPending = b.completed && b.id === this.pendingMoveTaskId;

            // If a is pending, treat it as incomplete for sorting
            const aIsComplete = a.completed && !aPending;
            const bIsComplete = b.completed && !bPending;

            // Check if tasks are overdue
            const aIsOverdue = this.isOverdue(a);
            const bIsOverdue = this.isOverdue(b);

            // Priority: 1. Overdue (top), 2. Incomplete, 3. Completed (bottom)

            // Completed tasks always go to the end
            if (aIsComplete && !bIsComplete) return 1;
            if (!aIsComplete && bIsComplete) return -1;

            // Among incomplete tasks, overdue tasks come first
            if (!aIsComplete && !bIsComplete) {
                if (aIsOverdue && !bIsOverdue) return -1;
                if (!aIsOverdue && bIsOverdue) return 1;
            }

            // If both have same completion and overdue status, sort by due date
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
            // Hide all views
            this.tasksContainer.classList.add('hidden');
            this.settingsView.classList.add('hidden');
            this.filterTabs.classList.add('hidden');

            alert('Calendar - feature in development');

            // Return to tasks view
            this.currentView = 'tasks';
            this.updateNavButtons();
            this.handleViewChange();
        } else if (this.currentView === 'settings') {
            // Show settings, hide tasks
            this.tasksContainer.classList.add('hidden');
            this.settingsView.classList.remove('hidden');
            this.filterTabs.classList.add('hidden');
            this.bottomNav.classList.remove('hidden');

            // Update settings status
            this.updateSettingsStatus();
        } else {
            // Show tasks, hide settings
            this.tasksContainer.classList.remove('hidden');
            this.settingsView.classList.add('hidden');
            this.filterTabs.classList.remove('hidden');
            this.bottomNav.classList.remove('hidden');
        }
    }

    // Settings methods
    updateSettingsStatus() {
        // Update browser permission status
        if (Notification.permission === 'granted') {
            this.browserStatus.textContent = 'Allowed';
            this.browserStatus.classList.add('success');
            this.browserStatus.classList.remove('error');
            this.toggleNotificationsBtn.classList.add('enabled');
            this.toggleNotificationsBtn.querySelector('.toggle-label').textContent = 'Enabled';
            this.testNotificationBtn.disabled = false;
        } else if (Notification.permission === 'denied') {
            this.browserStatus.textContent = 'Blocked';
            this.browserStatus.classList.add('error');
            this.browserStatus.classList.remove('success');
            this.toggleNotificationsBtn.classList.remove('enabled');
            this.toggleNotificationsBtn.querySelector('.toggle-label').textContent = 'Enable';
            this.testNotificationBtn.disabled = true;
        } else {
            this.browserStatus.textContent = 'Not requested';
            this.browserStatus.classList.remove('error', 'success');
            this.toggleNotificationsBtn.classList.remove('enabled');
            this.toggleNotificationsBtn.querySelector('.toggle-label').textContent = 'Enable';
            this.testNotificationBtn.disabled = true;
        }

        // Update service worker status
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                this.serviceStatus.textContent = 'Connected';
                this.serviceStatus.classList.add('success');
                this.serviceStatus.classList.remove('error');
            }).catch(() => {
                this.serviceStatus.textContent = 'Disconnected';
                this.serviceStatus.classList.add('error');
                this.serviceStatus.classList.remove('success');
            });
        } else {
            this.serviceStatus.textContent = 'Not supported';
            this.serviceStatus.classList.add('error');
            this.serviceStatus.classList.remove('success');
        }

        // Update FCM token status
        if (Notification.permission === 'granted') {
            this.tokenStatus.textContent = 'Available';
            this.tokenStatus.classList.add('success');
            this.tokenStatus.classList.remove('error');
        } else {
            this.tokenStatus.textContent = 'Not available';
            this.tokenStatus.classList.remove('error', 'success');
        }

        // Load and set notification time and checkboxes
        const settings = this.loadNotificationSettings();
        if (this.notificationTimeSelect) {
            this.notificationTimeSelect.value = settings.time;
        }
        if (this.notifyDueTodayCheckbox) {
            this.notifyDueTodayCheckbox.checked = settings.dueToday;
        }
        if (this.notifyOverdueCheckbox) {
            this.notifyOverdueCheckbox.checked = settings.overdue;
        }
        if (this.notifyDueTomorrowCheckbox) {
            this.notifyDueTomorrowCheckbox.checked = settings.dueTomorrow;
        }
    }

    async handleToggleNotifications() {
        if (Notification.permission === 'granted') {
            alert('Notifications already enabled!');
            return;
        }

        await this.requestNotificationPermission();
        this.updateSettingsStatus();
    }

    async sendTestNotification() {
        if (Notification.permission !== 'granted') {
            alert('Please enable notifications first!');
            return;
        }

        try {
            const notification = new Notification('Test Notification', {
                body: 'This is a test notification from ToDo App!',
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png',
                tag: 'test-notification'
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            this.showToast('Test notification sent!');

            // Auto-hide toast after 3 seconds
            setTimeout(() => {
                this.hideToast();
            }, 3000);
        } catch (error) {
            console.error('Error sending test notification:', error);
            alert('Error sending test notification: ' + error.message);
        }
    }

    async handleNotificationTimeChange(time) {
        const settings = this.loadNotificationSettings();
        settings.time = time;
        this.saveNotificationSettings(settings);

        // Sync notification time to Firestore
        await this.saveNotificationTimeToFirestore(time);
    }

    handleNotifyCheckboxChange(type, checked) {
        const settings = this.loadNotificationSettings();
        settings[type] = checked;
        this.saveNotificationSettings(settings);
    }

    loadNotificationSettings() {
        const defaultSettings = {
            time: '09:00',
            dueToday: true,
            overdue: true,
            dueTomorrow: false
        };

        const saved = localStorage.getItem('notification-settings');
        if (!saved) return defaultSettings;

        try {
            return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {
            console.error('Error loading notification settings:', e);
            return defaultSettings;
        }
    }

    saveNotificationSettings(settings) {
        localStorage.setItem('notification-settings', JSON.stringify(settings));
    }

    showTimeTooltip() {
        if (this.timeTooltip) {
            this.timeTooltip.classList.remove('hidden');
        }
    }

    hideTimeTooltip() {
        if (this.timeTooltip) {
            this.timeTooltip.classList.add('hidden');
        }
    }

    showNotificationsSettings() {
        this.settingsView.classList.add('hidden');
        this.notificationsSettingsView.classList.remove('hidden');
        this.filterTabs.classList.add('hidden');
        this.tasksContainer.classList.add('hidden');
        this.bottomNav.classList.add('hidden');
        this.updateSettingsStatus();
    }

    showMainSettings() {
        this.notificationsSettingsView.classList.add('hidden');
        this.settingsView.classList.remove('hidden');
        this.filterTabs.classList.add('hidden');
        this.tasksContainer.classList.add('hidden');
        this.bottomNav.classList.remove('hidden');
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

        // Calculate subtasks progress
        const subtasks = task.subtasks || [];
        const totalSubtasks = subtasks.length;
        const completedSubtasks = subtasks.filter(st => st.completed).length;
        const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

        // Check if task is overdue
        const isOverdue = this.isOverdue(task);

        // Main task
        let html = `
            <li class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                <input
                    type="checkbox"
                    class="task-checkbox"
                    ${task.completed ? 'checked' : ''}
                    onchange="app.toggleTask(${task.id})"
                >
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                ${isOverdue ? '<span class="overdue-badge">OVERDUE</span>' : ''}
                ${dateDisplay ? `<span class="task-date">${dateDisplay}</span>` : ''}
                <button
                    class="btn-toggle-expand ${task.expanded ? 'expanded' : ''}"
                    onclick="app.toggleExpand(${task.id})"
                    title="${task.expanded ? 'Collapse' : 'Expand'}"
                >${totalSubtasks > 0 ? '▼' : '+'}</button>
                <button class="btn-edit" onclick="app.editTask(${task.id})" title="Edit task">✏️</button>
                <button class="btn-delete" onclick="app.deleteTask(${task.id})" title="Delete task">×</button>
            </li>
        `;

        // Progress bar (if has subtasks)
        if (totalSubtasks > 0) {
            html += `
                <li style="list-style: none; padding: 0 10px;">
                    <div class="task-progress">
                        <span>${completedSubtasks}/${totalSubtasks}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <span>${progressPercent}%</span>
                    </div>
                </li>
            `;
        }

        // Subtasks (if expanded)
        if (task.expanded && totalSubtasks > 0) {
            subtasks.forEach(subtask => {
                html += `
                    <li class="subtask-item ${subtask.completed ? 'completed' : ''}">
                        <input
                            type="checkbox"
                            class="task-checkbox"
                            ${subtask.completed ? 'checked' : ''}
                            onchange="app.toggleSubtask(${task.id}, ${subtask.id})"
                        >
                        <span class="subtask-text">${this.escapeHtml(subtask.text)}</span>
                        <button class="btn-delete" onclick="app.deleteSubtask(${task.id}, ${subtask.id})" title="Delete subtask">×</button>
                    </li>
                `;
            });

            // Input for adding subtask
            html += `
                <li class="add-subtask-row" style="list-style: none;">
                    <input
                        type="text"
                        class="subtask-input"
                        id="subtask-input-${task.id}"
                        placeholder="Add subtask..."
                        onkeydown="if(event.key === 'Enter') app.addSubtask(${task.id})"
                    >
                    <button class="btn-add-subtask" onclick="app.addSubtask(${task.id})">+</button>
                </li>
            `;
        }

        // If no subtasks but task is expanded, show input
        if (task.expanded && totalSubtasks === 0) {
            html += `
                <li class="add-subtask-row" style="list-style: none;">
                    <input
                        type="text"
                        class="subtask-input"
                        id="subtask-input-${task.id}"
                        placeholder="Add first subtask..."
                        onkeydown="if(event.key === 'Enter') app.addSubtask(${task.id})"
                    >
                    <button class="btn-add-subtask" onclick="app.addSubtask(${task.id})">+</button>
                </li>
            `;
        }

        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTaskWord(count) {
        return count === 1 ? 'task' : 'tasks';
    }

    // Check if task is overdue
    isOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDate = new Date(task.dueDate);
        return dueDate < today;
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
        if (!tasks) return [];

        // Migration: add new fields to existing tasks
        const userId = this.getUserId();
        return JSON.parse(tasks).map(task => ({
            ...task,
            subtasks: task.subtasks || [],
            expanded: task.expanded || false,
            // Firestore sync fields (migration for old tasks)
            userId: task.userId || userId,
            syncedAt: task.syncedAt || null,
            // Migrate old notificationSent to new lastNotificationDate
            lastNotificationDate: task.lastNotificationDate || null
        }));
    }

    // PWA functionality
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            const isGitHubPages = window.location.pathname.includes('/ToDo-App');
            const swPath = isGitHubPages
                ? '/ToDo-App/service-worker.js'
                : '/service-worker.js';
            const swScope = isGitHubPages ? '/ToDo-App/' : '/';

            navigator.serviceWorker.register(swPath, { scope: swScope })
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

    // Firebase Messaging functionality
    initializeFirebaseMessaging() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        // Check if user has already granted permission
        if (Notification.permission === 'granted') {
            this.getAndSaveFCMToken();
        }
    }

    getUserId() {
        let userId = localStorage.getItem('user-id');
        if (!userId) {
            userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('user-id', userId);
        }
        return userId;
    }

    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('Notification permission granted');
                await this.getAndSaveFCMToken();
                alert('Notifications enabled! You will receive task reminders.');
            } else if (permission === 'denied') {
                alert('Notifications blocked. Enable them in browser settings.');
            } else {
                alert('Notification permission not granted.');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            alert('Error requesting notification permission: ' + error.message);
        }
    }

    async getAndSaveFCMToken() {
        try {
            if (typeof messaging === 'undefined') {
                console.error('Firebase Messaging not initialized');
                return;
            }

            const currentToken = await messaging.getToken({ vapidKey });

            if (currentToken) {
                await this.saveFCMTokenToFirestore(currentToken);
            } else {
                console.log('No FCM token available. Request permission to generate one.');
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    }

    async saveFCMTokenToFirestore(token) {
        try {
            const userId = this.getUserId();
            const settings = this.loadNotificationSettings();

            await firestore.collection('users').doc(userId).set({
                fcmToken: token,
                notificationTime: settings.time, // Save preferred notification time (e.g. "09:00")
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: userId
            }, { merge: true });

            console.log('FCM token saved to Firestore');
        } catch (error) {
            console.error('Error saving FCM token to Firestore:', error);
        }
    }

    async saveNotificationTimeToFirestore(time) {
        try {
            if (typeof firestore === 'undefined') {
                console.error('Firestore not initialized');
                return;
            }

            const userId = this.getUserId();

            await firestore.collection('users').doc(userId).set({
                notificationTime: time,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`Notification time updated to ${time} in Firestore`);
        } catch (error) {
            console.error('Error saving notification time to Firestore:', error);
        }
    }

    // Firestore sync methods
    async syncTaskToFirestore(task) {
        try {
            if (typeof firestore === 'undefined') {
                console.error('Firestore not initialized');
                return;
            }

            // Update syncedAt timestamp
            task.syncedAt = Date.now();

            // Save to Firestore using task ID as document ID
            await firestore.collection('tasks').doc(task.id.toString()).set({
                id: task.id,
                text: task.text,
                completed: task.completed,
                createdAt: task.createdAt,
                completedAt: task.completedAt || null,
                dueDate: task.dueDate,
                subtasks: task.subtasks,
                expanded: task.expanded,
                userId: task.userId,
                syncedAt: task.syncedAt,
                lastNotificationDate: task.lastNotificationDate
            }, { merge: true });

            console.log(`Task ${task.id} synced to Firestore`);
        } catch (error) {
            console.error('Error syncing task to Firestore:', error);
        }
    }

    async syncAllTasksToFirestore() {
        try {
            console.log('Syncing all tasks to Firestore...');

            // Sync each task
            for (const task of this.tasks) {
                await this.syncTaskToFirestore(task);
            }

            // Save updated tasks to localStorage (with new syncedAt timestamps)
            this.saveTasks();

            console.log(`All ${this.tasks.length} tasks synced to Firestore`);
        } catch (error) {
            console.error('Error syncing all tasks to Firestore:', error);
        }
    }

    async syncTasksFromFirestore() {
        try {
            if (typeof firestore === 'undefined') {
                console.error('Firestore not initialized');
                return;
            }

            const userId = this.getUserId();

            // Get all tasks for this user from Firestore
            const snapshot = await firestore.collection('tasks')
                .where('userId', '==', userId)
                .get();

            if (snapshot.empty) {
                console.log('No tasks found in Firestore');
                return;
            }

            const firestoreTasks = [];
            snapshot.forEach(doc => {
                firestoreTasks.push(doc.data());
            });

            console.log(`Found ${firestoreTasks.length} tasks in Firestore`);

            // Merge with local tasks
            this.mergeTasks(firestoreTasks);

            // Save merged tasks to localStorage
            this.saveTasks();

            // Re-render UI to show synced tasks
            this.render();

            console.log('Tasks synced from Firestore');
        } catch (error) {
            console.error('Error syncing tasks from Firestore:', error);
        }
    }

    mergeTasks(firestoreTasks) {
        // Create a map of local tasks by ID
        const localTasksMap = new Map();
        this.tasks.forEach(task => {
            localTasksMap.set(task.id, task);
        });

        // Merge firestore tasks
        firestoreTasks.forEach(firestoreTask => {
            const localTask = localTasksMap.get(firestoreTask.id);

            if (!localTask) {
                // Task only exists in Firestore - add it
                this.tasks.push(firestoreTask);
            } else {
                // Task exists in both - use the newer one based on syncedAt
                const localSyncedAt = localTask.syncedAt || 0;
                const firestoreSyncedAt = firestoreTask.syncedAt || 0;

                if (firestoreSyncedAt > localSyncedAt) {
                    // Firestore version is newer - update local
                    const index = this.tasks.findIndex(t => t.id === firestoreTask.id);
                    this.tasks[index] = firestoreTask;
                    console.log(`Task ${firestoreTask.id} updated from Firestore (newer version)`);
                } else {
                    console.log(`Task ${localTask.id} kept local version (newer or same)`);
                }
            }
        });
    }

    async deleteTaskFromFirestore(taskId) {
        try {
            if (typeof firestore === 'undefined') {
                console.error('Firestore not initialized');
                return;
            }

            await firestore.collection('tasks').doc(taskId.toString()).delete();
            console.log(`Task ${taskId} deleted from Firestore`);
        } catch (error) {
            console.error('Error deleting task from Firestore:', error);
        }
    }
}

// Initialize app when DOM is fully loaded
let app;

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new TodoApp();
    });
} else {
    // DOM is already loaded
    app = new TodoApp();
}

// Add to home screen detection for iOS
if (window.navigator.standalone) {
    console.log('App is running in standalone mode');
}