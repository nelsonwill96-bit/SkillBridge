function sampleData() {
    return {
        employees: ["Alex", "Jordan", "Morgan", "Taylor"],
        tasks: [
            {name: "Network Administration", qualified: ["Alex"]},
            {name: "Database Maintenance", qualified: ["Alex", "Jordan"]},
            {name: "Technical Documentation", qualified: ["Jordan", "Morgan", "Taylor"]},
            {name: "System Troubleshooting", qualified: ["Alex", "Morgan"]}
        ]
    };
}
let data = sampleData();
let absent = [];
const storageKey = "skillbridge-simple-v1";
try {
    const saved = localStorage.getItem(storageKey);
    if (saved) data = JSON.parse(saved);
} catch (error) {
    data = sampleData();
}
function get(id) {
    return document.getElementById(id);
}
function saveData() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        get("message").textContent = "Changes saved in this browser.";
    } catch (error) {
        get("message").textContent = "Browser storage unavailable. Changes are temporary.";
    }
}
function makeCheckbox(name, checked, change) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", function() { change(input.checked); });
    label.append(input, " " + name);
    return label;
}
function makeButton(text, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", action);
    return button;
}
function showEmployees() {
    get("employees").replaceChildren();
    data.employees.forEach(function(name) {
        const row = document.createElement("div");
        row.className = "employee";
        row.append(makeCheckbox(name + " unavailable", absent.includes(name), function(checked) {
            if (checked) absent.push(name);
            else absent = absent.filter(function(person) { return person !== name; });
            showResults();
        }));
        row.append(makeButton("Remove", function() {
            data.employees = data.employees.filter(function(person) { return person !== name; });
            absent = absent.filter(function(person) { return person !== name; });
            data.tasks.forEach(function(task) {
                task.qualified = task.qualified.filter(function(person) { return person !== name; });
            });
            saveData();
            display();
        }));
        get("employees").append(row);
    });
}
function showTasks() {
    get("tasks").replaceChildren();
    data.tasks.forEach(function(task, index) {
        const box = document.createElement("fieldset");
        const title = document.createElement("legend");
        title.textContent = task.name;
        box.append(title);
        data.employees.forEach(function(name) {
            box.append(makeCheckbox(name, task.qualified.includes(name), function(checked) {
                if (checked) task.qualified.push(name);
                else task.qualified = task.qualified.filter(function(person) { return person !== name; });
                saveData();
                showResults();
            }));
        });
        box.append(makeButton("Remove Task", function() {
            data.tasks.splice(index, 1);
            saveData();
            display();
        }));
        get("tasks").append(box);
    });
}
function calculateCoverage(task) {
    const qualified = data.employees.filter(function(name) { return task.qualified.includes(name); });
    const available = qualified.filter(function(name) { return !absent.includes(name); });
    let status = "No Coverage";
    let color = "none";
    if (available.length >= 2) { status = "Covered"; color = "covered"; }
    else if (available.length === 1) { status = "At Risk"; color = "risk"; }
    return {qualified: qualified.length, available: available.length, status: status, color: color};
}
function showResults() {
    const body = get("results");
    const recommendations = get("recommendations");
    body.replaceChildren();
    recommendations.replaceChildren();
    let covered = 0;
    let risk = 0;
    let none = 0;
    data.tasks.forEach(function(task) {
        const result = calculateCoverage(task);
        const row = body.insertRow();
        [task.name, result.qualified, result.available, result.status].forEach(function(value) {
            row.insertCell().textContent = value;
        });
        row.cells[3].className = result.color;
        if (result.color === "covered") covered++;
        else {
            if (result.color === "risk") risk++;
            else none++;
            const item = document.createElement("li");
            const candidates = data.employees.filter(function(name) {
                return !task.qualified.includes(name) && !absent.includes(name);
            });
            item.textContent = task.name + ": Review backup coverage and consider cross-training. " +
                (candidates.length ? "Potential candidates: " + candidates.join(", ") + "." : "No available unqualified candidates.");
            recommendations.append(item);
        }
    });
    get("summary").textContent = "Covered: " + covered + " | At Risk: " + risk + " | No Coverage: " + none;
    if (!recommendations.children.length) {
        const item = document.createElement("li");
        item.textContent = data.tasks.length ? "All tasks have backup coverage." : "Add a responsibility to get recommendations.";
        recommendations.append(item);
    }
}
function display() {
    showEmployees();
    showTasks();
    showResults();
}
get("employeeForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const name = get("employeeName").value.trim();
    if (!name || data.employees.some(function(person) { return person.toLowerCase() === name.toLowerCase(); })) {
        get("message").textContent = "Enter a new employee name.";
        return;
    }
    data.employees.push(name);
    get("employeeName").value = "";
    saveData();
    display();
});
get("taskForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const name = get("taskName").value.trim();
    if (!name || data.tasks.some(function(task) { return task.name.toLowerCase() === name.toLowerCase(); })) {
        get("message").textContent = "Enter a new responsibility name.";
        return;
    }
    data.tasks.push({name: name, qualified: []});
    get("taskName").value = "";
    saveData();
    display();
});
get("reset").addEventListener("click", function() {
    absent = [];
    display();
});
get("restore").addEventListener("click", function() {
    if (confirm("Replace current entries with the sample data?")) {
        data = sampleData();
        absent = [];
        saveData();
        display();
    }
});
display();
