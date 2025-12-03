const map = L.map('map', {
  zoomControl: false
}).setView([42.847044, 74.585774], 13);

L.control.zoom({
  position: 'topright'
}).addTo(map);
// https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1  https://tile.openstreetmap.org/{z}/{x}/{y}.png
L.tileLayer('https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
  attribution: ''
}).addTo(map);

const markerObjects = [];
const markerData = [];

function addMarker() {
  const lat = parseFloat(document.getElementById('lat').value.trim());
  const lon = parseFloat(document.getElementById('lon').value.trim());
  const textRaw = document.getElementById('text').value.trim();
  const text = encodeURIComponent(textRaw);
  const side = document.getElementById('side').value;

  if (isNaN(lat) || isNaN(lon) || !textRaw) {
    alert("Пожалуйста, заполните все поля правильно.");
    return;
  }

  markerData.push(`${lat},${lon},${text},${side}`);
  const marker = addShopMarker(lat, lon, decodeURIComponent(text), side);
  markerObjects.push({ text: decodeURIComponent(text), marker });

  updateMarkerList();
  generateLink();
}

function updateMarkerList() {
  const select = document.getElementById('markerList');
  select.innerHTML = '';
  markerObjects.forEach((m, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = m.text;
    select.appendChild(option);
  });
}

function removeSelectedMarker() {
  const select = document.getElementById('markerList');
  const index = parseInt(select.value);
  if (!isNaN(index)) {
    map.removeLayer(markerObjects[index].marker);
    markerObjects.splice(index, 1);
    markerData.splice(index, 1);
    updateMarkerList();
    generateLink();
  }
}

function generateLink() {
  const link = `https://dfhjtssg.github.io/arto-map/index.html?m=${markerData.join(';')}`;
  document.getElementById('output').value = link;
}

function addShopMarker(lat, lon, text, initialDirection = 'up') {
  const dirs = ['up', 'right', 'down', 'left'];
  let directionIndex = dirs.indexOf(initialDirection);
  if (directionIndex === -1) directionIndex = 0;

  let marker = createMarker(lat, lon, text, dirs[directionIndex]);
  marker.addTo(map);

  function createMarker(lat, lon, text, direction) {
    const wrapper = document.createElement('div');
    wrapper.className = `shop-marker marker-${direction}`;

    const label = document.createElement('div');
    label.className = 'label-text';
    label.textContent = text;

    const triangle = document.createElement('div');
    triangle.className = 'triangle';

 

    

    if (direction === 'left') {
      wrapper.append(triangle, label);
    } else if (direction === 'right') {
      wrapper.append(label, triangle);
    } else {
      wrapper.append(label, triangle);
    }

    wrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      map.removeLayer(marker);
      directionIndex = (directionIndex + 1) % dirs.length;
      marker = createMarker(lat, lon, text, dirs[directionIndex]);
      marker.addTo(map);
    });

    wrapper.style.position = 'absolute';
    wrapper.style.visibility = 'hidden';
    document.body.appendChild(wrapper);
    const { width, height } = wrapper.getBoundingClientRect();
    document.body.removeChild(wrapper);
    wrapper.style.position = '';
    wrapper.style.visibility = '';

    const anchorMap = {
      up:    [ width / 2, height ],
      down:  [ width / 2, 0 ],
      right: [ 0, height / 2 ],
      left:  [ width, height / 2 ]
    };

    const icon = L.divIcon({
      html: wrapper,
      className: '',
      iconSize: [ width, height ],
      iconAnchor: anchorMap[direction]
    });

    return L.marker([lat, lon], { icon });
  }

  return marker;
}

function copyToClipboard(text) {
  // Используем API буфера обмена, если доступен
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Фолбэк для менее современных браузеров
    let textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Скрыть элемент, чтобы он не был виден на странице
    textArea.style.position = "fixed";
    textArea.style.top = "-1000px";
    textArea.style.left = "-1000px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Не удалось скопировать текст: ", err);
    }

    document.body.removeChild(textArea);
    return Promise.resolve(); // для единообразия с Clipboard API
  }
}

