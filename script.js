import * as THREE from 'three';
// Load heart image
function loadHeartImage(src = './heart.png') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Scene setup
const width = window.innerWidth;
const height = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });

renderer.setSize(width, height);
document.getElementById('threejs-canvas').appendChild(renderer.domElement);

// Will be set from config
camera.position.z = 20;
camera.rotation.y = 0.5;

// Wheel zoom
renderer.domElement.addEventListener('wheel', evt => {
  evt.preventDefault();
  camera.position.z += evt.deltaY * 0.006;
  camera.position.z = Math.max(3, Math.min(camera.position.z, 50));
});

// Create text texture
function createTextTexture(text) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  const maxWidth = 1200;
  const baseFontSize = 96;
  let fontSize = baseFontSize;
  const padding = 100;
  
  tempCtx.font = 'bold ' + fontSize + 'px \'Arial\'';
  let textWidth = tempCtx.measureText(text).width;
  
  if (textWidth + padding * 2 > maxWidth) {
    const availableWidth = maxWidth - padding * 2;
    fontSize = Math.floor(fontSize * availableWidth / textWidth);
    tempCtx.font = 'bold ' + fontSize + 'px \'Arial\'';
    textWidth = tempCtx.measureText(text).width;
  }
  
  const canvasWidth = Math.ceil(textWidth + padding * 2);
  const canvasHeight = 128 * 3;
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvasWidth;
  finalCanvas.height = canvasHeight;
  
  const ctx = finalCanvas.getContext('2d');
  ctx.font = 'bold ' + fontSize + 'px \'Arial\'';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff1e78ff';
  ctx.shadowBlur = 50;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(text, finalCanvas.width / 2, finalCanvas.height / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  ctx.strokeText(text, finalCanvas.width / 2, finalCanvas.height / 2);
  
  return {
    texture: new THREE.CanvasTexture(finalCanvas),
    aspect: finalCanvas.width / finalCanvas.height
  };
}

// Create heart texture
function createHeartTexture(heartImg) {
  const canvas = document.createElement('canvas');
  canvas.width = 128 * 2;
  canvas.height = 128 * 2;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = '#ff22b4';
  ctx.shadowBlur = 30;
  
  const drawWidth = canvas.width / 2;
  const drawHeight = canvas.height / 2;
  const x = (canvas.width - drawWidth) / 2;
  const y = (canvas.height - drawHeight) / 2;
  
  ctx.drawImage(heartImg, x, y, drawWidth, drawHeight);
  return new THREE.CanvasTexture(canvas);
}

// Create stars
let starMeshes = [];
function createStars() {
  const geometry = new THREE.SphereGeometry(0.07, 6, 6);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  for (let i = 0; i < 800; i++) {
    const star = new THREE.Mesh(geometry, material);
    star.position.x = (Math.random() - 0.5) * 120;
    star.position.y = Math.random() * 80 - 20;
    star.position.z = (Math.random() - 0.5) * 120 - 20;
    scene.add(star);
    starMeshes.push(star);
  }
}

// Create falling texts
let textMeshes = [];
function createFallingTexts() {
  textMeshes.forEach(mesh => scene.remove(mesh));
  textMeshes = [];
  
  for (let i = 0; i < 200; i++) {
    const text = texts[Math.floor(Math.random() * texts.length)];
    const { texture, aspect } = createTextTexture(text);
    texture.needsUpdate = true;
    
    const height = 3;
    const width = height * aspect;
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      color: 0xffffff
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = (Math.random() - 0.5) * 100;
    mesh.position.y = Math.random() * 32 - 12;
    mesh.position.z = (Math.random() - 0.5) * 40;
    mesh.userData.phase = Math.random() * Math.PI * 2;
    
    scene.add(mesh);
    textMeshes.push(mesh);
  }
}

// Create falling hearts
let heartMeshes = [];
function createFallingHearts(heartTexture) {
  heartMeshes.forEach(mesh => scene.remove(mesh));
  heartMeshes = [];
  
  for (let i = 0; i < 15; i++) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: heartTexture,
      transparent: true,
      depthWrite: false,
      depthTest: true
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = (Math.random() - 0.5) * 30;
    mesh.position.y = Math.random() * 32 - 12;
    mesh.position.z = (Math.random() - 0.5) * 20;
    
    const scale = 1 + Math.random() * 1.5;
    mesh.scale.set(scale, scale, 1);
    
    scene.add(mesh);
    heartMeshes.push(mesh);
  }
}

