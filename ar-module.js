// AR Module for 3D Studio
// This script handles AR functionality using AR.js and Three.js

// Check if AR is supported
if (!navigator.xr || !navigator.xr.isSessionSupported) {
    alert("AR is not supported on this device. Please use a mobile device or a browser that supports WebXR.");
} else {
    // Import AR.js (if not already included)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/ar.js@latest';
    document.body.appendChild(script);

    // Wait for AR.js to load
    script.onload = function () {
        // Initialize AR scene, camera, and renderer
        const arScene = new THREE.Scene();
        const arCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const arRenderer = new THREE.WebGLRenderer({ alpha: true });

        // Set up AR.js
        const arToolkitSource = new THREEx.ArToolkitSource({
            sourceType: 'webcam',
        });

        const arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: 'https://raw.githubusercontent.com/Bedo77/3d-model-viewer/main/Resources/camera_para.dat', // Updated path
            detectionMode: 'mono',
        });

        // Initialize AR source and context
        arToolkitSource.init(() => {
            arToolkitSource.onResize();
            arToolkitContext.init(() => {
                arCamera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
            });
        });

        // Add the current model to the AR scene
        const currentModel = modelGroup.children[0].clone(); // Clone the current model
        arScene.add(currentModel);

        // Add a marker to the AR scene
        const markerRoot = new THREE.Group();
        arScene.add(markerRoot);

        const markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
            type: 'pattern',
            patternUrl: 'https://raw.githubusercontent.com/Bedo77/3d-model-viewer/main/Resources/hiro.patt', // Updated path
        });

        // Position the model relative to the marker
        currentModel.position.set(0, 0, 0); // Adjust as needed
        markerRoot.add(currentModel);

        // Render the AR scene
        function render() {
            requestAnimationFrame(render);

            // Update AR context
            if (arToolkitSource.ready) {
                arToolkitContext.update(arToolkitSource.domElement);
            }

            // Render the scene
            arRenderer.render(arScene, arCamera);
        }

        // Start rendering
        render();
    };
}
