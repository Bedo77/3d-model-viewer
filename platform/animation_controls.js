let lastTime = 0;
let animationFrameId = null;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;
let lastFrameTime = 0;
let frameCounter = 0;
let physicsReady = false;
let viewportReady = false;
let initializationComplete = false;
let initialFrames = 0;
const initialFrameDelay = 10;

// Wait for viewport to have valid dimensions
function waitForViewport() {
    return new Promise((resolve) => {
        const viewport = window.currentRenderer ? window.currentRenderer.domElement : null;
        let retries = 0;
        const maxRetries = 10; // Reduced from 100 for faster fallback

        const check = () => {
            if (!viewport) {
                console.warn('[WARN] waitForViewport: Renderer not ready, using fallback');
                resolve(true); // Continue anyway
                return;
            }

            const width = viewport.offsetWidth;
            const height = viewport.offsetHeight;

            if (width > 0 && height > 0) {
                console.log(`[DEBUG] Viewport ready: ${width}x${height}`);
                resolve(true);
            } else if (retries >= maxRetries) {
                console.warn(`[WARN] Viewport dimensions still zero after ${maxRetries} retries, using fallback`);
                resolve(true); // Continue with rendering anyway
            } else {
                retries++;
                setTimeout(check, 50); // Slower retry interval
            }
        };
        
        check();
    });
}

// Check if physics system is ready to activate
function checkPhysicsReady() {
    physicsReady = (
        viewportReady &&
        window.modelGroup && window.modelGroup.children.length > 0 &&
        window.currentCamera && window.currentCamera.position.length() > 0 &&
        window.velocities && window.velocities.size > 0
    );
    if (!physicsReady) {
        console.log(`[DEBUG] checkPhysicsReady: Physics not ready - viewportReady=${viewportReady}, modelGroup=${!!window.modelGroup}, children=${window.modelGroup?.children.length || 0}, cameraPosition=${window.currentCamera?.position.length() || 0}, velocities=${window.velocities?.size || 0}`);
    }
    return physicsReady;
}

