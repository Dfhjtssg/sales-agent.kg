let db;
let SQL;
const owner = "Dfhjtssg";
const repo = "sales-agent.kg";
const filePath = "database.db";

// Загружаем базу данных из GitHub
async function loadDatabase() {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`);
  if (!res.ok) {
    alert("Ошибка загрузки базы. Проверь доступ к файлу.");
    return;
  }

  const data = await res.json();
  if (!data.content) {
    alert("Файл database.db не найден или доступ запрещён.");
    return;
  }

  const binary = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
  SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}` });
  db = new SQL.Database(binary);

  db.run(`CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object TEXT,
    day TEXT,
    shop_name TEXT
  );`);

  displayTable();
}

// Показываем данные в таблице
function displayTable() {
  if (!db) return;
  const table = document.querySelector('#data-table tbody');
  table.innerHTML = '';

  let res;
  try {
    res = db.exec("SELECT * FROM shops")[0];
  } catch (e) {
    console.error("Ошибка при чтении таблицы shops:", e);
    return;
  }

  if (!res) return;

  res.values.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });

    const btn = document.createElement('button');
    btn.textContent = 'Удалить';
    btn.onclick = () => {
      db.run("DELETE FROM shops WHERE id = ?", [row[0]]);
      displayTable();
    };

    const td = document.createElement('td');
    td.appendChild(btn);
    tr.appendChild(td);
    table.appendChild(tr);
  });
}

// Добавление записи
function addEntry() {
  if (!db) {
    alert("База данных ещё не загружена!");
    return;
  }
  const object = document.getElementById('object').value;
  const day = document.getElementById('day').value;
  const shop = document.getElementById('shop').value;
  if (object && day && shop) {
    db.run("INSERT INTO shops (object, day, shop_name) VALUES (?, ?, ?)", [object, day, shop]);
    displayTable();
  }
}

// Сохранение базы через GitHub Actions
async function saveDatabase() {
  if (!db) {
    alert("База данных ещё не загружена!");
    return;
  }

  const binaryArray = db.export();
  const content = btoa(String.fromCharCode(...binaryArray));
  const token = prompt("Введите временный GitHub токен (только с правом actions:workflow_dispatch):");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/update-db.yml/dispatches`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        base64content: content,
        message: "Обновление базы через интерфейс"
      }
    })
  });

  if (response.ok) {
    alert("База данных отправлена на сохранение. Обновление произойдёт через минуту.");
  } else {
    alert("Ошибка при вызове GitHub Actions. Проверь токен и настройки workflow.");
    console.error(await response.json());
  }
}

loadDatabase();
