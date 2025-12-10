import { useState, lazy, Suspense } from "react";
import { Plus } from "lucide-react";

// Auth
import { useAuth } from "./hooks/useAuth";
import LoginScreen from "./components/auth/LoginScreen";
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Layout Components
import BottomNav, { type NavItem } from "./components/layout/BottomNav";
import Container from "./components/layout/Container";

// UI Components
import Button from "./components/ui/Button";
import SearchIcon from "./components/ui/SearchIcon";
import { ToastContainer } from "./components/ui/Toast";

// Task Components
import {
  TaskList,
  FilterTabs,
  SearchContainer,
} from "./components/tasks";

// Lazy load heavy components
const TaskModal = lazy(() => import("./components/tasks/TaskModal"));
const SettingsScreen = lazy(() => import("./components/settings/SettingsScreen"));

// Hooks
import { useTasks } from "./hooks/useTasks";
import { useDebounce } from "./hooks/useDebounce";

// Types
import type { TaskFilter, Task, CreateTaskInput, Subtask } from "./types";

interface Toast {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  message: string;
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeNav, setActiveNav] = useState<NavItem>("tasks");
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get tasks with current filter
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    isCreating,
  } = useTasks(currentFilter);

  const addToast = (variant: Toast["variant"], message: string): void => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, variant, message }]);
  };

  const removeToast = (id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleOpenTaskModal = (task?: Task): void => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask(null);
    }
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = (): void => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = async (data: CreateTaskInput): Promise<void> => {
    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask.id, {
          text: data.text,
          dueDate: data.dueDate,
        });
        addToast("success", "Task updated successfully");
      } else {
        // Create new task
        await createTask(data);
        addToast("success", "Task created successfully");
      }
    } catch (error) {
      console.error("Error saving task:", error);
      addToast("error", "Failed to save task");
      throw error;
    }
  };

  const handleToggleTask = async (
    id: string,
    completed: boolean,
  ): Promise<void> => {
    try {
      await toggleComplete(id, completed);
      if (completed) {
        addToast("success", "Task completed!");
      }
    } catch (error) {
      console.error("Error toggling task:", error);
      addToast("error", "Failed to update task");
    }
  };

  const handleDeleteTask = async (id: string): Promise<void> => {
    try {
      await deleteTask(id);
      addToast("success", "Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      addToast("error", "Failed to delete task");
    }
  };

  const handleUpdateSubtasks = async (
    taskId: string,
    subtasks: Subtask[],
  ): Promise<void> => {
    try {
      await updateTask(taskId, { subtasks });
    } catch (error) {
      console.error("Error updating subtasks:", error);
      addToast("error", "Failed to update subtasks");
    }
  };

  const handleToggleSearch = (): void => {
    setIsSearchOpen((prev) => !prev);
    if (isSearchOpen) {
      setSearchQuery("");
    } else {
      // Switch to "All" filter when opening search
      setCurrentFilter("all");
    }
  };

  const handleFilterChange = (filter: TaskFilter): void => {
    setCurrentFilter(filter);
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return <LoadingSpinner size="lg" text="Loading..." fullScreen />;
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900">
      {/* Ambient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="ambient-orb absolute -right-40 -top-40 h-[500px] w-[500px] bg-indigo-400/25"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="ambient-orb absolute -bottom-40 -left-40 h-[500px] w-[500px] bg-violet-400/25"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="ambient-orb absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 bg-fuchsia-400/15"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Tasks Screen */}
      <main
        className={`relative z-10 pt-6 transition-opacity duration-300 md:pb-6 ${
          activeNav === 'tasks' ? 'opacity-100' : 'pointer-events-none absolute opacity-0'
        }`}
        style={{
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
        }}
      >
        <Container maxWidth="xl">
          {/* Welcome Section */}
          <section className="mb-6 px-2">
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-white/30 shadow-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="font-geometric mb-1 text-2xl font-bold text-white md:text-3xl">
                  Hello, {user.displayName || "User"}!
                </h1>
                <p className="text-sm font-medium text-white/70 md:text-base">
                  {tasks.filter((t) => !t.completed).length} active tasks
                </p>
              </div>
            </div>
          </section>

          {/* Search and Filter Section */}
          <section className="mb-4">
            {/* Action buttons row */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-geometric holographic-text text-2xl font-bold">
                My Tasks
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleToggleSearch}
                  className="glow-on-hover h-12 w-12 border border-white/10 bg-white/5 p-0 text-slate-300 backdrop-blur-xl hover:border-indigo-500/50 hover:bg-white/10 hover:text-white"
                  aria-label="Search"
                >
                  <SearchIcon className="h-8 w-8" />
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenTaskModal()}
                  className="gap-2 border border-indigo-500/30 bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">New Task</span>
                </Button>
              </div>
            </div>

            {/* Search container */}
            <SearchContainer
              isOpen={isSearchOpen}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Filter tabs */}
            {!isSearchOpen && (
              <FilterTabs
                activeFilter={currentFilter}
                onFilterChange={handleFilterChange}
              />
            )}
          </section>

          {/* Task List Section */}
          <section>
            <TaskList
              tasks={tasks}
              loading={tasksLoading}
              filter={currentFilter}
              searchQuery={debouncedSearchQuery}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleOpenTaskModal}
              onUpdateSubtasks={handleUpdateSubtasks}
            />
          </section>
        </Container>
      </main>

      {/* Settings Screen */}
      <Suspense fallback={null}>
        <div
          className={`fixed inset-0 z-10 transition-opacity duration-300 ${
            activeNav === 'settings' ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <SettingsScreen
            onShowToast={addToast}
            onSignOut={() => setActiveNav('tasks')}
          />
        </div>
      </Suspense>

      {/* Bottom Navigation */}
      <BottomNav activeItem={activeNav} onItemClick={setActiveNav} />

      {/* Task Modal - Lazy loaded */}
      <Suspense fallback={null}>
        <TaskModal
          key={editingTask?.id || "new"}
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          editingTask={editingTask}
          isSaving={isCreating}
        />
      </Suspense>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