function animatePhysics(deltaTime) {
    if (!viewportReady) {
        waitForViewport().then(isReady => {
            if (isReady) {
                checkPhysicsReady();
            } else {
                console.warn('[WARN] animatePhysics: Viewport not ready, skipping physics update');
            }
        });
        return;
    }

    if (!checkPhysicsReady()) {
        console.warn('[WARN] animatePhysics: Physics not ready, skipping update');
        return;
    }

    if (!window.modelGroup || !window.modelGroup.children.length || !window.velocities) {
        console.warn('[WARN] animatePhysics: No models or velocities to update');
        return;
    }

    const delta = deltaTime;
    let lastLogTime = window.lastLogTime || 0;
    const logInterval = 5000;

    window.modelGroup.children.forEach(model => {
        if (!model.visible) return;

        if (!window.velocities.has(model)) {
            window.velocities.set(model, { x: 0, y: 0, z: 0, angularX: 0, angularY: 0, angularZ: 0 });
        }

        const velocity = window.velocities.get(model);
        const mass = Number(window.mass) || 1;

        if (!initializationComplete && model.position.y <= 0) {
            const originalPos = window.originalPositions.get(model) || new THREE.Vector3();
            originalPos.y = 5;
            window.originalPositions.set(model, originalPos);
            model.position.copy(originalPos);
            console.log(`[DEBUG] animatePhysics: Initialized ${model.name} to y=${model.position.y}`);
            window.animation_controls.adjustCamera();
        }

        if (!window.initialPositionLogged) {
            console.log(`[DEBUG] animatePhysics: Initial position of ${model.name}: y=${model.position.y}`);
            window.initialPositionLogged = true;
        }

        if (window.forceMagnitude === 0 && window.gravityInfluence === 0 && window.windSpeed === 0 && (!window.motionAxis || window.directionalSpeed === 0)) {
            const originalPos = window.originalPositions.get(model) || new THREE.Vector3();
            if (originalPos.y <= 0) {
                originalPos.y = 5;
                window.originalPositions.set(model, originalPos);
            }
            model.position.copy(originalPos);
            velocity.x = velocity.y = velocity.z = velocity.angularX = velocity.angularY = velocity.angularZ = 0;
            window.velocities.set(model, velocity);
            model.updateMatrixWorld(true);
            if (frameCounter % 90 === 0) {
                console.log(`[DEBUG] animatePhysics: All forces 0, reset ${model.name} to original position: y=${model.position.y}`);
            }
            return;
        }

        let forceAccel = 0;
        if (window.forceMagnitude > 0) {
            forceAccel = (window.forceMagnitude * 0.05 / mass) * delta;
            velocity.y += forceAccel;
            velocity.y = Math.max(-2.0, Math.min(2.0, velocity.y));
        }

        if (window.motionAxis && window.directionalSpeed !== 0) {
            const speed = Number(window.directionalSpeed) || 0;
            if (window.motionAxis === 'X') velocity.x = speed;
            else if (window.motionAxis === 'Y') velocity.y = speed;
            else if (window.motionAxis === 'Z') velocity.z = speed;
        }

        if (window.windSpeed !== 0) {
            velocity.x = window.windSpeed * 0.05;
        }

        const gravityInfluence = Number(window.gravityInfluence) || 0;
        if (gravityInfluence > 0) {
            const gravityAccel = 9.81 * gravityInfluence * delta * 0.1;
            velocity.y -= gravityAccel;
            velocity.y = Math.max(-2.0, Math.min(2.0, velocity.y));
        }

        if (frameCounter % 90 === 0 && (window.forceMagnitude > 0 || gravityInfluence > 0)) {
            const netAccel = forceAccel - (gravityInfluence > 0 ? (9.81 * gravityInfluence * delta * 0.1) : 0);
            console.log(`[DEBUG] animatePhysics: Net acceleration for ${model.name}: ${netAccel.toFixed(4)}`);
        }

        model.position.x += velocity.x * delta;
        model.position.y += velocity.y * delta;
        model.position.z += velocity.z * delta;

        if (physicsReady && (initializationComplete || initialFrames > initialFrameDelay) && model.position.y <= 0) {
            model.position.y = 0;
            velocity.y = 0;
            if (frameCounter % 90 === 0) {
                console.log(`[DEBUG] animatePhysics: Ground collision detected, position.y=${model.position.y}`);
            }
        }

        const dampingFactor = Number(window.dampingFactor) || 0;
        if (dampingFactor > 0 && (velocity.x !== 0 || velocity.z !== 0)) {
            const frictionScale = 1 - (dampingFactor * 0.5 * delta);
            velocity.x *= frictionScale;
            velocity.z *= frictionScale;
            if (frameCounter % 90 === 0) {
                console.log(`[DEBUG] animatePhysics: Applied friction to ${model.name}: dampingFactor=${dampingFactor.toFixed(2)}`);
            }
        }

        window.velocities.set(model, velocity);
        model.updateMatrixWorld(true);

        if (frameCounter % 90 === 0) {
            console.log(`[DEBUG] animatePhysics: Model ${model.name} position={x:${model.position.x.toFixed(2)},y:${model.position.y.toFixed(2)},z:${model.position.z.toFixed(2)}} velocity={x:${velocity.x.toFixed(2)},y:${velocity.y.toFixed(2)},z:${velocity.z.toFixed(2)}}`);
        }

        const currentTime = performance.now();
        if ((Math.abs(velocity.x) > 0.01 || Math.abs(velocity.y) > 0.01 || Math.abs(velocity.z) > 0.01) && (currentTime - lastLogTime > logInterval)) {
            console.log(`[DEBUG] animatePhysics: Model ${model.name} position={x:${model.position.x.toFixed(4)},y:${model.position.y.toFixed(4)},z:${model.position.z.toFixed(4)}} velocity={x:${velocity.x.toFixed(4)},y:${velocity.y.toFixed(4)},z:${velocity.z.toFixed(4)}}`);
            lastLogTime = currentTime;
        }
    });

    initializationComplete = true;
    initialFrames++;

    window.lastLogTime = lastLogTime;
    frameCounter = (frameCounter + 1) % 90;
}

