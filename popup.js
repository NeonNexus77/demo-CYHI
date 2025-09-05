// Function to update the task list UI from storage
const renderTasks = () => {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = '';
  chrome.storage.local.get('tasks', (data) => {
    let tasks = data.tasks || [];
    if (tasks.length === 0) {
      taskList.innerHTML = '<li style="font-style: italic; color: #777;">No tasks scheduled.</li>';
    } else {
      tasks.forEach((task) => {
        let li = document.createElement("li");
        li.textContent = `${task.name} @ ${new Date(task.time).toLocaleString()}`;
        taskList.appendChild(li);
      });
    }
  });
};

// Start timer for current website
document.getElementById("startTimer").addEventListener("click", async () => {
  let minutes = parseInt(document.getElementById("timerMinutes").value);
  if (!minutes || minutes <= 0) {
    document.getElementById("timerMessage").textContent = "Please enter a positive number of minutes.";
    return;
  }
  document.getElementById("timerMessage").textContent = ""; // Clear message

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({ action: "startTimer", tabId: tab.id, minutes });
});

// Add task
document.getElementById("addTask").addEventListener("click", () => {
  let taskName = document.getElementById("taskName").value;
  let taskTime = document.getElementById("taskTime").value;
  let taskLink = document.getElementById("taskLink").value;
  const schedulerMessage = document.getElementById("schedulerMessage");

  if (!taskName || !taskTime) {
    schedulerMessage.textContent = "Task name and time are required.";
    return;
  }
  schedulerMessage.textContent = ""; // Clear message

  chrome.runtime.sendMessage({
    action: "addTask",
    task: { name: taskName, time: taskTime, link: taskLink }
  }, () => {
    // Clear input fields after successful send
    document.getElementById("taskName").value = '';
    document.getElementById("taskTime").value = '';
    document.getElementById("taskLink").value = '';
    renderTasks();
  });
});

// Summarize document
document.getElementById("summarizeDoc").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  document.getElementById("summaryResult").innerText = "Summarizing...";
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  }, (results) => {
    let text = results[0].result;
    // This is a very simple summary; for a real extension, use a more advanced algorithm.
    let summary = text.split(". ").slice(0, 5).join(". ") + "...";
    document.getElementById("summaryResult").innerText = summary;
  });
});

// Initial render of tasks when the popup opens
renderTasks();