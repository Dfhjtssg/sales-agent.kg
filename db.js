let db;
let SQL;
const owner = "Dfhjtssg";
const repo = "sqlite-db";
const filePath = "database.db";

async function loadDatabase() {
  const token = "******************";
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    headers: { 'Authorization': `token ${token}` }
  });

  if (!res.ok) {
    alert("Ошибка авторизации или доступа к файлу. Проверь токен и права доступа.");
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

async function saveDatabase() {
  if (!db) {
    alert("База данных ещё не загружена!");
    return;
  }
  const token = "******************";
  const binaryArray = db.export();
  const content = btoa(String.fromCharCode(...binaryArray));

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    headers: { 'Authorization': `token ${token}` }
  });

  if (!res.ok) {
    alert("Не удалось получить SHA-файл. Проверь токен и права доступа.");
    return;
  }

  const data = await res.json();
  const sha = data.sha;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: "Обновление базы через веб-интерфейс",
      content: content,
      sha: sha
    })
  });

  if (response.ok) {
    alert("База данных сохранена в GitHub");
  } else {
    alert("Ошибка при сохранении базы. Проверь токен и SHA.");
  }
}

loadDatabase();