function updateBiologyControls() {
    if (!window.modelGroup || !window.modelGroup.children.length) {
        console.warn('[WARN] updateBiologyControls: No models to update');
        return;
    }

    if (window.isResetting) {
        console.log('[DEBUG] updateBiologyControls: Skipped due to reset in progress');
        return;
    }

    const highlightPart = window.highlightPart || 'none';
    const isolatePart = window.isolatePart || 'all';
    const healthLevel = Math.max(0, Math.min(2, Number(window.healthLevel) || 1));

    window.modelGroup.children.forEach(model => {
        model.traverse(child => {
            if (!child.isMesh) return;

            const isFlower = child.name.toLowerCase().includes('flower') || (child.material && child.material.name.toLowerCase().includes('flower'));
            const isStem = child.name.toLowerCase().includes('stem') || (child.material && child.material.name.toLowerCase().includes('stem'));

            if (!child.userData.originalMaterial) {
                console.log(`[DEBUG] updateBiologyControls: Storing original material for ${child.name}`);
                child.userData.originalMaterial = child.material.clone();
            }
            if (!child.userData.originalScale) {
                console.log(`[DEBUG] updateBiologyControls: Storing original scale for ${child.name}`);
                child.userData.originalScale = child.scale.clone();
            }

            if (healthLevel !== 1) {
                const healthFactor = healthLevel / 2;
                const healthyColor = isFlower ? new THREE.Color(0xff4040) : new THREE.Color(0x00ff00);
                const unhealthyColor = new THREE.Color(0x666633);
                child.material.color.lerpColors(unhealthyColor, healthyColor, healthFactor);
                child.material.opacity = 0.5 + (healthFactor * 0.5);
            } else {
                child.material.color.copy(child.userData.originalMaterial.color);
                child.material.opacity = child.userData.originalMaterial.opacity || 1.0;
            }

            if (highlightPart !== 'none') {
                if ((highlightPart === 'flower' && isFlower) || (highlightPart === 'stem' && isStem)) {
                    child.material.color.set(0xffff00);
                    child.material.opacity = 1.0;
                    if (frameCounter % 90 === 0) {
                        console.log(`[DEBUG] updateBiologyControls: Highlighting ${highlightPart} on ${child.name}`);
                    }
                } else {
                    child.material.opacity = 0.5;
                }
            }

            if (isolatePart !== 'all') {
                if ((isolatePart === 'flower' && isFlower) || (isolatePart === 'stem' && isStem)) {
                    child.visible = true;
                } else {
                    child.visible = false;
                    if (frameCounter % 90 === 0) {
                        console.log(`[DEBUG] updateBiologyControls: Isolating ${isolatePart}, hiding ${child.name}`);
                    }
                }
            } else {
                child.visible = true;
            }

            child.material.needsUpdate = true;
        });

        const growthRate = Math.max(0, Math.min(2, Number(window.growthRate) || 1));
        const growthFactor = 0.5 + (growthRate / 2);
        if (!model.userData.originalScale) {
            console.log(`[DEBUG] updateBiologyControls: Storing original scale for ${model.name}`);
            model.userData.originalScale = model.scale.clone();
        }
        if (growthRate !== 1) {
            model.scale.copy(model.userData.originalScale).multiplyScalar(growthFactor);
        } else {
            model.scale.copy(model.userData.originalScale);
        }
        model.updateMatrixWorld(true);

        if (frameCounter % 90 === 0) {
            console.log(`[DEBUG] updateBiologyControls: Applied biological parameters to ${model.name}`);
        }
    });
}

function animate(time) {
    if (!window.currentScene || !window.currentRenderer || !window.currentCamera) {
        console.warn('[WARN] Animation skipped: Scene, renderer, or camera not initialized');
        animationFrameId = requestAnimationFrame(animate);
        return;
    }

    if (time - lastFrameTime < frameInterval) {
        animationFrameId = requestAnimationFrame(animate);
        return;
    }
    lastFrameTime = time - ((time - lastFrameTime) % frameInterval);

    const delta = (time - lastTime) / 1000;
    lastTime = time;

    const energyLevel = Math.max(0, Math.min(2, Number(window.energyLevel) || 1));
    const interactionRate = Math.max(0, Math.min(2, Number(window.interactionRate) || 1));

    const playAnimation = window.playAnimation !== undefined ? window.playAnimation : true;
    if (window.mixers && window.mixers.length > 0 && playAnimation) {
        const motionSpeed = Number(window.motionSpeed) || 0;
        const windIntensity = Math.min(Math.abs(Number(window.windSpeed) || 0) / 2, 0.5);
        const interactionFactor = interactionRate / 2;
        const baseTimeScale = Math.max(0, Math.min(2, 1 + motionSpeed));
        const timeScale = baseTimeScale * (0.5 + interactionFactor);
        window.mixers.forEach(mixer => {
            mixer.timeScale = timeScale + windIntensity;
            mixer.update(delta);

            mixer._root.traverse(child => {
                if (!child.isMesh) return;
                const isFlower = child.name.toLowerCase().includes('flower') || (child.material && child.material.name.toLowerCase().includes('flower'));
                if (isFlower) {
                    if (!child.userData.originalScale) {
                        console.log(`[DEBUG] animate: Storing original scale for ${child.name}`);
                        child.userData.originalScale = child.scale.clone();
                    }
                    if (energyLevel !== 1) {
                        const energyFactor = 0.9 + (energyLevel * 0.1);
                        const pulse = 1 + (Math.sin(Date.now() * 0.005) * 0.05 * energyFactor);
                        child.scale.copy(child.userData.originalScale).multiplyScalar(pulse);
                    } else {
                        child.scale.copy(child.userData.originalScale);
                    }
                }
            });

            if (frameCounter % 90 === 0) {
                console.log(`[DEBUG] animate: Applied motionSpeed=${motionSpeed.toFixed(2)}, timeScale=${(timeScale + windIntensity).toFixed(2)} to mixer`);
            }
        });
    } else if (window.mixers && window.mixers.length > 0 && !playAnimation) {
        window.mixers.forEach(mixer => {
            mixer.timeScale = 0;
            if (frameCounter % 90 === 0) {
                console.log(`[DEBUG] animate: Paused animation for ${mixer._root.name}`);
            }
        });
    }

    if (window.modelGroup && window.windSpeed !== 0) {
        const windIntensity = Math.abs(window.windSpeed) / 2;
        const jitterAmplitude = windIntensity * 0.15;
        const time = Date.now() * 0.005;
        window.modelGroup.children.forEach(model => {
            model.rotation.x = Math.sin(time) * jitterAmplitude;
            model.rotation.z = Math.cos(time * 0.7) * jitterAmplitude;
            model.updateMatrixWorld(true);
        });
    }

    updateBiologyControls();
    animatePhysics(delta);

    if (window.currentControls) {
        window.currentControls.update();
    }

    try {
        window.currentRenderer.render(window.currentScene, window.currentCamera);
        console.log(`[DEBUG] animate: Rendered frame, modelGroup children: ${window.modelGroup ? window.modelGroup.children.length : 0}`);
    } catch (error) {
        console.error('[ERROR] Render error:', error);
    }

    animationFrameId = requestAnimationFrame(animate);
}