// Shooting stars
let shootingStars = [];
function spawnShootingStar() {
  const geometry = new THREE.SphereGeometry(0.15, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  const star = new THREE.Mesh(geometry, material);
  
  star.position.x = (Math.random() - 0.5) * 100;
  star.position.y = Math.random() * 80 - 20;
  star.position.z = -40 - Math.random() * 40;
  
  star.userData = {
    vx: 0.4 + Math.random() * 0.3,
    vy: -0.2 - Math.random() * 0.2,
    vz: 0.7 + Math.random() * 0.5,
    tail: []
  };
  
  scene.add(star);
  shootingStars.push(star);
}

// Mouse/Touch interaction
let isDragging = false;
let lastX = 0;
let isTouching = false;
let lastTouchX = 0;
let targetRotationY = 0.5;

renderer.domElement.addEventListener('mousedown', evt => {
  isDragging = true;
  lastX = evt.clientX;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', evt => {
  if (isDragging) {
    const deltaX = evt.clientX - lastX;
    lastX = evt.clientX;
    targetRotationY += deltaX * 0.0015;
  }
});

renderer.domElement.addEventListener('touchstart', evt => {
  if (evt.touches.length === 1) {
    isTouching = true;
    lastTouchX = evt.touches[0].clientX;
  }
});

window.addEventListener('touchend', () => {
  isTouching = false;
});

window.addEventListener('touchmove', evt => {
  if (isTouching && evt.touches.length === 1) {
    const touchX = evt.touches[0].clientX;
    const deltaX = touchX - lastTouchX;
    lastTouchX = touchX;
    targetRotationY += deltaX * 0.0015;
  }
});

// Color interpolation
function lerpColor(color1, color2, t) {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * t),
    Math.round(color1[1] + (color2[1] - color1[1]) * t),
    Math.round(color1[2] + (color2[2] - color1[2]) * t)
  ];
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Smooth camera rotation
  camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.08;
  
  const time = Date.now();
  
  // Animate text meshes
  textMeshes.forEach(mesh => {
    mesh.position.y -= 0.025 + Math.random() * 0.005;
    
    if (mesh.position.y < -12) {
      mesh.position.y = Math.random() * 20 + 10;
      mesh.position.x = (Math.random() - 0.5) * 30;
      mesh.position.z = (Math.random() - 0.5) * 40;
    }
    
    // Wrap around
    if (mesh.position.x > 16) mesh.position.x = -16;
    if (mesh.position.x < -16) mesh.position.x = 16;
    
    // Color animation
    const t = (Math.sin(time * 0.0005 + mesh.userData.phase) + 1) / 2;
    const color = lerpColor([255, 255, 255], [255, 105, 180], t);
    const hexColor = (color[0] << 16) | (color[1] << 8) | color[2];
    mesh.material.color.setHex(hexColor);
  });
  
  // Animate hearts
  heartMeshes.forEach(mesh => {
    mesh.position.y -= 0.04 + Math.random() * 0.02;
    mesh.position.x += (Math.random() - 0.5) * 0.05;
    
    if (mesh.position.y < -12) {
      mesh.position.y = Math.random() * 20 + 10;
      mesh.position.x = (Math.random() - 0.5) * 30;
      mesh.position.z = (Math.random() - 0.5) * 20;
    }
    
    if (mesh.position.x > 16) mesh.position.x = -16;
    if (mesh.position.x < -16) mesh.position.x = 16;
  });
  
  // Animate shooting stars
  shootingStars.forEach((star, index) => {
    // Limit tail length
    if (star.userData.tail.length > 20) {
      star.userData.tail.shift();
    }
    
    star.userData.tail.push({
      x: star.position.x,
      y: star.position.y,
      z: star.position.z
    });
    
    star.position.x += star.userData.vx;
    star.position.y += star.userData.vy;
    star.position.z += star.userData.vz;
    
    // Draw tail
    for (let i = 0; i < star.userData.tail.length - 1; i++) {
      const p1 = star.userData.tail[i];
      const p2 = star.userData.tail[i + 1];
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3(p2.x, p2.y, p2.z)
      ]);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15 + 0.25 * (i / star.userData.tail.length)
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      setTimeout(() => scene.remove(line), 40);
    }
    
    star.material.opacity = 0.8;
    
    // Remove star if out of bounds
    if (star.position.z > 0 || star.position.y < -40) {
      scene.remove(star);
      shootingStars.splice(index, 1);
    }
  });
  
  // Randomly spawn shooting stars
  if (Math.random() < 0.012) {
    spawnShootingStar();
  }
  
  renderer.render(scene, camera);
}

// Initialize
createStars();
createFallingTexts();

loadHeartImage('./heart.png').then(heartImg => {
  const heartTexture = createHeartTexture(heartImg);
  createFallingHearts(heartTexture);
  animate();
});

// Window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// Interaction events
const interactionEvents = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'];

// Loading stars (unused function)
function createStarsForLoading() {
  const count = 50;
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'star';
    div.style.left = Math.random() * 100 + '%';
    div.style.top = Math.random() * 100 + '%';
    const size = Math.random() * 3;
    div.style.width = size + 'px';
    div.style.height = size + 'px';
    div.style.animationDelay = Math.random() * 2 + 's';
    const blur = Math.random() * 5 + 5;
    div.style.boxShadow = '0 0 ' + blur + 'px #fff';
  }
}

let isPlaying = false;
const btn = document.getElementById("toggle-music");
const audioEl = document.getElementById("bg-audio");
let plyrPlayer = null;
if (typeof youtubeId !== "undefined") {
  plyrPlayer = new Plyr('#plyr-player', {
    controls: [],
    autoplay: false,
    muted: false
  });
  plyrPlayer.on('ready', () => {
    const yt = plyrPlayer.embed;
    yt.setPlaybackQuality('small');
    yt.setPlaybackRate(1);
  });
}
function playMedia() {
  if (plyrPlayer) {
    plyrPlayer.play();
    return;
  }
  if (audioEl) audioEl.play();
}
function pauseMedia() {
  if (plyrPlayer) {
    plyrPlayer.pause();
    return;
  }
  if (audioEl) audioEl.pause();
}
btn.addEventListener("click", () => {
  if (!isPlaying) playMedia();
  else pauseMedia();
  isPlaying = !isPlaying;
  btn.classList.toggle("playing", isPlaying);
});