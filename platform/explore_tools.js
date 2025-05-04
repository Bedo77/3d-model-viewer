console.log('[DEBUG] explore_tools.js: Script loaded');

let currentScene, currentRenderer, currentCamera, currentControls, modelGroup;
let arStream = null, arMode = false, currentModels = [], selectedModelIndex = -1;
let animationEnabled = true, selectedModelName = "No Model Selected";
let mixers = [], clock = new THREE.Clock();
let originalScales = new Map(), originalPositions = new Map();
let raycaster, mouse;
let spotLight, ambientLight;
let loading = false;
let preloadedModels = new Map();
let lastMessageTime = 0;
const messageDebounceMs = 100;
let pendingModelMessages = [];
let modelsFetched = false;

window.currentScene = null;
window.currentRenderer = null;
window.currentCamera = null;
window.currentControls = null;
window.modelGroup = null;
window.mixers = mixers;
window.simRotationSpeed = 0.005;
window.specificParamValue = 1;
window.modelScaleValue = 1;
window.forceMagnitude = 0;
window.frictionCoefficient = 0;
window.mass = 1;
window.elasticity = 0;
window.airResistance = 0;
window.torque = 0;
window.energyLevel = 1;
window.lightIntensity = 3;
window.ambientLightIntensity = 2;
window.gravityInfluence = 0;
window.windSpeed = 0;
window.temperatureEffect = 0;
window.dampingFactor = 0.1;
window.fogDensity = 0;
window.shadowIntensity = 0.5;
window.rotationAxis = 'Y';
window.autoRotate = false;
window.velocities = new Map();
window.originalScales = originalScales;
window.originalPositions = originalPositions;
window.spotLight = null;
window.ambientLight = null;

async function fetchModelsFromGitHub() {
    console.log('[DEBUG] fetchModelsFromGitHub: Starting');
    const repoOwner = 'Bedo77';
    const repoName = '3d-model-viewer';
    const path = 'Science/grade_one/models';
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

    const localModels = [
        {
            path: './models/3D habitat explorer.glb',
            name: '3D Habitat Explorer',
            filename: '3D habitat explorer.glb',
            fallback: './models/3D habitat explorer.glb'
        },
        {
            path: './models/sun shadow simulator.glb',
            name: 'Sun Shadow Simulator',
            filename: 'sun shadow simulator.glb',
            fallback: './models/sun shadow simulator.glb'
        }
    ];

    try {
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
        }

        const files = await response.json();
        const models = files
            .filter(file => file.name.endsWith('.glb'))
            .map(file => ({
                path: `https://raw.githubusercontent.com/Bedo77/3d-model-viewer/main/${path}/${file.name}`,
                name: file.name.replace('.glb', '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
                filename: file.name,
                fallback: `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@main/${path}/${file.name}`
            }));

        console.log('[DEBUG] Dynamically fetched models:', models);
        modelsFetched = true;
        return models.length > 0 ? models : localModels;
    } catch (error) {
        console.error('[ERROR] Failed to fetch models from GitHub:', error);
        modelsFetched = true;
        return localModels;
    }
}

async function preloadModel(model) {
    return new Promise((resolve, reject) => {
        if (preloadedModels.has(model.filename)) {
            resolve(preloadedModels.get(model.filename));
            return;
        }

        const loader = new THREE.GLTFLoader();
        fetch(model.path, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    loader.load(
                        model.path,
                        gltf => {
                            gltf.scene.traverse(child => {
                                if (child.isMesh && child.material) {
                                    child.material.side = THREE.DoubleSide;
                                    child.material.transparent = false;
                                    child.material.opacity = 1;
                                    child.visible = true;
                                }
                            });
                            preloadedModels.set(model.filename, gltf);
                            resolve(gltf);
                        },
                        undefined,
                        error => reject(error)
                    );
                } else if (model.fallback) {
                    fetch(model.fallback, { method: 'HEAD' })
                        .then(fallbackResponse => {
                            if (fallbackResponse.ok) {
                                loader.load(
                                    model.fallback,
                                    gltf => {
                                        gltf.scene.traverse(child => {
                                            if (child.isMesh && child.material) {
                                                child.material.side = THREE.DoubleSide;
                                                child.material.transparent = false;
                                                child.material.opacity = 1;
                                                child.visible = true;
                                            }
                                        });
                                        preloadedModels.set(model.filename, gltf);
                                        resolve(gltf);
                                    },
                                    undefined,
                                    error => reject(error)
                                );
                            } else {
                                reject(new Error('Both primary and fallback URLs failed'));
                            }
                        })
                        .catch(error => reject(error));
                } else {
                    reject(new Error('Primary URL failed and no fallback available'));
                }
            })
            .catch(error => reject(error));
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[DEBUG] explore_tools.js: DOMContentLoaded');
    selectedModelIndex = -1;
    selectedModelName = "No Model Selected";

    try {
        initializeScene('modelViewport');
        resizeRenderer('modelViewport');
        currentModels = await fetchModelsFromGitHub();
        loadModels(currentModels, 'modelViewport', -1);
        window.addEventListener('resize', () => resizeRenderer('modelViewport'));
    } catch (error) {
        console.error('[ERROR] Initialization failed:', error);
    }
});