function adjustCamera() {
    if (!window.modelGroup || !window.currentCamera || !window.currentControls) {
        console.warn('[WARN] animation_controls.adjustCamera: Missing modelGroup, camera, or controls');
        return;
    }

    const box = new THREE.Box3();
    window.modelGroup.children.forEach(model => {
        if (model.visible) {
            model.updateMatrixWorld();
            const modelBox = new THREE.Box3().setFromObject(model);
            box.union(modelBox);
        }
    });

    let center, size, maxDim;
    if (box.isEmpty()) {
        console.warn('[WARN] animation_controls.adjustCamera: Bounding box is empty, using default values');
        center = new THREE.Vector3(0, 0, window.arMode ? -2 : 0);
        size = new THREE.Vector3(1, 1, 1);
        maxDim = 1;
    } else {
        center = box.getCenter(new THREE.Vector3());
        size = box.getSize(new THREE.Vector3());
        maxDim = Math.max(size.x, size.y, size.z);
    }

    const scaleFactor = Math.max(0, Math.min(window.modelScaleValue || 1, 10));
    const baseDistance = maxDim * 1.5;
    const cameraDistance = baseDistance / Math.sqrt(scaleFactor);
    const minDistance = maxDim * 0.1;
    const maxDistance = maxDim * 5;

    const clampedCameraDistance = Math.min(Math.max(cameraDistance, 0.1), 20);
    const clampedMinDistance = Math.min(Math.max(minDistance, 0.05), 2);
    const clampedMaxDistance = Math.min(Math.max(maxDistance, 5), 50);

    window.currentControls.target.copy(center);
    if (window.arMode) {
        window.modelGroup.children.forEach(model => {
            const modelCenter = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
            model.position.set(0, 0, -2);
            model.position.sub(modelCenter);
            model.visible = true;
        });
        window.currentCamera.position.set(0, 0, 0);
        const arCenter = new THREE.Vector3(0, 0, -2);
        window.currentCamera.lookAt(arCenter);
        window.currentControls.target.copy(arCenter);
        window.currentControls.minDistance = clampedMinDistance;
        window.currentControls.maxDistance = clampedMaxDistance;
    } else {
        window.currentCamera.position.set(center.x, center.y, center.z + clampedCameraDistance);
        window.currentCamera.lookAt(center);
        window.currentControls.target.copy(center);
        window.currentControls.minDistance = clampedMinDistance;
        window.currentControls.maxDistance = clampedMaxDistance;
    }

    window.currentControls.enableRotate = true;
    window.currentControls.enableZoom = true;
    window.currentControls.enablePan = true;
    window.currentControls.enableDamping = true;
    window.currentControls.dampingFactor = Number(window.dampingFactor) || 0.1;
    window.currentControls.update();

    updateLightDirection();

    console.log('[DEBUG] animation_controls.adjustCamera: Completed');
}

