const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x071826, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x071826, 24, 42);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
camera.position.set(10, 12, 16);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const directional = new THREE.DirectionalLight(0xbfe9ff, 1.2);
directional.position.set(12, 18, 10);
scene.add(directional);

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(16, 0.6, 12),
  new THREE.MeshStandardMaterial({ color: 0x2f495d, roughness: 0.9, metalness: 0.1 })
);
floor.position.y = -2.2;
scene.add(floor);

const slab = new THREE.Mesh(
  new THREE.BoxGeometry(13, 0.4, 9),
  new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.7, metalness: 0.3 })
);
slab.position.y = -1.8;
scene.add(slab);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, metalness: 0.2 });
const wall1 = new THREE.Mesh(new THREE.BoxGeometry(13.5, 3.5, 0.4), wallMat);
wall1.position.set(0, 0.7, -4.8);
scene.add(wall1);

const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.5, 9.5), wallMat);
wall2.position.set(-6.5, 0.7, 0);
scene.add(wall2);

const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.5, 9), wallMat);
wall3.position.set(6.5, 0.7, 0);
scene.add(wall3);

const pipeMaterial = new THREE.MeshStandardMaterial({
  color: 0xe11d48,
  emissive: 0x7f1d1d,
  emissiveIntensity: 0.9,
  roughness: 0.5,
  metalness: 0.8
});

const pipeGroup = new THREE.Group();
scene.add(pipeGroup);

const pipeData = [];
const pipeCount = 10;
for (let i = 0; i < pipeCount; i++) {
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 12, 20), pipeMaterial);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(-5 + i * 1.1, -1.1, 0);
  pipeGroup.add(pipe);
  pipeData.push(pipe);
}

const heatField = new THREE.Group();
scene.add(heatField);

const fieldMeshes = [];
for (let x = -5; x <= 5; x += 1) {
  for (let z = -3.5; z <= 3.5; z += 1) {
    const cell = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.12, 0.8),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.32,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.2
      })
    );
    cell.position.set(x, -1.45, z);
    heatField.add(cell);
    fieldMeshes.push(cell);
  }
}

const tempSlider = document.getElementById('tempSlider');
const flowSlider = document.getElementById('flowSlider');
const roomTempSlider = document.getElementById('roomTempSlider');
const spacingSlider = document.getElementById('spacingSlider');

const tempValue = document.getElementById('tempValue');
const flowValue = document.getElementById('flowValue');
const roomTempValue = document.getElementById('roomTempValue');
const spacingValue = document.getElementById('spacingValue');

const heatOutputEl = document.getElementById('heatOutput');
const surfaceTempEl = document.getElementById('surfaceTemp');
const efficiencyEl = document.getElementById('efficiency');
const pressureDropEl = document.getElementById('pressureDrop');

const kpiHeatEl = document.getElementById('kpiHeat');
const kpiEffEl = document.getElementById('kpiEff');
const kpiSurfaceEl = document.getElementById('kpiSurface');
const kpiPressureEl = document.getElementById('kpiPressure');

const state = {
  running: true,
  temp: Number(tempSlider.value),
  flow: Number(flowSlider.value),
  roomTemp: Number(roomTempSlider.value),
  spacing: Number(spacingSlider.value),
  animationTime: 0
};