function processModelMessage(e) {
    if (e.data && e.data.type === 'loadLessonModels') {
        console.log('[DEBUG] Processing loadLessonModels:', e.data);
        const { primaryModel, models } = e.data;

        currentModels = models.map((model, index) => ({
            path: model.path,
            name: model.name,
            filename: model.name,
            fallback: model.fallback
        }));
        selectedModelIndex = primaryModel ? 0 : -1;
        selectedModelName = primaryModel ? primaryModel.name : 'No Model Available';

        updateDropdown();
        loadModels(currentModels, 'modelViewport', selectedModelIndex);
    }
}

function updateDropdown() {
    const dropdownSelected = document.getElementById('dropdownSelected');
    if (dropdownSelected) {
        dropdownSelected.textContent = selectedModelName;
        const dropdownItems = document.getElementById('dropdownItems');
        if (dropdownItems) {
            dropdownItems.innerHTML = `
                <div class="dropdown-item" data-value="-1">No Model Selected</div>
                ${currentModels.map((m, i) => `<div class="dropdown-item" data-value="${i}">${m.name}</div>`).join('')}
            `;
        }
    }
}

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'loadLessonModels') {
        if (!modelsFetched) {
            pendingModelMessages.push(e);
        } else {
            processModelMessage(e);
        }
    }
});

function initializeScene(viewportId) {
    const viewport = document.getElementById(viewportId);
    if (!viewport) {
        console.error(`[ERROR] Viewport with ID ${viewportId} not found`);
        return;
    }
    
    cleanupRenderer();
    
    currentRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    currentRenderer.setClearColor(0x000000, arMode ? 0 : 1);
    currentRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    viewport.appendChild(currentRenderer.domElement);
    currentRenderer.domElement.style.position = 'absolute';
    currentRenderer.domElement.style.zIndex = '10';

    currentScene = new THREE.Scene();
    currentCamera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight || 1, 0.1, 1000);
    currentCamera.position.set(0, 1, 5);
    
    if (currentControls) {
        currentControls.dispose();
    }
    
    currentControls = new THREE.OrbitControls(currentCamera, currentRenderer.domElement);
    currentControls.enableDamping = true;
    currentControls.dampingFactor = window.dampingFactor || 0.1;
    currentControls.enablePan = true;
    currentControls.panSpeed = 0.5;
    currentControls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.DOLLY };
    currentControls.enableZoom = true;
    currentControls.minDistance = 2;
    currentControls.maxDistance = 50;
    currentControls.rotateSpeed = 1.0;
    currentControls.minPolarAngle = 0;
    currentControls.maxPolarAngle = Math.PI;
    currentControls.screenSpacePanning = true;
    currentControls.autoRotate = window.autoRotate;
    currentControls.autoRotateSpeed = 1.0;
    currentControls.enableRotate = true;
    currentControls.target.set(0, 1, 0);
    currentControls.update();

    ambientLight = new THREE.AmbientLight(0xA9A9A9, window.ambientLightIntensity || 2);
    currentScene.add(ambientLight);
    window.ambientLight = ambientLight;

    spotLight = new THREE.SpotLight(0xffffff, window.lightIntensity || 3);
    spotLight.position.set(5, 10, 5);
    spotLight.angle = 0.785;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = false;
    currentScene.add(spotLight);
    window.spotLight = spotLight;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createModelGroup();
    
    window.currentScene = currentScene;
    window.currentRenderer = currentRenderer;
    window.currentCamera = currentCamera;
    window.currentControls = currentControls;
    window.modelGroup = modelGroup;
}

