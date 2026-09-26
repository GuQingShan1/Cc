// Cultivation Schedule App - Game State and Logic

const CULTIVATION_STAGES = [
    { name: 'Mortal', minExp: 0, title: 'Mundane Wanderer' },
    { name: 'Foundation Building', minExp: 50, title: 'Student of the Way' },
    { name: 'Core Formation', minExp: 150, title: 'Cultivator\'s Pride' },
    { name: 'Tribulation Transcendence', minExp: 300, title: 'Heavens\' Chosen' },
    { name: 'Immortal Ascension', minExp: 500, title: 'Celestial Being' },
    { name: 'Heavenly Emperor', minExp: 800, title: 'Ruler of the Realms' },
];

const TRIBULATION_THRESHOLDS = [50, 150, 300, 500];

const TITLE_THRESHOLDS = {
    'Task Conqueror': 10,
    'Qi Warrior': 100,
    'Disciplined Cultivator': 25,
    'Path of Ascension': 50,
    'Unshakeable Will': 100,
};

class CultivationScheduleApp {
    constructor() {
        this.data = this.loadData();
        this.currentDay = (new Date().getDay() + 6) % 7;
        this.eventLog = [];
        this.init();
    }

    loadData() {
        const saved = localStorage.getItem('cultivationData');
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            qi: 0,
            exp: 0,
            tasksCompleted: 0,
            titles: [],
            schedule: this.initializeSchedule(),
            lastTribulation: -1,
            lastBreakthrough: -1,
        };
    }

    saveData() {
        localStorage.setItem('cultivationData', JSON.stringify(this.data));
    }

    initializeSchedule() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.reduce((acc, day) => {
            acc[day] = [];
            return acc;
        }, {});
    }

    getCurrentDayName() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[this.currentDay];
    }

    getCultivationLevel() {
        for (let i = CULTIVATION_STAGES.length - 1; i >= 0; i--) {
            if (this.data.exp >= CULTIVATION_STAGES[i].minExp) {
                return CULTIVATION_STAGES[i];
            }
        }
        return CULTIVATION_STAGES[0];
    }

    getNextLevel() {
        const currentLevel = this.getCultivationLevel();
        const currentIndex = CULTIVATION_STAGES.findIndex(s => s.name === currentLevel.name);
        if (currentIndex < CULTIVATION_STAGES.length - 1) {
            return CULTIVATION_STAGES[currentIndex + 1];
        }
        return null;
    }

    getProgressToNextLevel() {
        const nextLevel = this.getNextLevel();
        if (!nextLevel) return { current: 0, max: 0, percent: 100 };

        const currentMin = this.getCultivationLevel().minExp;
        const nextMin = nextLevel.minExp;
        const current = this.data.exp - currentMin;
        const max = nextMin - currentMin;

        return {
            current,
            max,
            percent: Math.min(100, Math.max(0, (current / max) * 100)),
        };
    }

    addTask(day, taskData) {
        const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day];
        const task = {
            id: Date.now(),
            title: taskData.title,
            note: taskData.note,
            qi: taskData.qi,
            completed: false,
        };
        this.data.schedule[dayName].push(task);
        this.saveData();
        return task;
    }

    deleteTask(day, taskId) {
        const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day];
        this.data.schedule[dayName] = this.data.schedule[dayName].filter(t => t.id !== taskId);
        this.saveData();
    }

    completeTask(day, taskId) {
        const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day];
        const task = this.data.schedule[dayName].find(t => t.id === taskId);

        if (task && !task.completed) {
            task.completed = true;
            this.data.qi += task.qi;
            this.data.exp += task.qi;
            this.data.tasksCompleted++;

            this.addEvent(`+${task.qi} Qi from "${task.title}"`, 'positive');

            // Check for tribulations
            this.checkTribulations();

            // Check for breakthroughs
            this.checkBreakthroughs();

            // Check for new titles
            this.checkTitles();

            this.saveData();
            this.render();
        }
    }

    checkTribulations() {
        const currentLevel = this.getCultivationLevel();
        const currentIndex = CULTIVATION_STAGES.findIndex(s => s.name === currentLevel.name);

        for (let i = 0; i < TRIBULATION_THRESHOLDS.length; i++) {
            const threshold = TRIBULATION_THRESHOLDS[i];
            if (
                this.data.exp >= threshold &&
                this.data.lastTribulation < i
            ) {
                this.triggerTribulation(i + 1, threshold);
                this.data.lastTribulation = i;
                break;
            }
        }
    }

    triggerTribulation(number, expThreshold) {
        const tribulationChance = 0.4;
        const success = Math.random() > tribulationChance;

        if (success) {
            this.data.qi += 20;
            this.addEvent(
                `⚡ Tribulation ${number} CONQUERED! Gained 20 bonus Qi!`,
                'positive'
            );
        } else {
            const penalty = Math.floor(this.data.qi * 0.1);
            this.data.qi = Math.max(0, this.data.qi - penalty);
            this.addEvent(
                `⚠️ Tribulation ${number} Failed! Lost ${penalty} Qi. Persevere, cultivator!`,
                'negative'
            );
        }
    }

    checkBreakthroughs() {
        const nextLevel = this.getNextLevel();
        if (nextLevel && this.data.exp >= nextLevel.minExp) {
            const currentLevel = this.getCultivationLevel();
            const nextIndex = CULTIVATION_STAGES.findIndex(s => s.name === nextLevel.name);

            if (this.data.lastBreakthrough !== nextIndex) {
                this.triggerBreakthrough(nextLevel);
                this.data.lastBreakthrough = nextIndex;
            }
        }
    }

    triggerBreakthrough(level) {
        this.data.qi += 50;
        this.addEvent(
            `✨ BREAKTHROUGH! Reached ${level.name}! New title: "${level.title}" Obtained 50 bonus Qi!`,
            'positive'
        );

        if (!this.data.titles.includes(level.title)) {
            this.data.titles.push(level.title);
        }
    }

    checkTitles() {
        for (const [title, threshold] of Object.entries(TITLE_THRESHOLDS)) {
            if (
                this.data.tasksCompleted >= threshold &&
                !this.data.titles.includes(title)
            ) {
                this.data.titles.push(title);
                this.addEvent(
                    `🏆 New Title Unlocked: "${title}"!`,
                    'positive'
                );
            }
        }
    }

    addEvent(message, type = 'neutral') {
        const timestamp = new Date().toLocaleTimeString();
        this.eventLog.unshift({ message, type, timestamp });
        if (this.eventLog.length > 20) {
            this.eventLog.pop();
        }
    }

    init() {
        this.addEvent('Welcome, cultivator. Begin your journey to ascension!', 'positive');
        this.render();
    }

    render() {
        const root = document.getElementById('root');
        root.innerHTML = this.getTemplate();
        this.attachEventListeners();
    }

    getTemplate() {
        const currentLevel = this.getCultivationLevel();
        const nextLevel = this.getNextLevel();
        const progress = this.getProgressToNextLevel();
        const currentDayName = this.getCurrentDayName();
        const currentDayTasks = this.data.schedule[currentDayName];

        return `
            <header>
                <div class="container">
                    <h1>🌸 Cultivation Schedule 🌸</h1>
                    <p class="header-subtitle">Your path to transcendence through disciplined daily cultivation</p>
                </div>
            </header>

            <div class="container">
                <div class="main-grid">
                    <div>
                        <div class="card">
                            <h2>📅 Weekly Schedule</h2>

                            <div class="day-selector">
                                ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                    .map((day, i) => `
                                        <button class="day-btn ${i === this.currentDay ? 'active' : ''}"
                                                data-day="${i}">
                                            ${day.substring(0, 3)}
                                        </button>
                                    `)
                                    .join('')}
                            </div>

                            <div class="tasks-container">
                                ${currentDayTasks.length === 0
                                    ? `<div class="empty-state">
                                        <div class="empty-state-icon">📝</div>
                                        <p>No tasks yet. Add one to begin your cultivation!</p>
                                    </div>`
                                    : currentDayTasks.map((task) => `
                                        <div class="task-item ${task.completed ? 'completed' : ''}">
                                            <div class="task-checkbox" data-task-id="${task.id}" data-day="${this.currentDay}">
                                                ${task.completed ? '✓' : ''}
                                            </div>
                                            <div class="task-content" data-task-id="${task.id}" data-day="${this.currentDay}">
                                                <div class="task-title">${task.title}</div>
                                                ${task.note ? `<div class="task-note">📌 ${task.note}</div>` : ''}
                                                <div class="task-qi"><span class="qi-indicator"></span>${task.qi} Qi</div>
                                            </div>
                                            <div class="task-actions">
                                                <button class="btn-icon delete" data-task-id="${task.id}" data-day="${this.currentDay}">🗑️</button>
                                            </div>
                                        </div>
                                    `).join('')}
                            </div>

                            <button class="btn-primary" id="addTaskBtn" style="margin-top: 20px;">+ Add Task</button>
                        </div>
                    </div>

                    <div>
                        <div class="card highlight">
                            <h2>⚡ Cultivation Status</h2>

                            <div class="stats-container">
                                <div class="stat-box">
                                    <div class="stat-label">Current Qi</div>
                                    <div class="stat-value qi-value">${this.data.qi}</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-label">Tasks Done</div>
                                    <div class="stat-value">${this.data.tasksCompleted}</div>
                                </div>
                            </div>

                            <div class="cultivation-level">
                                <div class="level-name">${currentLevel.name}</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progress.percent}%"></div>
                                </div>
                                <div class="progress-text">
                                    ${progress.current} / ${progress.max} EXP
                                </div>
                            </div>

                            ${this.data.titles.length > 0
                                ? `<div style="margin-bottom: 15px;">
                                    <div style="font-size: 0.9em; color: var(--text-dim); margin-bottom: 8px; text-transform: uppercase;">Titles Earned</div>
                                    <div>${this.data.titles.map(title => `<div class="title-badge">${title}</div>`).join('')}</div>
                                </div>`
                                : ''}

                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(139, 92, 246, 0.2);">
                                <div style="font-size: 0.9em; color: var(--text-dim); margin-bottom: 10px; text-transform: uppercase;">Recent Events</div>
                                <div class="event-log">
                                    ${this.eventLog.map(event => `
                                        <div class="event-item ${event.type}">
                                            ${event.message}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <h2>💡 Tips</h2>
                            <div style="font-size: 0.9em; color: var(--text-dim); line-height: 1.6;">
                                <p>✨ Complete tasks to gain Qi</p>
                                <p>📈 Reach exp thresholds to trigger Tribulations</p>
                                <p>⭐ Pass Tribulations for bonus Qi</p>
                                <p>🌟 Reach Breakthroughs to ascend</p>
                                <p>🏆 Collect titles for achievements</p>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.renderBreakthroughWarning()}
            </div>

            ${this.renderAddTaskModal()}
        `;
    }

    renderBreakthroughWarning() {
        const nextLevel = this.getNextLevel();
        const progress = this.getProgressToNextLevel();

        if (!nextLevel) {
            return `<div class="breakthrough-celebration" style="text-align: center; margin-bottom: 30px;">
                ✨ You have reached the peak of cultivation! Heavenly Emperor! ✨
            </div>`;
        }

        if (progress.percent > 80) {
            return `<div class="tribulation-warning" style="margin-bottom: 30px;">
                ⚠️ Caution: You approach ${nextLevel.name}! A breakthrough tribulation awaits!
            </div>`;
        }

        return '';
    }

    renderAddTaskModal() {
        return `
            <div id="taskModal" class="modal-overlay">
                <div class="modal">
                    <h3>➕ Add New Task</h3>
                    <div class="form-group">
                        <label for="taskTitle">Task Title</label>
                        <input type="text" id="taskTitle" placeholder="e.g., Morning Meditation">
                    </div>
                    <div class="form-group">
                        <label for="taskNote">Notes (optional)</label>
                        <textarea id="taskNote" placeholder="Add any details about this task..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="taskQi">Qi Reward</label>
                        <input type="number" id="taskQi" min="1" max="100" value="10" placeholder="10">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button class="btn-secondary" id="cancelTaskBtn">Cancel</button>
                        <button class="btn-primary" id="submitTaskBtn">Create Task</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Day selector
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentDay = parseInt(e.target.dataset.day);
                this.render();
            });
        });

        // Task checkbox and title click
        document.querySelectorAll('.task-checkbox, .task-content').forEach(el => {
            el.addEventListener('click', (e) => {
                const taskId = parseInt(e.currentTarget.dataset.taskId);
                const day = parseInt(e.currentTarget.dataset.day);
                this.completeTask(day, taskId);
            });
        });

        // Delete task
        document.querySelectorAll('.btn-icon.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.currentTarget.dataset.taskId);
                const day = parseInt(e.currentTarget.dataset.day);
                this.deleteTask(day, taskId);
                this.render();
            });
        });

        // Add task button
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                document.getElementById('taskModal').classList.add('active');
            });
        }

        // Modal controls
        const taskModal = document.getElementById('taskModal');
        const cancelBtn = document.getElementById('cancelTaskBtn');
        const submitBtn = document.getElementById('submitTaskBtn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                taskModal.classList.remove('active');
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const title = document.getElementById('taskTitle').value.trim();
                const note = document.getElementById('taskNote').value.trim();
                const qi = parseInt(document.getElementById('taskQi').value) || 10;

                if (title) {
                    this.addTask(this.currentDay, { title, note, qi });
                    document.getElementById('taskTitle').value = '';
                    document.getElementById('taskNote').value = '';
                    document.getElementById('taskQi').value = '10';
                    taskModal.classList.remove('active');
                    this.render();
                }
            });
        }

        // Close modal on overlay click
        if (taskModal) {
            taskModal.addEventListener('click', (e) => {
                if (e.target === taskModal) {
                    taskModal.classList.remove('active');
                }
            });
        }

        // Allow Enter key to submit
        const taskTitleInput = document.getElementById('taskTitle');
        if (taskTitleInput) {
            taskTitleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitBtn.click();
                }
            });
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CultivationScheduleApp();
});