function updateLabels() {
  tempValue.textContent = `${state.temp}°C`;
  flowValue.textContent = `${state.flow.toFixed(1)} L/min`;
  roomTempValue.textContent = `${state.roomTemp}°C`;
  spacingValue.textContent = `${state.spacing} cm`;

  const heatOutput = (state.temp - state.roomTemp) * (state.flow * 0.13) * 0.18;
  const avgSurface = state.roomTemp + (state.temp - state.roomTemp) * 0.72;
  const efficiency = Math.min(98, Math.max(35, 100 - ((state.roomTemp - 15) * 4.5) - (state.spacing - 15) * 0.7 + (state.temp - 35) * 0.8));
  const pressureDrop = 0.7 + (state.flow * 0.42) + (state.spacing * 0.08);

  heatOutputEl.textContent = `${heatOutput.toFixed(1)} kW`;
  surfaceTempEl.textContent = `${avgSurface.toFixed(1)}°C`;
  efficiencyEl.textContent = `${efficiency.toFixed(0)}%`;
  pressureDropEl.textContent = `${pressureDrop.toFixed(1)} bar`;

  kpiHeatEl.textContent = `${heatOutput.toFixed(1)} kW`;
  kpiEffEl.textContent = `${efficiency.toFixed(0)}%`;
  kpiSurfaceEl.textContent = `${avgSurface.toFixed(1)}°C`;
  kpiPressureEl.textContent = `${pressureDrop.toFixed(1)} bar`;
}

function syncFromControls() {
  state.temp = Number(tempSlider.value);
  state.flow = Number(flowSlider.value);
  state.roomTemp = Number(roomTempSlider.value);
  state.spacing = Number(spacingSlider.value);
  updateLabels();
}

tempSlider.addEventListener('input', syncFromControls);
flowSlider.addEventListener('input', syncFromControls);
roomTempSlider.addEventListener('input', syncFromControls);
spacingSlider.addEventListener('input', syncFromControls);

function resizeRenderer() {
  const { clientWidth, clientHeight } = canvas.parentElement;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resizeRenderer);
resizeRenderer();

function animatePipes(time) {
  const wave = Math.sin(time * 0.003 + state.animationTime) * 0.8;
  pipeData.forEach((pipe, index) => {
    const intensity = 0.7 + ((state.temp - state.roomTemp) / 40) + ((index + 1) / pipeCount) * 0.8 + wave * 0.12;
    const color = new THREE.Color().setHSL(0.05 + (state.temp - 25) / 120, 0.85, 0.5 + intensity * 0.08);
    pipe.material.color.copy(color);
    pipe.material.emissive.copy(color).multiplyScalar(0.45);
  });

  const tempFactor = (state.temp - state.roomTemp) / 25;
  fieldMeshes.forEach((cell, index) => {
    const offset = (Math.sin(index * 0.7 + time * 0.002) + 1) / 2;
    const opacity = 0.22 + offset * 0.58 + tempFactor * 0.25;
    const color = new THREE.Color().setHSL(0.55 - tempFactor * 0.08, 0.9, 0.5 + opacity * 0.18);
    cell.material.color.copy(color);
    cell.material.opacity = Math.min(0.94, Math.max(0.18, opacity));
    cell.material.emissive.copy(color).multiplyScalar(0.65);
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (state.running) {
    state.animationTime += 0.016;
    animatePipes(performance.now());
  }

  const spin = 0.35 + ((state.flow / 8) * 0.9);
  const yRotation = (performance.now() * 0.00018) * spin;
  slab.rotation.y = yRotation;
  pipeGroup.rotation.y = yRotation;
  heatField.rotation.y = yRotation;

  renderer.render(scene, camera);
}

function startSimulation() {
  state.running = true;
  document.getElementById('startBtn').textContent = 'Running';
}

function pauseSimulation() {
  state.running = false;
  document.getElementById('startBtn').textContent = 'Start';
}

function resetSimulation() {
  tempSlider.value = '45';
  flowSlider.value = '4';
  roomTempSlider.value = '20';
  spacingSlider.value = '20';
  syncFromControls();
  state.animationTime = 0;
  state.running = true;
  document.getElementById('startBtn').textContent = 'Running';
}

function exportPDF() {
  const element = document.querySelector('.app');
  const opt = {
    margin: 0.2,
    filename: 'anadi-radiant-heating-dashboard.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
  };
  html2pdf().set(opt).from(element).save();
}

window.onload = () => {
  syncFromControls();
  animate();
};

document.getElementById('startBtn').addEventListener('click', startSimulation);
document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
document.getElementById('resetBtn').addEventListener('click', resetSimulation);
document.getElementById('pdfBtn').addEventListener('click', exportPDF);