function cleanupRenderer() {
    if (currentRenderer) {
        const rendererElement = currentRenderer.domElement;
        if (rendererElement && rendererElement.parentNode) {
            rendererElement.parentNode.removeChild(rendererElement);
        }
        currentRenderer.dispose();
        currentRenderer = null;
    }
    window.currentRenderer = null;
}

function createModelGroup() {
    if (modelGroup) {
        modelGroup.children.forEach(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        currentScene.remove(modelGroup);
    }
    
    modelGroup = new THREE.Group();
    currentScene.add(modelGroup);
    window.modelGroup = modelGroup;
    mixers = [];
    window.mixers = mixers;
}

function loadModels(models, viewportId, singleModelIndex = -1) {
    if (loading) {
        return;
    }
    loading = true;
    
    const viewport = document.getElementById(viewportId);
    if (!viewport) {
        console.error(`[ERROR] Viewport ${viewportId} not found`);
        loading = false;
        return;
    }
    
    const controlPanel = viewport.querySelector('.control-panel');
    const simulationPanel = viewport.querySelector('.simulation-panel');
    const noModelMessage = document.getElementById('noModelMessage');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (singleModelIndex === -1) {
        initializeScene(viewportId);
        viewport.appendChild(currentRenderer.domElement);
        if (noModelMessage) noModelMessage.style.display = 'block';
        if (loadingMessage) loadingMessage.style.display = 'none';
        addControlPanel(viewportId, false);
        if (!simulationPanel && window.Controls && window.Controls.createSimulationPanel) {
            window.Controls.createSimulationPanel(viewportId, false, selectedModelName);
        }
        if (controlPanel) viewport.appendChild(controlPanel);
        if (simulationPanel) viewport.appendChild(simulationPanel);
        loading = false;
        resizeRenderer(viewportId);
        triggerAnimation();
        return;
    }

    if (loadingMessage) loadingMessage.style.display = 'block';
    if (noModelMessage) noModelMessage.style.display = 'none';
    
    currentModels = models;
    selectedModelIndex = singleModelIndex;
    const isSingleModel = singleModelIndex >= 0;
    const displayModels = isSingleModel ? [models[singleModelIndex]] : models;

    initializeScene(viewportId);
    viewport.appendChild(currentRenderer.domElement);
    
    Promise.all(displayModels.map(model => preloadModel(model)))
        .then(gltfs => {
            createModelGroup();
            const loadedModels = [];

            gltfs.forEach((gltf, index) => {
                const model = gltf.scene;
                model.name = displayModels[index].name;

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z, 0.1);
                let scale = maxDim > 0 ? 1 / maxDim : 1;

                if (isNaN(scale) || scale <= 0.001) {
                    scale = 1;
                }

                model.scale.set(scale, scale, scale);
                window.originalScales.set(model, new THREE.Vector3(scale, scale, scale));
                model.position.sub(center.multiplyScalar(scale));
                window.originalPositions.set(model, model.position.clone());

                if (isSingleModel) {
                    model.position.set(0, 0, 0);
                } else {
                    const offset = index * 2;
                    model.position.set(offset, 0, 0);
                }

                model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = false;
                        child.receiveShadow = false;
                        if (child.material) {
                            child.material.side = THREE.DoubleSide;
                        }
                    }
                });

                modelGroup.add(model);
                loadedModels.push(model);

                if (gltf.animations && gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    mixers.push(mixer);
                    window.mixers = mixers;
                    gltf.animations.forEach(clip => {
                        const action = mixer.clipAction(clip);
                        action.play();
                        if (!animationEnabled) {
                            action.stop();
                        }
                    });
                }
            });

            if (window.Controls && window.Controls.adjustCamera) {
                window.Controls.adjustCamera();
            }
            addControlPanel(viewportId, isSingleModel);
            if (simulationPanel) simulationPanel.remove();
            if (window.Controls && window.Controls.createSimulationPanel) {
                window.Controls.createSimulationPanel(viewportId, isSingleModel, selectedModelName);
            }

            if (loadingMessage) loadingMessage.style.display = 'none';
            if (controlPanel) viewport.appendChild(controlPanel);
            if (simulationPanel) viewport.appendChild(simulationPanel);
            
            loading = false;
            resizeRenderer(viewportId);
            triggerAnimation();
        })
        .catch(error => {
            console.error('[ERROR] Failed to load models:', error);
            if (loadingMessage) loadingMessage.textContent = 'Failed to load model';
            if (noModelMessage) noModelMessage.style.display = 'block';
            loading = false;
            addControlPanel(viewportId, false);
            if (!simulationPanel && window.Controls && window.Controls.createSimulationPanel) {
                window.Controls.createSimulationPanel(viewportId, false, selectedModelName);
            }
            if (controlPanel) viewport.appendChild(controlPanel);
            if (simulationPanel) viewport.appendChild(simulationPanel);
            resizeRenderer(viewportId);
            triggerAnimation();
        });
}

