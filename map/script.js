const map = L.map('map', {
  zoomControl: false // отключаем стандартные кнопки
}).setView([42.92, 74.60], 13);

// Добавляем зум в правый верх
L.control.zoom({
  position: 'topright'
}).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '' // или '&copy; OSM' если нужно
}).addTo(map);

const markerObjects = [];
const markerData = [];

function addMarker() {
  const shopValue = document.getElementById('shopList').value;
  const side = document.getElementById('side').value;

  if (!shopValue) {
    alert("Выберите магазин из списка.");
    return;
  }

  const [lat, lon, rawName] = shopValue.split(',');
  const text = decodeURIComponent(rawName.trim());

  markerData.push(`${lat},${lon},${encodeURIComponent(text)},${side}`);
  const marker = addShopMarker(parseFloat(lat), parseFloat(lon), text, side);
  markerObjects.push({ text, marker });

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
  const link = `index.html?m=${markerData.join(';')}`;
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

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'Удалить';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      map.removeLayer(marker);
      const index = markerObjects.findIndex(obj => obj.marker === marker);
      if (index !== -1) {
        markerObjects.splice(index, 1);
        markerData.splice(index, 1);
        updateMarkerList();
        generateLink();
      }
    });

    wrapper.appendChild(deleteBtn);

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
