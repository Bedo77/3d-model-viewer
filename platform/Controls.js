console.log('Controls.js: File loaded');
try {
    window.Controls = window.Controls || {};
    console.log('[DEBUG] Controls.js: Script loaded');

    const Controls = {
        createSimulationPanel(viewportId, isSingleModel, selectedModelName) {
            console.log('[DEBUG] createSimulationPanel: Starting with viewportId=', viewportId, 'isSingleModel=', isSingleModel, 'selectedModelName=', selectedModelName);
            let viewport = document.getElementById(viewportId);
            if (!viewport) {
                console.warn(`[WARN] Viewport with ID ${viewportId} not found, creating one`);
                viewport = document.createElement('div');
                viewport.id = viewportId;
                viewport.style.cssText = 'position: relative; width: 100%; height: 100vh;';
                document.body.appendChild(viewport);
            }

            try {
                let controlPanel = viewport.querySelector('.control-panel');
                if (!controlPanel) {
                    console.warn('[WARN] Control panel not found, creating a placeholder');
                    controlPanel = document.createElement('div');
                    controlPanel.className = 'control-panel';
                    viewport.appendChild(controlPanel);
                }

                let simulationPanel = viewport.querySelector('.simulation-panel');
                if (simulationPanel) {
                    simulationPanel.remove();
                }

                simulationPanel = document.createElement('div');
                simulationPanel.className = 'simulation-panel';
                simulationPanel.setAttribute('data-simulation-panel', 'true');

                const panelTitle = document.createElement('div');
                panelTitle.className = 'panel-title';
                panelTitle.textContent = 'Simulation Panel';
                simulationPanel.appendChild(panelTitle);

                const sections = [
                    {
                        name: 'Model Parameters',
                        controls: [
                            {
                                id: 'modelScaleValue',
                                label: 'Model Scale',
                                min: 0.1,
                                max: 10,
                                step: 0.1,
                                value: window.modelScaleValue || 1,
                                update: (value) => {
                                    window.modelScaleValue = Math.max(0.1, Math.min(10, value));
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            let baseScale = window.originalScales.get(model);
                                            if (!baseScale || isNaN(baseScale.x) || isNaN(baseScale.y) || isNaN(baseScale.z) ||
                                                baseScale.x <= 0.001 || baseScale.y <= 0.001 || baseScale.z <= 0.001) {
                                                baseScale = new THREE.Vector3(1, 1, 1);
                                                window.originalScales.set(model, baseScale);
                                            }
                                            model.scale.set(
                                                baseScale.x * window.modelScaleValue,
                                                baseScale.y * window.modelScaleValue,
                                                baseScale.z * window.modelScaleValue
                                            );
                                            model.updateMatrixWorld(true);
                                        });
                                        if (window.currentCamera && window.currentControls) {
                                            const box = new THREE.Box3().setFromObject(window.modelGroup);
                                            const center = box.getCenter(new THREE.Vector3());
                                            window.currentControls.target.copy(center);
                                            window.currentCamera.lookAt(center);
                                            window.currentControls.update();
                                        }
                                    }
                                    console.log('[DEBUG] modelScaleValue updated to:', window.modelScaleValue);
                                }
                            },
                            { id: 'specificParamValue', label: 'Specific Param', min: 0, max: 4, step: 0.01, value: window.specificParamValue || 1 },
                            {
                                id: 'autoRotate',
                                label: 'Auto Rotate',
                                type: 'checkbox',
                                value: window.autoRotate || false,
                                update: (checked) => {
                                    window.autoRotate = checked;
                                    if (window.currentControls) {
                                        window.currentControls.autoRotate = checked;
                                        window.currentControls.autoRotateSpeed = checked ? 1.0 : 0;
                                        window.currentControls.update();
                                    }
                                    console.log('[DEBUG] autoRotate updated to:', window.autoRotate);
                                }
                            }
                        ]
                    },
                    {
                        name: 'Physical Parameters',
                        controls: [
                            {
                                id: 'forceMagnitude',
                                label: 'Force',
                                min: 0,
                                max: 5, // Reduced range
                                step: 0.1,
                                value: window.forceMagnitude || 0,
                                update: (value) => {
                                    console.log('[DEBUG] forceMagnitude update called with value:', value);
                                    window.forceMagnitude = Number(value) || 0;
                                    const mass = Number(window.mass) || 1;
                                    window.motionSpeed = 0.2 + (window.forceMagnitude / (mass * 5));
                                    window.animation_controls.animatePhysics(0.033);
                                    console.log(`[DEBUG] forceMagnitude set to ${window.forceMagnitude}, motionSpeed set to ${window.motionSpeed}`);
                                }
                            },
                            { 
                                id: 'frictionCoefficient', 
                                label: 'Friction', 
                                min: 0, 
                                max: 2, 
                                step: 0.01, 
                                value: window.frictionCoefficient || 0,
                                update: (value) => {
                                    window.frictionCoefficient = Number(value) || 0;
                                    if (window.currentControls) {
                                        window.currentControls.dampingFactor = 0.1 + (window.frictionCoefficient * 0.2);
                                        window.currentControls.update();
                                    }
                                }
                            },
                            {
                                id: 'mass',
                                label: 'Mass',
                                min: 0.1,
                                max: 20, // Increased range
                                step: 0.1,
                                value: window.mass || 1,
                                update: (value) => {
                                    console.log('[DEBUG] mass update called with value:', value);
                                    window.mass = Number(value) || 1;
                                    const force = Number(window.forceMagnitude) || 0;
                                    window.motionSpeed = 0.2 + (force / (window.mass * 5));
                                    window.animation_controls.animatePhysics(0.033);
                                    console.log(`[DEBUG] mass set to ${window.mass}, motionSpeed recalculated to ${window.motionSpeed}`);
                                }
                            },
                            { 
                                id: 'elasticity', 
                                label: 'Elasticity', 
                                min: 0, 
                                max: 2, 
                                step: 0.01, 
                                value: window.elasticity || 0,
                                update: (value) => {
                                    window.elasticity = Number(value) || 0;
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            const velocity = window.velocities.get(model) || { x: 0, y: 0, z: 0 };
                                            velocity.y *= (1 - (window.elasticity * 0.1));
                                            window.velocities.set(model, velocity);
                                        });
                                    }
                                }
                            },
                            { 
                                id: 'airResistance', 
                                label: 'Air Resistance', 
                                min: 0, 
                                max: 2, 
                                step: 0.01, 
                                value: window.airResistance || 0,
                                update: (value) => {
                                    window.airResistance = Number(value) || 0;
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            const velocity = window.velocities.get(model) || { x: 0, y: 0, z: 0 };
                                            velocity.x *= (1 - (window.airResistance * 0.05));
                                            velocity.z *= (1 - (window.airResistance * 0.05));
                                            window.velocities.set(model, velocity);
                                        });
                                    }
                                }
                            },
                            { 
                                id: 'torque', 
                                label: 'Torque', 
                                min: -0.1, 
                                max: 0.1, 
                                step: 0.001, 
                                value: window.torque || 0,
                                update: (value) => {
                                    window.torque = Number(value) || 0;
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            model.rotation.y += window.torque * 0.1;
                                            model.updateMatrixWorld(true);
                                        });
                                    }
                                }
                            },
                            { 
                                id: 'dampingFactor', 
                                label: 'Damping Factor', 
                                min: 0, 
                                max: 2, 
                                step: 0.01, 
                                value: window.dampingFactor || 0.1,
                                update: (value) => {
                                    window.dampingFactor = Number(value) || 0.1;
                                    if (window.currentControls) {
                                        window.currentControls.dampingFactor = window.dampingFactor;
                                        window.currentControls.update();
                                    }
                                }
                            }
                        ]
                    },
                    {
                        name: 'Environmental Parameters',
                        controls: [
                            {
                                id: 'gravityInfluence',
                                label: 'Gravity',
                                min: 0,
                                max: 2,
                                step: 0.01,
                                value: window.gravityInfluence || 0,
                                update: (value) => {
                                    window.gravityInfluence = Math.max(0, Math.min(2, value));
                                    window.animation_controls.animatePhysics(0.033);
                                    console.log('[DEBUG] gravityInfluence updated to:', window.gravityInfluence);
                                }
                            },
                            {
                                id: 'windSpeed',
                                label: 'Wind Speed',
                                min: -2,
                                max: 2,
                                step: 0.01,
                                value: window.windSpeed || 0,
                                update: (value) => {
                                    window.windSpeed = Math.max(-2, Math.min(2, value));
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            const originalPos = window.originalPositions.get(model) || new THREE.Vector3();
                                            model.position.copy(originalPos);
                                            model.updateMatrixWorld(true);
                                        });
                                        if (window.currentCamera && window.currentControls) {
                                            const box = new THREE.Box3().setFromObject(window.modelGroup);
                                            const center = box.getCenter(new THREE.Vector3());
                                            window.currentControls.target.copy(center);
                                            window.currentCamera.lookAt(center);
                                            window.currentControls.update();
                                        }
                                    }
                                    console.log('[DEBUG] windSpeed updated to:', window.windSpeed);
                                }
                            },
                            {
                                id: 'temperatureEffect',
                                label: 'Temperature',
                                min: -20,
                                max: 20,
                                step: 0.1,
                                value: window.temperatureEffect || 0,
                                update: (value) => {
                                    window.temperatureEffect = Math.max(-20, Math.min(20, value));
                                    window.lastTemperature = window.temperatureEffect;
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            model.traverse(child => {
                                                if (child.isMesh && child.material) {
                                                    if (!window.originalColors.has(child)) {
                                                        window.originalColors.set(child, child.material.color.clone());
                                                    }
                                                    const originalColor = window.originalColors.get(child);
                                                    let newColor = originalColor.clone();
                                                    if (window.temperatureEffect < 0) {
                                                        const intensity = Math.min(Math.abs(window.temperatureEffect) / 20, 1);
                                                        newColor.lerp(new THREE.Color(0x0000ff), intensity);
                                                    } else if (window.temperatureEffect > 0) {
                                                        const intensity = Math.min(window.temperatureEffect / 20, 1);
                                                        newColor.lerp(new THREE.Color(0xff0000), intensity);
                                                    }
                                                    child.material.color.copy(newColor);
                                                    child.material.needsUpdate = true;
                                                }
                                            });
                                        });
                                    }
                                    console.log('[DEBUG] temperatureEffect updated to:', window.temperatureEffect);
                                }
                            },
                            {
                                id: 'fogDensity',
                                label: 'Fog Density',
                                min: 0,
                                max: 0.2,
                                step: 0.001,
                                value: window.fogDensity || 0,
                                update: (value) => {
                                    window.fogDensity = Math.max(0, Math.min(0.2, value));
                                    if (window.currentScene && window.modelGroup) {
                                        if (window.fogDensity > 0) {
                                            const box = new THREE.Box3();
                                            window.modelGroup.children.forEach(model => {
                                                model.updateMatrixWorld();
                                                const modelBox = new THREE.Box3().setFromObject(model);
                                                box.union(modelBox);
                                            });
                                            const size = box.getSize(new THREE.Vector3());
                                            const maxDim = Math.max(size.x, size.y, size.z);
                                            const near = maxDim * 0.1;
                                            const far = maxDim * 5 / window.fogDensity;
                                            window.currentScene.fog = new THREE.Fog(0xf0f0f0, near, far);
                                            if (window.currentRenderer) {
                                                window.currentRenderer.setClearColor(0xf0f0f0);
                                            }
                                        } else {
                                            window.currentScene.fog = null;
                                            if (window.currentRenderer) {
                                                window.currentRenderer.setClearColor(0x000000);
                                            }
                                        }
                                        console.log('[DEBUG] fogDensity updated to:', window.fogDensity, 'Fog:', window.currentScene.fog);
                                    } else {
                                        console.warn('[WARN] Cannot update fogDensity: missing scene or modelGroup');
                                    }
                                }
                            }
                        ]
                    },
                    {
                        name: 'Biological Parameters',
                        controls: [
                            { id: 'energyLevel', label: 'Energy Level', min: 0, max: 4, step: 0.01, value: window.energyLevel || 1 },
                            { id: 'growthRate', label: 'Growth Rate', min: 0, max: 4, step: 0.01, value: window.growthRate || 1 },
                            { id: 'interactionRate', label: 'Interaction Rate', min: 0, max: 4, step: 0.01, value: window.interactionRate || 1 },
                            { id: 'healthLevel', label: 'Health Level', min: 0, max: 4, step: 0.01, value: window.healthLevel || 1 }
                        ]
                    },
                    {
                        name: 'Engineering Parameters',
                        controls: [
                            {
                                id: 'materialStrength',
                                label: 'Material Strength',
                                min: 0,
                                max: 4,
                                step: 0.01,
                                value: window.materialStrength || 1,
                                update: (value) => {
                                    window.materialStrength = Number(value) || 1;
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            model.traverse(child => {
                                                if (child.isMesh && child.material) {
                                                    child.material.metalness = Math.min(0.5 + (window.materialStrength * 0.1), 1);
                                                    child.material.roughness = Math.max(0.1, 0.5 - (window.materialStrength * 0.1));
                                                    child.material.needsUpdate = true;
                                                }
                                            });
                                        });
                                    }
                                }
                            },
                            {
                                id: 'tensionForce',
                                label: 'Tension Force',
                                min: -2,
                                max: 2,
                                step: 0.01,
                                value: window.tensionForce || 0,
                                update: (value) => {
                                    window.tensionForce = Number(value) || 0;
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            const scale = window.originalScales.get(model) || new THREE.Vector3(1, 1, 1);
                                            model.scale.set(
                                                scale.x * (1 + (window.tensionForce * 0.1)),
                                                scale.y * (1 - (window.tensionForce * 0.05)),
                                                scale.z * (1 + (window.tensionForce * 0.1))
                                            );
                                            model.updateMatrixWorld(true);
                                        });
                                    }
                                }
                            },
                            {
                                id: 'rotationAxis',
                                label: 'Rotation Axis',
                                type: 'select',
                                options: ['X', 'Y', 'Z'],
                                value: window.rotationAxis || 'Y',
                                update: (value) => {
                                    window.rotationAxis = value;
                                    if (window.modelGroup && window.currentControls) {
                                        window.currentControls.autoRotate = false;
                                        window.currentControls.autoRotateSpeed = 0;
                                        const rotationSpeed = 0.5;
                                        window.modelGroup.children.forEach(model => {
                                            if (window.rotationAxis === 'X') {
                                                model.rotation.x += rotationSpeed * 0.01;
                                            } else if (window.rotationAxis === 'Y') {
                                                model.rotation.y += rotationSpeed * 0.01;
                                            } else if (window.rotationAxis === 'Z') {
                                                model.rotation.z += rotationSpeed * 0.01;
                                            }
                                            model.updateMatrixWorld(true);
                                        });
                                    }
                                }
                            }
                        ]
                    },
                    {
                        name: 'Lighting Parameters',
                        controls: [
                            { id: 'lightIntensity', label: 'Spotlight Intensity', min: 0, max: 20, step: 0.1, value: window.lightIntensity || 6, update: (value) => {
                                window.lightIntensity = value;
                                window.animation_controls.updateLights();
                            }},
                            { id: 'ambientLightIntensity', label: 'Ambient Light', min: 0, max: 20, step: 0.1, value: window.ambientLightIntensity || 4, update: (value) => {
                                window.ambientLightIntensity = value;
                                window.animation_controls.updateLights();
                            }},
                            { id: 'shadowIntensity', label: 'Shadow Intensity', min: 0, max: 2, step: 0.01, value: window.shadowIntensity || 0.5 },
                            { id: 'lightAzimuth', label: 'Light Azimuth (°)', min: 0, max: 360, step: 1, value: window.lightAzimuth || 45, update: (value) => {
                                window.lightAzimuth = value;
                                window.animation_controls.updateLightDirection();
                            }},
                            { id: 'lightElevation', label: 'Light Elevation (°)', min: 0, max: 90, step: 1, value: window.lightElevation || 45, update: (value) => {
                                window.lightElevation = value;
                                window.animation_controls.updateLightDirection();
                            }}
                        ]
                    },
                    {
                        name: 'Motion and Mechanics',
                        controls: [
                            {
                                id: 'motionAxis',
                                label: 'Motion Direction',
                                type: 'select',
                                options: ['X', 'Y', 'Z'],
                                value: window.motionAxis || 'X',
                                update: (value) => {
                                    window.motionAxis = value;
                                    window.animation_controls.animatePhysics(0.033);
                                    console.log('[DEBUG] motionAxis updated to:', window.motionAxis);
                                }
                            },
                            {
                                id: 'directionalSpeed',
                                label: 'Directional Speed',
                                min: -2,
                                max: 2,
                                step: 0.01,
                                value: window.directionalSpeed || 0,
                                update: (value) => {
                                    window.directionalSpeed = Math.max(-2, Math.min(2, value));
                                    window.animation_controls.animatePhysics(0.033);
                                    console.log('[DEBUG] directionalSpeed updated to:', window.directionalSpeed);
                                }
                            },
                            {
                                id: 'launchAngle',
                                label: 'Launch Angle',
                                min: 0,
                                max: 180,
                                step: 1,
                                value: window.launchAngle || 0,
                                update: (value) => {
                                    window.launchAngle = Math.max(0, Math.min(180, value));
                                    if (window.modelGroup) {
                                        window.modelGroup.children.forEach(model => {
                                            const velocity = window.velocities.get(model) || { x: 0, y: 0, z: 0, angularX: 0, angularY: 0, angularZ: 0 };
                                            const angleRad = window.launchAngle * Math.PI / 180;
                                            const speed = 0.1;
                                            velocity.x = Math.cos(angleRad) * speed;
                                            velocity.z = Math.sin(angleRad) * speed;
                                            window.velocities.set(model, velocity);
                                            model.updateMatrixWorld(true);
                                        });
                                        window.animation_controls.animatePhysics(0.033);
                                    }
                                    console.log('[DEBUG] launchAngle updated to:', window.launchAngle, 'velocity=', window.velocities.get(window.modelGroup.children[0]));
                                }
                            },
                            {
                                id: 'motionSpeed',
                                label: 'Motion Speed',
                                min: -2,
                                max: 2,
                                step: 0.01,
                                value: window.motionSpeed || 0,
                                update: (value) => {
                                    window.motionSpeed = Math.max(-2, Math.min(2, value));
                                    console.log('[DEBUG] motionSpeed updated to:', window.motionSpeed);
                                }
                            }
                        ]
                    },
                    {
                        name: 'Energy and Thermodynamics',
                        controls: [
                            { id: 'kineticEnergy', label: 'Kinetic Energy', min: 0, max: 200, step: 1, value: window.kineticEnergy || 0 },
                            { id: 'potentialEnergy', label: 'Potential Energy', min: 0, max: 200, step: 1, value: window.potentialEnergy || 0 },
                            { id: 'heatTransfer', label: 'Heat Input', min: -100, max: 100, step: 1, value: window.heatTransfer || 0 }
                        ]
                    },
                    {
                        name: 'Electrical Circuits',
                        controls: [
                            { id: 'voltage', label: 'Voltage', min: 0, max: 24, step: 0.1, value: window.voltage || 0 },
                            { id: 'resistance', label: 'Resistance', min: 1, max: 200, step: 1, value: window.resistance || 10 },
                            { id: 'circuitSwitch', label: 'Circuit Switch', type: 'checkbox', value: window.circuitSwitch || false }
                        ]
                    },
                    {
                        name: 'Chemistry and Molecular',
                        controls: [
                            { id: 'reactionRate', label: 'Reaction Speed', min: 0, max: 4, step: 0.01, value: window.reactionRate || 1 },
                            { id: 'molecularVibration', label: 'Vibration Energy', min: 0, max: 2, step: 0.01, value: window.molecularVibration || 0 },
                            { id: 'matterState', label: 'State of Matter', type: 'select', options: ['Solid', 'Liquid', 'Gas'], value: window.matterState || 'Solid' }
                        ]
                    },
                    {
                        name: 'Astronomy and Planetary',
                        controls: [
                            { id: 'orbitalRadius', label: 'Orbit Distance', min: 1, max: 20, step: 0.1, value: window.orbitalRadius || 5 },
                            { id: 'orbitalSpeed', label: 'Orbit Speed', min: 0, max: 0.2, step: 0.001, value: window.orbitalSpeed || 0.01 },
                            { id: 'starBrightness', label: 'Star Brightness', min: 0, max: 10, step: 0.1, value: window.starBrightness || 1 }
                        ]
                    }
                ];

                console.log('[DEBUG] createSimulationPanel: Processing', sections.length, 'sections');
                sections.forEach((section, sectionIndex) => {
                    console.log('[DEBUG] Processing section:', section.name, 'with', section.controls.length, 'controls');
                    const sectionDiv = document.createElement('div');
                    sectionDiv.className = 'collapsible-section';

                    const header = document.createElement('div');
                    header.className = 'collapsible-header';
                    header.textContent = section.name;
                    sectionDiv.appendChild(header);

                    const content = document.createElement('div');
                    content.className = 'collapsible-content';

                    section.controls.forEach((control, controlIndex) => {
                        console.log('[DEBUG] Creating control:', control.id, 'type:', control.type || 'range');
                        try {
                            if (!control.id || !control.label) {
                                throw new Error(`Invalid control at section ${sectionIndex}, control ${controlIndex}: id=${control.id}, label=${control.label}`);
                            }

                            const controlDiv = document.createElement('div');
                            controlDiv.className = 'control-item';

                            const label = document.createElement('label');
                            label.htmlFor = control.id;
                            label.textContent = control.label;
                            controlDiv.appendChild(label);

                            let input;
                            if (control.type === 'checkbox') {
                                input = document.createElement('input');
                                input.type = 'checkbox';
                                input.id = control.id;
                                input.name = control.id;
                                input.checked = control.value;
                                if (control.update) {
                                    input.addEventListener('change', () => {
                                        try {
                                            control.update(input.checked);
                                        } catch (error) {
                                            console.error(`[ERROR] Checkbox update error for ${control.id}:`, error);
                                        }
                                    });
                                }
                            } else if (control.type === 'select') {
                                input = document.createElement('select');
                                input.id = control.id;
                                input.name = control.id;
                                control.options.forEach(option => {
                                    const opt = document.createElement('option');
                                    opt.value = option;
                                    opt.textContent = option;
                                    if (option === control.value) {
                                        opt.selected = true;
                                    }
                                    input.appendChild(opt);
                                });
                                if (control.update) {
                                    input.addEventListener('change', Controls.debounce(() => {
                                        try {
                                            control.update(input.value);
                                        } catch (error) {
                                            console.error(`[ERROR] Select update error for ${control.id}:`, error);
                                        }
                                    }, 100));
                                }
                            } else {
                                input = document.createElement('input');
                                input.type = 'range';
                                input.id = control.id;
                                input.name = control.id;
                                input.min = control.min;
                                input.max = control.max;
                                input.step = control.step;
                                input.value = control.value;

                                const valueDisplay = document.createElement('span');
                                valueDisplay.className = `value-display-${control.id}`;
                                valueDisplay.textContent = typeof control.value === 'number' ? control.value.toFixed(2) : control.value;
                                controlDiv.appendChild(input);
                                controlDiv.appendChild(valueDisplay);

                                if (control.update) {
                                    input.addEventListener('input', () => {
                                        try {
                                            const newValue = parseFloat(input.value);
                                            valueDisplay.textContent = newValue.toFixed(2);
                                            control.update(newValue);
                                        } catch (error) {
                                            console.error(`[ERROR] Range input update error for ${control.id}:`, error);
                                        }
                                    });
                                }
                            }

                            controlDiv.appendChild(input);
                            content.appendChild(controlDiv);
                        } catch (error) {
                            console.error(`[ERROR] Failed to create control at section ${sectionIndex}, control ${controlIndex}:`, error);
                        }
                    });

                    sectionDiv.appendChild(content);
                    simulationPanel.appendChild(sectionDiv);
                });

                // Add the reset button as the last element with matching width
                const resetButton = document.createElement('button');
                resetButton.id = 'resetSimulation';
                resetButton.textContent = 'Reset Simulation';
                resetButton.style.cssText = `
                    width: 100%;
                    padding: 8px 16px;
                    margin-top: 20px;
                    margin-bottom: 0px;
                    box-sizing: border-box;
                    position: sticky;
                    bottom: -14;
                    background: inherit; /* Inherit background to match panel */
                    z-index: 10; /* Ensure button is above content */
                `;
                simulationPanel.appendChild(resetButton);

                viewport.appendChild(simulationPanel);

                console.log('[DEBUG] createSimulationPanel: Panel created, initializing');
                Controls.initialize();
                if (window.modelGroup && window.modelGroup.children.length > 0) {
                    Controls.initializeComponents();
                } else {
                    console.warn('[WARN] Model group is empty, components not initialized');
                }
                Controls.adjustCamera();
                console.log('[DEBUG] createSimulationPanel: Completed');
            } catch (error) {
                console.error('[ERROR] Failed to create simulation panel:', error);
                simulationPanel.innerHTML = `
                    <div style="color: red; font-weight: bold;">
                        Error: Failed to initialize simulation panel.
                    </div>
                `;
            }
        },

        setupCollapsibleSections() {
            console.log('[DEBUG] setupCollapsibleSections: Starting');
            const headers = document.querySelectorAll('.collapsible-header');
            headers.forEach(header => {
                header.addEventListener('click', () => {
                    const content = header.nextElementSibling;
                    const isOpen = content.classList.contains('active');
                    const simulationPanel = header.closest('.simulation-panel');

                    headers.forEach(otherHeader => {
                        const otherContent = otherHeader.nextElementSibling;
                        otherHeader.classList.remove('active');
                        otherContent.classList.remove('active');
                    });

                    if (!isOpen) {
                        header.classList.add('active');
                        content.classList.add('active');
                        const headerRect = header.getBoundingClientRect();
                        const panelRect = simulationPanel.getBoundingClientRect();
                        simulationPanel.scrollTo({
                            top: simulationPanel.scrollTop + headerRect.top - panelRect.top - 10,
                            behavior: 'smooth'
                        });
                    }
                });
            });
            console.log('[DEBUG] setupCollapsibleSections: Completed');
        },

        initialize() {
            console.log('[DEBUG] initialize: Starting');
            window.modelGroup = window.modelGroup || { children: [] };
            window.originalScales = window.originalScales || new Map();
            window.originalPositions = window.originalPositions || new Map();
            window.velocities = window.velocities || new Map();
            window.motionSpeed = window.motionSpeed || 0;
            window.originalColors = window.originalColors || new Map();
            window.lastTemperature = window.lastTemperature || 0;
            window.arrowBones = window.arrowBones || new Map();
            window.rainDrops = window.rainDrops || new Map();
            window.snowFlakes = window.snowFlakes || new Map();
            window.clouds = window.clouds || new Map();
            window.waterBase = window.waterBase || null;

            try {
                if (window.currentScene) {
                    window.currentScene.background = new THREE.Color(0x000000);
                    if (!window.ambientLight) {
                        window.ambientLight = new THREE.AmbientLight(0xffffff, 4);
                        window.currentScene.add(window.ambientLight);
                    }
                    if (!window.spotLight) {
                        window.spotLight = new THREE.SpotLight(0xffffff, 6);
                        window.spotLight.position.set(0, 5, 5);
                        window.spotLight.castShadow = true;
                        window.currentScene.add(window.spotLight);
                    }
                }

                if (window.modelGroup) {
                    window.modelGroup.children.forEach(model => {
                        let currentScale = window.originalScales.get(model);
                        if (!currentScale || isNaN(currentScale.x) || isNaN(currentScale.y) || isNaN(currentScale.z) ||
                            currentScale.x <= 0.001 || currentScale.y <= 0.001 || currentScale.z <= 0.001) {
                            console.warn(`[WARN] Invalid original scale for ${model.name}, resetting to (1, 1, 1)`);
                            currentScale = new THREE.Vector3(1, 1, 1);
                            window.originalScales.set(model, currentScale);
                            model.scale.copy(currentScale);
                            model.updateMatrixWorld(true);
                        }
                        if (!window.originalPositions.has(model)) {
                            window.originalPositions.set(model, model.position.clone());
                        }
                        if (!window.velocities.has(model)) {
                            window.velocities.set(model, { x: 0, y: 0, z: 0, angularX: 0, angularY: 0, angularZ: 0 });
                        }
                        if (!window.originalColors.has(model)) {
                            model.traverse(child => {
                                if (child.isMesh && child.material) {
                                    window.originalColors.set(child, child.material.color.clone());
                                }
                            });
                        }
                    });
                }

                Controls.setupCollapsibleSections();
                Controls.setupControlListeners();
                const resetButton = document.getElementById('resetSimulation');
                if (resetButton) {
                    resetButton.addEventListener('click', Controls.resetSimulation);
                }
                console.log('[DEBUG] initialize: Completed');
            } catch (error) {
                console.error('[ERROR] Failed to initialize Controls:', error);
            }
        },

        initializeComponents() {
            console.log('[DEBUG] initializeComponents: Starting');
            window.arrowBones = window.arrowBones || new Map();
            window.rainDrops = window.rainDrops || new Map();
            window.snowFlakes = window.snowFlakes || new Map();
            window.clouds = window.clouds || new Map();
            window.waterBase = window.waterBase || null;

            let objectCount = 0;
            const maxLoggedObjects = 10;

            if (window.modelGroup) {
                window.modelGroup.children.forEach(model => {
                    model.traverse(object => {
                        if (objectCount < maxLoggedObjects) {
                            objectCount++;
                        } else if (objectCount === maxLoggedObjects) {
                            objectCount++;
                        }

                        if (object.name.includes('Arrow')) {
                            window.arrowBones.set(object.name, object);
                            if (!window.originalPositions.has(object)) {
                                window.originalPositions.set(object, new THREE.Vector3(object.position.x, object.position.y, object.position.z));
                            }
                            if (!window.velocities.has(object)) {
                                window.velocities.set(object, { x: 0, y: 0, z: 0, angularX: 0, angularY: 0, angularZ: 0 });
                            }
                        } else if (object.name.includes('Rain_drop')) {
                            window.rainDrops.set(object.name, object);
                            if (!window.originalPositions.has(object)) {
                                window.originalPositions.set(object, new THREE.Vector3(object.position.x, object.position.y, object.position.z));
                            }
                            if (!window.velocities.has(object)) {
                                window.velocities.set(object, { x: 0, y: 0, z: 0 });
                            }
                        } else if (object.name.includes('Snow')) {
                            window.snowFlakes.set(object.name, object);
                            if (!window.originalPositions.has(object)) {
                                window.originalPositions.set(object, new THREE.Vector3(object.position.x, object.position.y, object.position.z));
                            }
                            if (!window.velocities.has(object)) {
                                window.velocities.set(object, { x: 0, y: 0, z: 0 });
                            }
                        } else if (object.name.includes('Cloud')) {
                            window.clouds.set(object.name, object);
                            if (!window.originalPositions.has(object)) {
                                window.originalPositions.set(object, new THREE.Vector3(object.position.x, object.position.y, object.position.z));
                            }
                            if (!window.velocities.has(object)) {
                                window.velocities.set(object, { x: 0, y: 0, z: 0 });
                            }
                        } else if (object.name.includes('Water_Base')) {
                            window.waterBase = object;
                            if (!window.originalPositions.has(object)) {
                                window.originalPositions.set(object, new THREE.Vector3(object.position.x, object.position.y, object.position.z));
                            }
                            if (!window.velocities.has(object)) {
                                window.velocities.set(object, { x: 0, y: 0, z: 0 });
                            }
                        }
                    });
                });
            }
            console.log('[DEBUG] initializeComponents: Completed');
        },

        debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        setupControlListeners() {
            console.log('[DEBUG] setupControlListeners: Starting');
            if (window.arrowBones.size === 0 && window.rainDrops.size === 0 && window.snowFlakes.size === 0 && window.clouds.size === 0 && !window.waterBase) {
                Controls.initializeComponents();
            }

            const controls = [
                { id: 'modelScaleValue', variable: 'modelScaleValue', update: (value) => {
                    const section = sections.find(s => s.name === 'Model Parameters');
                    const control = section.controls.find(c => c.id === 'modelScaleValue');
                    if (control.update) control.update(value);
                }},
                { id: 'specificParamValue', variable: 'specificParamValue' },
                { id: 'autoRotate', variable: 'autoRotate', type: 'checkbox', update: (value) => {
                    const section = sections.find(s => s.name === 'Model Parameters');
                    const control = section.controls.find(c => c.id === 'autoRotate');
                    if (control.update) control.update(value);
                }},
                { id: 'forceMagnitude', variable: 'forceMagnitude', update: (value) => {
                    const section = sections.find(s => s.name === 'Physical Parameters');
                    const control = section.controls.find(c => c.id === 'forceMagnitude');
                    if (control.update) control.update(value);
                }},
                { id: 'frictionCoefficient', variable: 'frictionCoefficient' },
                { id: 'mass', variable: 'mass', update: (value) => {
                    const section = sections.find(s => s.name === 'Physical Parameters');
                    const control = section.controls.find(c => c.id === 'mass');
                    if (control.update) control.update(value);
                }},
                { id: 'elasticity', variable: 'elasticity' },
                { id: 'airResistance', variable: 'airResistance' },
                { id: 'torque', variable: 'torque' },
                { id: 'dampingFactor', variable: 'dampingFactor' },
                { id: 'gravityInfluence', variable: 'gravityInfluence', update: (value) => {
                    const section = sections.find(s => s.name === 'Environmental Parameters');
                    const control = section.controls.find(c => c.id === 'gravityInfluence');
                    if (control.update) control.update(value);
                }},
                { id: 'windSpeed', variable: 'windSpeed', update: (value) => {
                    const section = sections.find(s => s.name === 'Environmental Parameters');
                    const control = section.controls.find(c => c.id === 'windSpeed');
                    if (control.update) control.update(value);
                }},
                { id: 'temperatureEffect', variable: 'temperatureEffect', update: (value) => {
                    const section = sections.find(s => s.name === 'Environmental Parameters');
                    const control = section.controls.find(c => c.id === 'temperatureEffect');
                    if (control.update) control.update(value);
                }},
                { id: 'fogDensity', variable: 'fogDensity', update: (value) => {
                    const section = sections.find(s => s.name === 'Environmental Parameters');
                    const control = section.controls.find(c => c.id === 'fogDensity');
                    if (control.update) control.update(value);
                }},
                { id: 'energyLevel', variable: 'energyLevel' },
                { id: 'growthRate', variable: 'growthRate' },
                { id: 'interactionRate', variable: 'interactionRate' },
                { id: 'healthLevel', variable: 'healthLevel' },
                { id: 'materialStrength', variable: 'materialStrength' },
                { id: 'tensionForce', variable: 'tensionForce' },
                { id: 'rotationAxis', variable: 'rotationAxis', type: 'select' },
                { id: 'lightIntensity', variable: 'lightIntensity', update: (value) => {
                    const section = sections.find(s => s.name === 'Lighting Parameters');
                    const control = section.controls.find(c => c.id === 'lightIntensity');
                    if (control.update) control.update(value);
                }},
                { id: 'ambientLightIntensity', variable: 'ambientLightIntensity', update: (value) => {
                    const section = sections.find(s => s.name === 'Lighting Parameters');
                    const control = section.controls.find(c => c.id === 'ambientLightIntensity');
                    if (control.update) control.update(value);
                }},
                { id: 'shadowIntensity', variable: 'shadowIntensity' },
                { id: 'lightAzimuth', variable: 'lightAzimuth', update: (value) => {
                    const section = sections.find(s => s.name === 'Lighting Parameters');
                    const control = section.controls.find(c => c.id === 'lightAzimuth');
                    if (control.update) control.update(value);
                }},
                { id: 'lightElevation', variable: 'lightElevation', update: (value) => {
                    const section = sections.find(s => s.name === 'Lighting Parameters');
                    const control = section.controls.find(c => c.id === 'lightElevation');
                    if (control.update) control.update(value);
                }},
                { id: 'motionAxis', variable: 'motionAxis', type: 'select', update: (value) => {
                    const section = sections.find(s => s.name === 'Motion and Mechanics');
                    const control = section.controls.find(c => c.id === 'motionAxis');
                    if (control.update) control.update(value);
                }},
                { id: 'directionalSpeed', variable: 'directionalSpeed', update: (value) => {
                    const section = sections.find(s => s.name === 'Motion and Mechanics');
                    const control = section.controls.find(c => c.id === 'directionalSpeed');
                    if (control.update) control.update(value);
                }},
                { id: 'launchAngle', variable: 'launchAngle', update: (value) => {
                    const section = sections.find(s => s.name === 'Motion and Mechanics');
                    const control = section.controls.find(c => c.id === 'launchAngle');
                    if (control.update) control.update(value);
                }},
                { id: 'motionSpeed', variable: 'motionSpeed', update: (value) => {
                    const section = sections.find(s => s.name === 'Motion and Mechanics');
                    const control = section.controls.find(c => c.id === 'motionSpeed');
                    if (control.update) control.update(value);
                }},
                { id: 'kineticEnergy', variable: 'kineticEnergy' },
                { id: 'potentialEnergy', variable: 'potentialEnergy' },
                { id: 'heatTransfer', variable: 'heatTransfer' },
                { id: 'voltage', variable: 'voltage' },
                { id: 'resistance', variable: 'resistance' },
                { id: 'circuitSwitch', variable: 'circuitSwitch', type: 'checkbox' },
                { id: 'reactionRate', variable: 'reactionRate' },
                { id: 'molecularVibration', variable: 'molecularVibration' },
                { id: 'matterState', variable: 'matterState', type: 'select' },
                { id: 'orbitalRadius', variable: 'orbitalRadius' },
                { id: 'orbitalSpeed', variable: 'orbitalSpeed' },
                { id: 'starBrightness', variable: 'starBrightness' }
            ];

            const sections = [
                {
                    name: 'Model Parameters',
                    controls: [
                        { id: 'modelScaleValue', variable: 'modelScaleValue' },
                        { id: 'specificParamValue', variable: 'specificParamValue' },
                        { id: 'autoRotate', variable: 'autoRotate', type: 'checkbox' }
                    ]
                },
                {
                    name: 'Physical Parameters',
                    controls: [
                        { id: 'forceMagnitude', variable: 'forceMagnitude' },
                        { id: 'frictionCoefficient', variable: 'frictionCoefficient' },
                        { id: 'mass', variable: 'mass' },
                        { id: 'elasticity', variable: 'elasticity' },
                        { id: 'airResistance', variable: 'airResistance' },
                        { id: 'torque', variable: 'torque' },
                        { id: 'dampingFactor', variable: 'dampingFactor' }
                    ]
                },
                {
                    name: 'Environmental Parameters',
                    controls: [
                        { id: 'gravityInfluence', variable: 'gravityInfluence' },
                        { id: 'windSpeed', variable: 'windSpeed' },
                        { id: 'temperatureEffect', variable: 'temperatureEffect' },
                        { id: 'fogDensity', variable: 'fogDensity' }
                    ]
                },
                {
                    name: 'Biological Parameters',
                    controls: [
                        { id: 'energyLevel', variable: 'energyLevel' },
                        { id: 'growthRate', variable: 'growthRate' },
                        { id: 'interactionRate', variable: 'interactionRate' },
                        { id: 'healthLevel', variable: 'healthLevel' }
                    ]
                },
                {
                    name: 'Engineering Parameters',
                    controls: [
                        { id: 'materialStrength', variable: 'materialStrength' },
                        { id: 'tensionForce', variable: 'tensionForce' },
                        { id: 'rotationAxis', variable: 'rotationAxis', type: 'select' }
                    ]
                },
                {
                    name: 'Lighting Parameters',
                    controls: [
                        { id: 'lightIntensity', variable: 'lightIntensity' },
                        { id: 'ambientLightIntensity', variable: 'ambientLightIntensity' },
                        { id: 'shadowIntensity', variable: 'shadowIntensity' },
                        { id: 'lightAzimuth', variable: 'lightAzimuth' },
                        { id: 'lightElevation', variable: 'lightElevation' }
                    ]
                },
                {
                    name: 'Motion and Mechanics',
                    controls: [
                        { id: 'motionAxis', variable: 'motionAxis', type: 'select' },
                        { id: 'directionalSpeed', variable: 'directionalSpeed' },
                        { id: 'launchAngle', variable: 'launchAngle' },
                        { id: 'motionSpeed', variable: 'motionSpeed' }
                    ]
                },
                {
                    name: 'Energy and Thermodynamics',
                    controls: [
                        { id: 'kineticEnergy', variable: 'kineticEnergy' },
                        { id: 'potentialEnergy', variable: 'potentialEnergy' },
                        { id: 'heatTransfer', variable: 'heatTransfer' }
                    ]
                },
                {
                    name: 'Electrical Circuits',
                    controls: [
                        { id: 'voltage', variable: 'voltage' },
                        { id: 'resistance', variable: 'resistance' },
                        { id: 'circuitSwitch', variable: 'circuitSwitch', type: 'checkbox' }
                    ]
                },
                {
                    name: 'Chemistry and Molecular',
                    controls: [
                        { id: 'reactionRate', variable: 'reactionRate' },
                        { id: 'molecularVibration', variable: 'molecularVibration' },
                        { id: 'matterState', variable: 'matterState', type: 'select' }
                    ]
                },
                {
                    name: 'Astronomy and Planetary',
                    controls: [
                        { id: 'orbitalRadius', variable: 'orbitalRadius' },
                        { id: 'orbitalSpeed', variable: 'orbitalSpeed' },
                        { id: 'starBrightness', variable: 'starBrightness' }
                    ]
                }
            ];

            controls.forEach(control => {
                const element = document.getElementById(control.id);
                if (element) {
                    if (control.type === 'checkbox') {
                        element.addEventListener('change', () => {
                            window[control.variable] = element.checked;
                            if (control.update) {
                                control.update(element.checked);
                            }
                        });
                    } else if (control.type === 'select') {
                        const debouncedUpdate = Controls.debounce(() => {
                            window[control.variable] = element.value;
                            if (control.update) {
                                control.update(element.value);
                            }
                        }, 100);
                        element.addEventListener('change', debouncedUpdate);
                    } else {
                        const updateValueDisplay = () => {
                            const valueDisplay = document.querySelector(`.value-display-${control.id}`);
                            if (valueDisplay) {
                                valueDisplay.textContent = Number(element.value).toFixed(2);
                            }
                        };
                        element.addEventListener('input', () => {
                            window[control.variable] = Number(element.value);
                            if (control.update) {
                                control.update(Number(element.value));
                            }
                            updateValueDisplay();
                        });
                        updateValueDisplay();
                    }
                }
            });

            console.log('[DEBUG] setupControlListeners: Completed');
        },

        resetSimulation() {
            console.log('[DEBUG] resetSimulation: Starting');
            try {
                const defaults = {
                    modelScaleValue: 1,
                    specificParamValue: 1,
                    autoRotate: false,
                    forceMagnitude: 0,
                    frictionCoefficient: 0,
                    mass: 1,
                    elasticity: 0,
                    airResistance: 0,
                    torque: 0,
                    dampingFactor: 0.1,
                    gravityInfluence: 0,
                    windSpeed: 0,
                    temperatureEffect: 0,
                    fogDensity: 0,
                    energyLevel: 1,
                    growthRate: 1,
                    interactionRate: 1,
                    healthLevel: 1,
                    materialStrength: 1,
                    tensionForce: 0,
                    rotationAxis: 'Y',
                    lightIntensity: 6,
                    ambientLightIntensity: 4,
                    shadowIntensity: 0.5,
                    lightAzimuth: 45,
                    lightElevation: 45,
                    motionAxis: 'X',
                    directionalSpeed: 0,
                    launchAngle: 0,
                    motionSpeed: 0,
                    kineticEnergy: 0,
                    potentialEnergy: 0,
                    heatTransfer: 0,
                    voltage: 0,
                    resistance: 10,
                    circuitSwitch: false,
                    reactionRate: 1,
                    molecularVibration: 0,
                    matterState: 'Solid',
                    orbitalRadius: 5,
                    orbitalSpeed: 0.01,
                    starBrightness: 1
                };

                Object.keys(defaults).forEach(key => {
                    window[key] = defaults[key];
                    const input = document.getElementById(key);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = defaults[key];
                        } else if (input.type === 'select-one') {
                            input.value = defaults[key];
                        } else {
                            input.value = defaults[key];
                            const valueDisplay = document.querySelector(`.value-display-${key}`);
                            if (valueDisplay) {
                                valueDisplay.textContent = typeof defaults[key] === 'number' ? defaults[key].toFixed(2) : defaults[key];
                            }
                        }
                    }
                });

                if (window.modelGroup) {
                    window.modelGroup.children.forEach(model => {
                        let baseScale = window.originalScales.get(model);
                        if (!baseScale || isNaN(baseScale.x) || isNaN(baseScale.y) || isNaN(baseScale.z) ||
                            baseScale.x <= 0.001 || baseScale.y <= 0.001 || baseScale.z <= 0.001) {
                            console.warn(`[WARN] Invalid base scale for ${model.name}, resetting to (1, 1, 1)`);
                            baseScale = new THREE.Vector3(1, 1, 1);
                            window.originalScales.set(model, baseScale);
                        }
                        model.scale.set(baseScale.x, baseScale.y, baseScale.z);
                        model.updateMatrixWorld(true);

                        const originalPos = window.originalPositions.get(model) || new THREE.Vector3();
                        model.position.copy(originalPos);
                        model.rotation.set(0, 0, 0);

                        const velocity = window.velocities.get(model) || { x: 0, y: 0, z: 0, angularX: 0, angularY: 0, angularZ: 0 };
                        velocity.x = velocity.y = velocity.z = velocity.angularX = velocity.angularY = velocity.angularZ = 0;
                        window.velocities.set(model, velocity);

                        model.traverse(child => {
                            if (child.isMesh && child.material && window.originalColors.has(child)) {
                                child.material.color.copy(window.originalColors.get(child));
                                child.material.emissive.set(0, 0, 0);
                                child.material.emissiveIntensity = 0;
                                child.material.opacity = 1;
                                child.material.transparent = false;
                                child.material.roughness = 0.5;
                                child.material.metalness = 0.5;
                                child.material.needsUpdate = true;
                            }
                        });
                    });
                }

                if (window.currentScene) {
                    window.currentScene.fog = null;
                    if (window.currentRenderer) {
                        window.currentRenderer.setClearColor(0x000000);
                    }
                }

                if (window.currentControls) {
                    window.currentControls.autoRotate = false;
                    window.currentControls.autoRotateSpeed = 0;
                    window.currentControls.dampingFactor = defaults.dampingFactor;
                    window.currentControls.enableDamping = true;
                    window.currentControls.update();
                }

                window.animation_controls.updateLights();
                window.animation_controls.resetPhysics();
                Controls.adjustCamera();
                console.log('[DEBUG] resetSimulation: Completed');
            } catch (error) {
                console.error('[ERROR] Failed to reset simulation:', error);
            }
        },

        adjustCamera() {
            console.log('[DEBUG] Controls.adjustCamera: Starting');
            try {
                if (!window.currentCamera || !window.currentControls || !window.modelGroup) {
                    console.warn('[WARN] Controls.adjustCamera: Missing camera, controls, or modelGroup');
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
                    console.warn('[WARN] Controls.adjustCamera: Bounding box is empty, using default values');
                    center = new THREE.Vector3(0, 0, window.arMode ? -2 : 0);
                    size = new THREE.Vector3(1, 1, 1);
                    maxDim = 1;
                } else {
                    center = box.getCenter(new THREE.Vector3());
                    size = box.getSize(new THREE.Vector3());
                    maxDim = Math.max(size.x, size.y, size.z);
                }

                const scaleFactor = Math.max(0.1, Math.min(window.modelScaleValue || 1, 10));
                const baseDistance = maxDim * 1.5;
                const cameraDistance = baseDistance / Math.sqrt(scaleFactor);
                const minDistance = maxDim * 0.1;
                const maxDistance = maxDim * 5;

                const clampedCameraDistance = Math.min(Math.max(cameraDistance, 0.1), 20);
                const clampedMinDistance = Math.min(Math.max(minDistance, 0.05), 2);
                const clampedMaxDistance = Math.min(Math.max(maxDistance, 5), 50);

                window.currentControls.target.copy(center);
                if (window.arMode) {
                    window.currentCamera.position.set(center.x, center.y, center.z);
                    window.currentControls.minDistance = clampedMinDistance;
                    window.currentControls.maxDistance = clampedMaxDistance;
                } else {
                    window.currentCamera.position.set(center.x, center.y, center.z + clampedCameraDistance);
                    window.currentControls.minDistance = clampedMinDistance;
                    window.currentControls.maxDistance = clampedMaxDistance;
                }

                window.currentCamera.lookAt(center);
                window.currentControls.enableRotate = true;
                window.currentControls.enableZoom = true;
                window.currentControls.enablePan = true;
                window.currentControls.update();
                console.log('[DEBUG] Controls.adjustCamera: Completed, minDistance=', clampedMinDistance, 'maxDistance=', clampedMaxDistance);
            } catch (error) {
                console.error('[ERROR] Controls.adjustCamera: Failed:', error);
            }
        }
    };

    window.Controls = Controls;
    console.log('[DEBUG] Controls.js: window.Controls defined');
} catch (error) {
    console.error('[ERROR] Failed to initialize Controls.js:', error);
    window.Controls = {
        createSimulationPanel: () => {
            console.error('[ERROR] Controls.js failed to initialize, cannot create simulation panel');
            const viewport = document.getElementById('modelViewport');
            if (viewport) {
                const controlPanel = document.createElement('div');
                controlPanel.className = 'control-panel';
                controlPanel.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 10px;
                    border-radius: 5px;
                    z-index: 10;
                `;
                controlPanel.innerHTML = `
                    <div style="color: red; font-weight: bold;">
                        Error: Simulation panel failed to load.
                    </div>
                `;
                viewport.appendChild(controlPanel);
            }
        }
    };
}