function triggerAnimation() {
    if (typeof window.animation_controls.animate === 'function') {
        window.animation_controls.animate(performance.now());
    } else {
        console.error('[ERROR] window.animation_controls.animate is not defined');
    }
}

function resizeRenderer(viewportId, retryCount = 0) {
    const viewport = document.getElementById(viewportId);
    if (!viewport || !currentRenderer || !currentCamera) {
        console.warn('[WARN] resizeRenderer: Missing viewport or renderer');
        return;
    }

    let width = viewport.clientWidth;
    let height = viewport.clientHeight;

    if (width === 0 || height === 0) {
        const parent = viewport.parentElement || document.body;
        width = parent.clientWidth || 800;
        height = parent.clientHeight || 600;
        if (width === 0 || height === 0) {
            if (retryCount < 10) {
                setTimeout(() => resizeRenderer(viewportId, retryCount + 1), 100);
                return;
            } else {
                console.error('[ERROR] Viewport dimensions still zero after retries');
                width = 800;
                height = 600;
            }
        }
    }

    currentCamera.aspect = width / height;
    currentCamera.updateProjectionMatrix();
    currentRenderer.setSize(width, height);
    currentRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
}

function addControlPanel(viewportId, isSingleModel) {
    const viewport = document.getElementById(viewportId);
    if (!viewport) {
        console.error('[ERROR] addControlPanel: Viewport not found');
        return;
    }

    let animationToggleState = animationEnabled;
    const existingAnimationToggle = document.getElementById('animationToggle');
    if (existingAnimationToggle) {
        animationToggleState = existingAnimationToggle.checked;
    }

    let controlPanel = viewport.querySelector('.control-panel');
    if (controlPanel) {
        controlPanel.remove();
    }

    controlPanel = document.createElement('div');
    controlPanel.className = 'control-panel';
    controlPanel.innerHTML = `
        <div class="toggle-row">
            <span class="ar-label">Dive into AR Exploration</span>
            <label class="switch">
                <input type="checkbox" id="arToggle" ${arMode ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <div class="error-message" id="arError"></div>
        </div>
        <div class="toggle-row animation-toggle-row" ${isSingleModel ? '' : 'style="display:none;"'}>
            <span class="animation-label">Play Model Animation</span>
            <label class="switch">
                <input type="checkbox" id="animationToggle" ${animationToggleState ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="model-selector">
            <div class="custom-dropdown">
                <div class="dropdown-selected" id="dropdownSelected">${selectedModelName}</div>
                <div class="dropdown-items" id="dropdownItems" style="display:none;">
                    <div class="dropdown-item" data-value="-1">No Model Selected</div>
                    ${currentModels.map((m, i) => `<div class="dropdown-item" data-value="${i}">${m.name}</div>`).join('')}
                </div>
            </div>
        </div>
    `;
    
    viewport.appendChild(controlPanel);

    const animationToggle = document.getElementById('animationToggle');
    if (animationToggle) {
        animationToggle.addEventListener('change', e => {
            animationEnabled = e.target.checked;
            if (mixers.length > 0) {
                mixers.forEach(mixer => {
                    mixer._actions.forEach(action => {
                        animationEnabled ? action.play() : action.stop();
                    });
                });
            }
        });
    }

    document.getElementById('arToggle').addEventListener('change', toggleAR);
    setupDropdown(viewportId);
}

