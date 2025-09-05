let timers = {};

// Handle messages from popup
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === "startTimer") {
    let { tabId, minutes } = msg;
    let alarmName = "timer_" + tabId;
    chrome.alarms.create(alarmName, { delayInMinutes: minutes });
    timers[alarmName] = tabId;
  }

  if (msg.action === "addTask") {
    // Retrieve tasks from storage, add the new task, and save back
    chrome.storage.local.get('tasks', (data) => {
        let tasks = data.tasks || [];
        tasks.push(msg.task);
        chrome.storage.local.set({ tasks });

        let taskTime = new Date(msg.task.time).getTime();
        let now = Date.now();
        let minutesUntil = (taskTime - now) / 60000;

        if (minutesUntil > 0) {
            // Notification alarm (1 min before meeting)
            if (minutesUntil > 1) {
                chrome.alarms.create("notify_" + msg.task.time, { delayInMinutes: minutesUntil - 1 });
            }
            // Open link at exact time
            chrome.alarms.create("task_" + msg.task.time, { delayInMinutes: minutesUntil });
        }
    });
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith("timer_")) {
    let tabId = timers[alarm.name];
    if (tabId) chrome.tabs.remove(tabId);
  }

  if (alarm.name.startsWith("notify_")) {
    // Get all tasks from storage to find the one that matches
    chrome.storage.local.get('tasks', (data) => {
        let tasks = data.tasks || [];
        let task = tasks.find(t => "notify_" + t.time === alarm.name);
        if (task) {
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icon.png",
                title: "Upcoming Meeting",
                message: `Your meeting "${task.name}" starts in 1 minute.`,
                priority: 2
            });
        }
    });
  }

  if (alarm.name.startsWith("task_")) {
    // Get all tasks from storage
    chrome.storage.local.get('tasks', (data) => {
        let tasks = data.tasks || [];
        let task = tasks.find(t => "task_" + t.time === alarm.name);
        if (task && task.link) {
            chrome.tabs.create({ url: task.link });
        }
    });
  }
});