function updateLights() {
    if (!window.currentScene) {
        console.error('[ERROR] updateLights: Scene not initialized');
        return;
    }

    if (window.spotLight) {
        window.spotLight.intensity = Number(window.lightIntensity) || 6;
        window.spotLight.castShadow = Number(window.shadowIntensity) > 0;
        window.spotLight.shadow.intensity = Number(window.shadowIntensity) || 0.5;
        updateLightDirection();
    }

    if (window.ambientLight) {
        window.ambientLight.intensity = Number(window.ambientLightIntensity) || 4;
    }
}

function updateLightDirection() {
    if (!window.spotLight || !window.modelGroup) {
        console.warn('[WARN] updateLightDirection: Missing spotlight or modelGroup');
        return;
    }

    const box = new THREE.Box3();
    window.modelGroup.children.forEach(model => {
        if (model.visible) {
            model.updateMatrixWorld();
            const modelBox = new THREE.Box3().setFromObject(model);
            box.union(modelBox);
        }
    });

    let center, maxDim;
    if (box.isEmpty()) {
        console.warn('[WARN] updateLightDirection: Bounding box is empty, using default values');
        center = new THREE.Vector3(0, 0, window.arMode ? -2 : 0);
        maxDim = 1;
    } else {
        center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        maxDim = Math.max(size.x, size.y, size.z);
    }

    const distance = maxDim * 2;
    const azimuthRad = (window.lightAzimuth || 45) * Math.PI / 180;
    const elevationRad = (window.lightElevation || 45) * Math.PI / 180;

    const x = center.x + distance * Math.sin(elevationRad) * Math.cos(azimuthRad);
    const y = center.y + distance * Math.cos(elevationRad);
    const z = center.z + distance * Math.sin(elevationRad) * Math.sin(azimuthRad);

    window.spotLight.position.set(x, y, z);
    window.spotLight.target.position.copy(center);
    window.spotLight.target.updateMatrixWorld();
    console.log('[DEBUG] updateLightDirection: Spotlight positioned at', window.spotLight.position);
}

function resetPhysics() {
    if (!window.modelGroup || !window.velocities) {
        console.warn('[WARN] resetPhysics: Missing modelGroup or velocities');
        return;
    }

    window.isResetting = true;

    window.modelGroup.children.forEach(model => {
        let originalPos = window.originalPositions.get(model) || new THREE.Vector3();
        if (originalPos.y <= 0) {
            originalPos.set(originalPos.x, 5, originalPos.z);
            window.originalPositions.set(model, originalPos);
        }
        model.position.copy(originalPos);
        model.rotation.set(0, 0, 0);
        model.scale.copy(window.originalScales.get(model) || new THREE.Vector3(1, 1, 1));
        model.updateMatrixWorld(true);

        const velocity = window.velocities.get(model) || { x: 0, y: 0, z: 0, angularX: 0, angularY: 0, angularZ: 0 };
        velocity.x = velocity.y = velocity.z = velocity.angularX = velocity.angularY = velocity.angularZ = 0;
        window.velocities.set(model, velocity);

        model.traverse(child => {
            if (!child.isMesh) return;

            delete child.userData.originalMaterial;
            delete child.userData.originalScale;

            child.material.color.set(child.material.color.getHex());
            child.material.opacity = 1.0;
            child.material.needsUpdate = true;

            child.scale.set(1, 1, 1);

            child.visible = true;
        });

        delete model.userData.originalScale;
        model.scale.set(1, 1, 1);
        model.updateMatrixWorld(true);

        console.log(`[DEBUG] resetPhysics: Model ${model.name} reset to position y=${model.position.y}`);
    });

    if (window.mixers && window.mixers.length > 0) {
        window.mixers.forEach(mixer => {
            mixer.timeScale = 1.0;
            console.log(`[DEBUG] resetPhysics: Reset animation speed for ${mixer._root.name}`);
        });
    }

    window.healthLevel = 1;
    window.growthRate = 1;
    window.energyLevel = 1;
    window.interactionRate = 1;
    window.highlightPart = 'none';
    window.isolatePart = 'all';
    console.log('[DEBUG] resetPhysics: Reset biology controls');

    adjustCamera();

    window.isResetting = false;
}

window.animation_controls = {
    animate,
    animatePhysics,
    adjustCamera,
    updateLights,
    updateLightDirection,
    resetPhysics,
    updateBiologyControls
};