async function toggleAR(event) {
    const arToggle = document.getElementById('arToggle');
    const arError = document.getElementById('arError');
    const viewport = document.getElementById('modelViewport');
    arError.textContent = '';

    if (!arToggle || !currentScene || !currentCamera || !currentRenderer || !viewport) {
        console.error('[ERROR] Required elements for AR toggle not found');
        if (arToggle) arToggle.checked = false;
        return;
    }

    let videoElement = document.getElementById('arVideo');
    if (event.target.checked) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            arError.textContent = 'AR not supported';
            arToggle.checked = false;
            return;
        }

        try {
            arStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            if (!videoElement) {
                videoElement = document.createElement('video');
                videoElement.id = 'arVideo';
                videoElement.playsInline = true;
                videoElement.srcObject = arStream;
                videoElement.play();
                viewport.appendChild(videoElement);
            } else {
                videoElement.srcObject = arStream;
                videoElement.play();
            }

            const videoTexture = new THREE.VideoTexture(videoElement);
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            currentScene.background = videoTexture;

            arMode = true;
            document.body.classList.add('ar-active');
            currentRenderer.setClearColor(0x000000, 0);
            if (window.Controls && window.Controls.adjustCamera) {
                window.Controls.adjustCamera();
            }

            window.parent.postMessage({
                type: 'toggleSidebar',
                hide: true,
                viewportExpand: true
            }, '*');
            resizeRenderer('modelViewport');
        } catch (error) {
            console.error('[ERROR] Failed to enable AR:', error);
            arError.textContent = 'Failed to access camera: ' + error.message;
            arToggle.checked = false;
            arMode = false;
            document.body.classList.remove('ar-active');
            currentScene.background = null;
            if (videoElement) {
                videoElement.srcObject = null;
                videoElement.remove();
            }
            if (arStream) {
                arStream.getTracks().forEach(track => track.stop());
                arStream = null;
            }
            window.parent.postMessage({
                type: 'toggleSidebar',
                hide: false,
                viewportExpand: false
            }, '*');
            resizeRenderer('modelViewport');
        }
    } else {
        if (arStream) {
            arStream.getTracks().forEach(track => track.stop());
            arStream = null;
        }
        if (videoElement) {
            videoElement.srcObject = null;
            videoElement.remove();
        }

        arMode = false;
        document.body.classList.remove('ar-active');
        currentRenderer.setClearColor(0x000000, 1);
        currentScene.background = null;
        if (window.Controls && window.Controls.adjustCamera) {
            window.Controls.adjustCamera();
        }

        if (currentControls) {
            currentControls.reset();
            currentControls.enableRotate = true;
            currentControls.enableZoom = true;
            currentControls.enablePan = true;
            currentControls.update();
        }

        window.parent.postMessage({
            type: 'toggleSidebar',
            hide: false,
            viewportExpand: false
        }, '*');
        resizeRenderer('modelViewport');
    }

    triggerAnimation();
}

function setupDropdown(viewportId) {
    const dropdownSelected = document.getElementById('dropdownSelected');
    const dropdownItems = document.getElementById('dropdownItems');
    if (!dropdownSelected || !dropdownItems) {
        console.warn('[WARN] setupDropdown: Dropdown elements not found');
        return;
    }

    dropdownSelected.addEventListener('click', () => {
        const isOpen = dropdownItems.style.display === 'block';
        dropdownItems.style.display = isOpen ? 'none' : 'block';
        dropdownSelected.classList.toggle('open', !isOpen);
    });

    dropdownItems.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        const value = parseInt(item.getAttribute('data-value'), 10);
        selectedModelIndex = value;
        selectedModelName = item.textContent;
        dropdownSelected.textContent = selectedModelName;
        dropdownItems.style.display = 'none';
        dropdownSelected.classList.remove('open');

        loadModels(currentModels, viewportId, value);
    });

    document.addEventListener('click', (e) => {
        if (!dropdownSelected.contains(e.target) && !dropdownItems.contains(e.target)) {
            dropdownItems.style.display = 'none';
            dropdownSelected.classList.remove('open');
        }
    });
}