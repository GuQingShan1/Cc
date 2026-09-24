# 🌸 Cultivation Schedule App 🌸

A gamified task scheduling and daily planner app with a cultivation/progression system. Organize your week, complete tasks, and progress through cultivation stages while earning Qi and unlocking titles!

## Features

### 📅 Weekly Schedule
- Plan tasks for each day of the week (Monday-Sunday)
- Add task titles, detailed notes, and custom Qi rewards
- Mark tasks as complete to earn rewards
- Delete tasks you no longer need
- Clean, intuitive interface for viewing and managing daily tasks

### ⚡ Cultivation Progression System
- **Qi System**: Earn Qi points by completing tasks
- **Cultivation Stages**: Progress through 6 stages:
  1. Mortal (Foundation)
  2. Foundation Building (50 EXP)
  3. Core Formation (150 EXP)
  4. Tribulation Transcendence (300 EXP)
  5. Immortal Ascension (500 EXP)
  6. Heavenly Emperor (800 EXP)

### ⚔️ Tribulations & Breakthroughs
- **Tribulations**: Triggered when you reach EXP thresholds (50, 150, 300, 500)
  - 60% success rate when triggered
  - Success: +20 bonus Qi
  - Failure: Lose 10% of current Qi (keep pushing, cultivator!)
- **Breakthroughs**: Automatically occur when advancing to new cultivation stages
  - Gain +50 bonus Qi
  - Unlock new titles

### 🏆 Achievement Titles
Unlock special titles through accomplishments:
- **Task Conqueror**: Complete 10 tasks
- **Qi Warrior**: Earn 100 Qi
- **Disciplined Cultivator**: Complete 25 tasks
- **Path of Ascension**: Complete 50 tasks
- **Unshakeable Will**: Complete 100 tasks
- **Plus stage-specific titles** from breakthroughs!

### 📊 Status Tracking
- Real-time Qi display
- Current cultivation level and progress bar
- Tasks completed counter
- Title showcase
- Event log showing recent achievements and tribulations

## How to Use

1. **Open** `index.html` in your web browser
2. **Select a day** from the day selector to view or add tasks for that day
3. **Add tasks** by clicking the "Add Task" button:
   - Enter task title (required)
   - Add optional notes
   - Set Qi reward (default: 10)
4. **Complete tasks** by clicking on the task or checkbox - you'll immediately gain Qi!
5. **Watch for events** in the event log:
   - Task completions
   - Tribulation triggers
   - Breakthroughs
   - Title unlocks
6. **Progress** through cultivation stages and aim for Heavenly Emperor!

## Game Mechanics

### Earning Qi
- Each task you create has a customizable Qi reward
- Completing tasks instantly awards that Qi
- Bonus Qi from:
  - Passing tribulations: +20
  - Breakthroughs: +50

### Tribulations
At certain EXP thresholds, tribulations are triggered:
- When you reach 50, 150, 300, or 500 EXP
- 60% success chance (40% failure chance)
- Success = risk/reward mechanic to keep climbing
- Failure encourages persistence

### Breakthroughs
When you accumulate enough EXP to reach the next cultivation stage:
- Automatically triggered with celebration
- +50 bonus Qi awarded
- New stage title unlocked
- Visual notification in event log

## Data Storage

All your progress is saved locally in your browser using `localStorage`. Your data persists even after closing the app!

To reset your progress, clear your browser's local storage for this page.

## Customization

You can customize:
- **Task Qi rewards**: Set any value from 1-100 when creating tasks
- **Task notes**: Add detailed descriptions or reminders
- **Weekly organization**: Plan different tasks for each day

## Mobile Responsive

The app is fully responsive and works great on:
- Desktop browsers
- Tablets
- Mobile phones

## Tips for Cultivators

✨ **Strategy Tips**:
1. Create realistic tasks you can complete daily
2. Set Qi rewards based on task difficulty
3. Regular small completions beat sporadic large ones
4. Watch for tribulation warnings as you approach milestones
5. Aim for specific titles to stay motivated

## Browser Compatibility

Works on modern browsers with ES6 support and localStorage:
- Chrome/Chromium
- Firefox
- Safari
- Edge

Enjoy your journey to becoming a Heavenly Emperor! 🌟
