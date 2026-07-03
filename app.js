// 1~40일 기본 스케줄 알고리즘 데이터 세팅
const defaultPlan = {};
const defaultDates = {}; 

for (let d = 1; d <= 40; d++) {
    defaultDates[d] = " (  /  )"; 
    if (d <= 3) {
        defaultPlan[d] = [{ text: `단어 DAY ${d}`, checked: false }];
    } else if (d <= 18) {
        defaultPlan[d] = [
            { text: `단어 DAY ${d}`, checked: false },
            { text: `토익 700+ DAY ${d + 2}`, checked: false },
            { text: "SQLD", checked: false }
        ];
    } else if (d <= 30) {
        defaultPlan[d] = [
            { text: `단어 DAY ${d}`, checked: false },
            { text: `토익 800+ DAY ${d - 18}`, checked: false },
            { text: "SQLD", checked: false }
        ];
    } else {
        const ranges = ["1-3", "4-6", "7-9", "10-12", "13-15", "16-18", "19-21", "22-24", "25-27", "28-30"];
        const rangeStr = ranges[d - 31];
        let toeicStr = `토익 800+ DAY ${d - 18}`;
        if (d === 39) toeicStr = "모의고사 1 (700+)";
        if (d === 40) toeicStr = "모의고사 2 (800+)";
        
        defaultPlan[d] = [
            { text: `모르는 단어 DAY ${rangeStr}`, checked: false },
            { text: toeicStr, checked: false },
            { text: "SQLD", checked: false }
        ];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('gridContainer');

    // 로컬 스토리지 불러오기
    let currentData = JSON.parse(localStorage.getItem('my_40day_plan')) || defaultPlan;
    let currentDates = JSON.parse(localStorage.getItem('my_40day_dates')) || defaultDates;

    // 1. 40일 플래너 보드 그리기
    gridContainer.innerHTML = "";
    Object.keys(currentData).forEach(day => {
        const card = document.createElement('div');
        card.className = 'day-card';
        
        const header = document.createElement('div');
        header.className = 'day-header';

        const badge = document.createElement('div');
        badge.className = 'day-badge';
        badge.textContent = `${day}DAY`;

        const dateSpan = document.createElement('div');
        dateSpan.className = 'day-date';
        dateSpan.contentEditable = true;
        dateSpan.textContent = currentDates[day] || " (  /  )";
        
        dateSpan.addEventListener('blur', () => {
            currentDates[day] = dateSpan.textContent;
            localStorage.setItem('my_40day_dates', JSON.stringify(currentDates));
        });

        header.appendChild(badge);
        header.appendChild(dateSpan);
        card.appendChild(header);

        const listContainer = document.createElement('div');
        listContainer.className = 'todo-list-container';

        currentData[day].forEach(item => {
            listContainer.appendChild(createTodoItemElement(day, item.text, item.checked));
        });

        card.appendChild(listContainer);
        gridContainer.appendChild(card);
    });

    // 2. 하단 다이내믹 편집 리스트 관리 (학습구성, 저녁이후)
    ['structureList', 'hobbyList'].forEach(id => {
        const listEl = document.getElementById(id);
        const storageKey = listEl.getAttribute('data-storage');
        const saved = JSON.parse(localStorage.getItem(storageKey));
        
        if (saved && saved.length > 0) {
            listEl.innerHTML = "";
            saved.forEach(text => {
                listEl.appendChild(createNewLi(text, storageKey));
            });
        }

        listEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'LI') {
                e.preventDefault();
                const newLi = createNewLi("", storageKey);
                e.target.after(newLi);
                newLi.focus();
            }
        });
    });

    // 3. 하루 루틴 섹션 관리
    const routineContainer = document.getElementById('routineContainer');
    const savedRoutine = JSON.parse(localStorage.getItem('my_routine_list'));
    if (savedRoutine && savedRoutine.length > 0) {
        routineContainer.innerHTML = "";
        savedRoutine.forEach(item => {
            routineContainer.appendChild(createRoutineRow(item.time, item.text));
        });
    }

    routineContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('routine-text')) {
            e.preventDefault();
            const newRow = createRoutineRow("", "");
            e.target.parentElement.after(newRow);
            newRow.querySelector('.routine-time').focus();
        }
    });


    // --- 내부 기능 제어 헬퍼 함수 엔진 ---
    function createTodoItemElement(day, text, checked) {
        const div = document.createElement('div');
        div.className = `todo-item ${checked ? 'checked' : ''}`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = checked;
        const span = document.createElement('div');
        span.className = 'todo-text';
        span.contentEditable = true;
        span.textContent = text;

        checkbox.addEventListener('change', () => {
            div.classList.toggle('checked', checkbox.checked);
            saveAllPlanData();
        });
        span.addEventListener('blur', () => {
            if (span.textContent.trim() === "") div.remove();
            saveAllPlanData();
        });
        span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (span.textContent.trim() === "") return;
                const newItem = createTodoItemElement(day, "", false);
                div.after(newItem);
                newItem.querySelector('.todo-text').focus();
            }
        });
        div.appendChild(checkbox);
        div.appendChild(span);
        return div;
    }

    function createNewLi(text, storageKey) {
        const li = document.createElement('li');
        li.contentEditable = true;
        li.textContent = text;
        li.addEventListener('blur', () => {
            if (li.textContent.trim() === "") li.remove();
            const listEl = document.querySelector(`[data-storage="${storageKey}"]`);
            const currentItems = Array.from(listEl.querySelectorAll('li')).map(el => el.textContent).filter(t => t.trim() !== "");
            localStorage.setItem(storageKey, JSON.stringify(currentItems));
        });
        return li;
    }

    function createRoutineRow(time, text) {
        const div = document.createElement('div');
        div.className = 'routine-item';
        div.innerHTML = `<span class="routine-time" contenteditable="true">${time}</span><span class="routine-text" contenteditable="true">${text}</span>`;
        
        const saveRoutine = () => {
            const rows = Array.from(routineContainer.querySelectorAll('.routine-item')).map(row => ({
                time: row.querySelector('.routine-time').textContent,
                text: row.querySelector('.routine-text').textContent
            })).filter(r => r.time.trim() !== "" || r.text.trim() !== "");
            localStorage.setItem('my_routine_list', JSON.stringify(rows));
        };

        div.querySelectorAll('[contenteditable]').forEach(el => {
            el.addEventListener('blur', () => {
                if (div.querySelector('.routine-time').textContent.trim() === "" && div.querySelector('.routine-text').textContent.trim() === "") {
                    div.remove();
                }
                saveRoutine();
            });
        });
        return div;
    }

    function saveAllPlanData() {
        const newData = {};
        document.querySelectorAll('.day-card').forEach(card => {
            const dayNum = card.querySelector('.day-badge').textContent.replace('DAY', '');
            newData[dayNum] = [];
            card.querySelectorAll('.todo-item').forEach(item => {
                const text = item.querySelector('.todo-text').textContent;
                const checked = item.querySelector('input[type="checkbox"]').checked;
                if (text.trim() !== "") newData[dayNum].push({ text, checked });
            });
        });
        localStorage.setItem('my_40day_plan', JSON.stringify(newData));
    }
});