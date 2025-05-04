// Debugging utility (shared with present.js)
const debug = {
    enabled: true,
    log: function(message) {
        if (this.enabled) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            console.log(`[${timestamp}] DEBUG: ${message}`);
        }
    },
    error: function(message, error) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.error(`[${timestamp}] ERROR: ${message}`, error);
    }
};

// Make elements draggable
function makeDraggable(element) {
    debug.log(`Making element draggable: ${element.className || element.id || 'unnamed element'}`);
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    // Lock the width before dragging to prevent stretching
    element.style.width = `${element.offsetWidth}px`;
    element.style.position = 'absolute';
    element.style.zIndex = 2500;

    let dragHandle = element.querySelector('.drag-handle');
    if (!dragHandle) {
        debug.log('Creating drag handle for element');
        dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.style.position = 'absolute';
        dragHandle.style.top = '-20px'; // Reduced overlap with contextual-toolbar
        dragHandle.style.left = '0';
        dragHandle.style.width = '100%';
        dragHandle.style.height = '20px'; // Reduced height to avoid overlap
        dragHandle.style.background = 'transparent';
        dragHandle.style.cursor = 'move';
        dragHandle.style.zIndex = 2900; // Lower than contextual-toolbar
        element.prepend(dragHandle);
    } else {
        debug.log('Drag handle already exists');
    }

    debug.log(`Drag handle style: ${dragHandle.style.cssText}`);

    const interactiveElements = element.querySelectorAll('button, input, audio, .contextual-toolbar');
    interactiveElements.forEach(child => {
        child.addEventListener('mousedown', (e) => {
            debug.log(`Preventing mousedown propagation on child element: ${child.tagName}.${child.className}`);
            e.stopPropagation();
        });
    });

    const contextualToolbar = element.querySelector('.contextual-toolbar');
    if (contextualToolbar) {
        contextualToolbar.style.zIndex = 3000; // Higher than drag-handle
        contextualToolbar.addEventListener('mouseenter', () => {
            dragHandle.style.pointerEvents = 'none';
            element.style.cursor = 'default';
        });
        contextualToolbar.addEventListener('mouseleave', () => {
            dragHandle.style.pointerEvents = 'auto';
            element.style.cursor = PresentationTools.editMode ? 'move' : 'default';
        });
    }

    element.addEventListener('mousemove', (e) => {
        if (!PresentationTools.editMode) {
            element.style.cursor = 'default';
            return;
        }

        const target = e.target;
        if (target.classList.contains('drag-handle') || target === element) {
            if (!contextualToolbar || !contextualToolbar.matches(':hover')) {
                element.style.cursor = 'move';
            }
        } else if (target.classList.contains('text-content') && target.isContentEditable) {
            element.style.cursor = 'text';
        } else if (target.closest('.contextual-toolbar') || target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
            element.style.cursor = 'pointer';
        } else {
            element.style.cursor = 'default';
        }
    });

    element.addEventListener('mouseleave', () => {
        element.style.cursor = 'default';
    });

    dragHandle.addEventListener('mousedown', (e) => {
        debug.log('Drag handle mousedown event triggered');
        if (e.target.tagName === 'BUTTON' || 
            e.target.tagName === 'INPUT' || 
            e.target.tagName === 'AUDIO' ||
            e.target.classList.contains('contextual-toolbar')) {
            debug.log('Drag prevented due to interactive element click');
            return;
        }

        isDragging = true;
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        element.style.zIndex = 3000;
        e.preventDefault();
        e.stopPropagation();
        debug.log('Dragging started');
    });

    element.addEventListener('mousedown', (e) => {
        if (e.target === dragHandle) return;
        debug.log('Element mousedown event triggered (fallback)');
        if (e.target.tagName === 'BUTTON' || 
            e.target.tagName === 'INPUT' || 
            e.target.tagName === 'AUDIO' ||
            e.target.classList.contains('contextual-toolbar')) {
            debug.log('Drag prevented due to interactive element click (fallback)');
            return;
        }

        isDragging = true;
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        element.style.zIndex = 3000;
        e.preventDefault();
        e.stopPropagation();
        debug.log('Dragging started (fallback)');
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
            debug.log(`Dragging to position: (${currentX}, ${currentY})`);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            element.style.zIndex = 2500;
            debug.log('Dragging stopped');
            e.stopPropagation();
        }
    });

    currentX = element.offsetLeft || 100;
    currentY = element.offsetTop || 100;
    element.style.left = `${currentX}px`;
    element.style.top = `${currentY}px`;
    debug.log(`Element positioned at: (${currentX}, ${currentY})`);
}

// Make elements resizable
function makeResizable(element, contentSelector) {
    debug.log(`Making element resizable: ${element.className || element.id}`);
    const content = element.querySelector(contentSelector);
    if (!content) {
        debug.error(`Content not found for selector: ${contentSelector}`);
        return;
    }

    let isResizing = false;
    let originalWidth, originalHeight, originalX, originalY;
    const resizeThreshold = 10;

    content.style.display = 'inline-block';
    content.style.width = content.style.width || '200px';
    content.style.height = content.style.height || 'auto';
    content.style.minWidth = '50px';
    content.style.minHeight = '20px';

    content.addEventListener('mousemove', (e) => {
        if (!PresentationTools.editMode) {
            content.style.cursor = 'default';
            return;
        }

        const rect = content.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const nearRight = x >= rect.width - resizeThreshold && x <= rect.width;
        const nearBottom = y >= rect.height - resizeThreshold && y <= rect.height;

        if (nearRight && nearBottom) {
            content.style.cursor = 'se-resize';
        } else {
            content.style.cursor = 'default';
        }
    });

    content.addEventListener('mousedown', (e) => {
        if (!PresentationTools.editMode) return;

        const rect = content.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const nearRight = x >= rect.width - resizeThreshold && x <= rect.width;
        const nearBottom = y >= rect.height - resizeThreshold && y <= rect.height;

        if (nearRight && nearBottom) {
            isResizing = true;
            originalWidth = rect.width;
            originalHeight = rect.height;
            originalX = e.clientX;
            originalY = e.clientY;
            e.preventDefault();
            debug.log('Resizing started');
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const newWidth = originalWidth + (e.clientX - originalX);
            const newHeight = originalHeight + (e.clientY - originalY);
            content.style.width = `${Math.max(newWidth, 50)}px`;
            content.style.height = `${Math.max(newHeight, 20)}px`;
            content.style.maxWidth = '90vw';
            content.style.maxHeight = '90vh';
            debug.log(`Resizing to: ${newWidth}x${newHeight}`);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            debug.log('Resizing stopped');
        }
    });
}

// Update visibility of contextual toolbars
function updateElementVisibility() {
    debug.log('Updating element visibility');
    const elements = document.querySelectorAll('.draggable-element');
    elements.forEach(element => {
        const toolbar = element.querySelector('.contextual-toolbar');
        if (toolbar) {
            toolbar.style.display = (PresentationTools.editMode && element.classList.contains('selected')) ? 'flex' : 'none';
            debug.log(`Toolbar visibility for element ${element.className || element.id}: ${toolbar.style.display}`);
        }
    });
}

// Deselect all elements
function deselectAllElements() {
    debug.log('Deselecting all elements');
    const elements = document.querySelectorAll('.draggable-element');
    elements.forEach(element => {
        element.classList.remove('selected');
        const toolbar = element.querySelector('.contextual-toolbar');
        if (toolbar) {
            toolbar.style.display = 'none';
        }
    });
    PresentationTools.updatePropertiesPanel(null);
}

// Presentation Tools Module
const PresentationTools = {
    editMode: false,
    activeTool: null,
    selectedElement: null,
    
    init: function() {
        debug.log('Initializing presentation tools');
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        debug.log('Setting up presentation tools event listeners');
        
        const editToggle = document.getElementById('edit-toggle');
        if (editToggle) {
            editToggle.addEventListener('click', () => {
                this.toggleEditMode();
            });
        } else {
            debug.error('Edit toggle button not found');
        }

        const closeSidebar = document.getElementById('close-sidebar');
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                this.toggleEditMode();
            });
        } else {
            debug.error('Close sidebar button not found');
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.draggable-element') && !e.target.closest('#edit-sidebar') && !e.target.closest('.tool-layer')) {
                deselectAllElements();
            }
        });

        this.setupToolButtons();
    },

    setupToolButtons: function() {
        debug.log('Setting up sidebar tool buttons');

        const textTool = document.getElementById('text-tool');
        if (textTool) {
            textTool.addEventListener('click', () => {
                debug.log('Text tool clicked');
                const textToolbar = document.getElementById('text-editor-toolbar');
                if (textToolbar) {
                    textToolbar.style.display = textToolbar.style.display === 'block' ? 'none' : 'block';
                    textToolbar.innerHTML = `
                        <div class="editor-content" style="background: rgba(0, 0, 0, 0.9); padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 255, 255, 0.2);">
                            <input type="text" id="text-input" placeholder="Enter text to add..." style="width: 70%; padding: 5px; border-radius: 4px; border: 1px solid #00ffff;">
                            <button onclick="PresentationTools.addTextToSlide()" style="padding: 5px 10px; background: #00ffff; color: #000; border: none; border-radius: 4px; margin-left: 5px;">Add Text</button>
                            <button onclick="PresentationTools.closeTextEditor()" style="padding: 5px 10px; background: #ff5555; color: #fff; border: none; border-radius: 4px; margin-left: 5px;">X</button>
                        </div>
                    `;
                    makeDraggable(textToolbar);
                    this.activeTool = 'text';
                } else {
                    debug.error('Text editor toolbar not found');
                }
            });
        } else {
            debug.error('Text tool button not found');
        }

        const backgroundTool = document.getElementById('background-tool');
        if (backgroundTool) {
            backgroundTool.addEventListener('click', () => {
                debug.log('Background tool clicked');
                const backgroundEditor = document.getElementById('background-editor');
                if (backgroundEditor) {
                    backgroundEditor.style.display = backgroundEditor.style.display === 'block' ? 'none' : 'block';
                    backgroundEditor.innerHTML = `
                        <div class="editor-content" style="background: rgba(0, 0, 0, 0.9); padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 255, 255, 0.2);">
                            <input type="color" id="background-color" value="#000000">
                            <button onclick="PresentationTools.changeBackgroundColor()" style="padding: 5px 10px; background: #00ffff; color: #000; border: none; border-radius: 4px; margin-left: 5px;">Apply Background</button>
                            <button onclick="PresentationTools.closeBackgroundEditor()" style="padding: 5px 10px; background: #ff5555; color: #fff; border: none; border-radius: 4px; margin-left: 5px;">X</button>
                        </div>
                    `;
                    makeDraggable(backgroundEditor);
                    this.activeTool = 'background';
                } else {
                    debug.error('Background editor not found');
                }
            });
        } else {
            debug.error('Background tool button not found');
        }

        const imageTool = document.getElementById('image-tool');
        if (imageTool) {
            imageTool.addEventListener('click', () => {
                debug.log('Image tool clicked');
                const imageToolLayer = document.getElementById('image-insert-tool');
                if (imageToolLayer) {
                    imageToolLayer.style.display = imageToolLayer.style.display === 'block' ? 'none' : 'block';
                    imageToolLayer.innerHTML = `
                        <div class="editor-content" style="background: rgba(0, 0, 0, 0.9); padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 255, 255, 0.2);">
                            <input type="file" id="image-upload" accept="image/*" style="padding: 5px;">
                            <button onclick="PresentationTools.addImageToSlide()" style="padding: 5px 10px; background: #00ffff; color: #000; border: none; border-radius: 4px; margin-left: 5px;">Insert Image</button>
                            <button onclick="PresentationTools.closeImageEditor()" style="padding: 5px 10px; background: #ff5555; color: #fff; border: none; border-radius: 4px; margin-left: 5px;">X</button>
                        </div>
                    `;
                    makeDraggable(imageToolLayer);
                    this.activeTool = 'image';
                } else {
                    debug.error('Image insert tool layer not found');
                }
            });
        } else {
            debug.error('Image tool button not found');
        }

        const audioTool = document.getElementById('audio-tool');
        if (audioTool) {
            audioTool.addEventListener('click', () => {
                debug.log('Audio tool clicked');
                const audioToolLayer = document.getElementById('audio-insert-tool');
                if (audioToolLayer) {
                    audioToolLayer.style.display = audioToolLayer.style.display === 'block' ? 'none' : 'block';
                    audioToolLayer.innerHTML = `
                        <div class="editor-content" style="background: rgba(0, 0, 0, 0.9); padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 255, 255, 0.2);">
                            <input type="file" id="audio-upload" accept="audio/*" style="padding: 5px;">
                            <button onclick="PresentationTools.addAudioToSlide()" style="padding: 5px 10px; background: #00ffff; color: #000; border: none; border-radius: 4px; margin-left: 5px;">Insert Audio</button>
                            <button onclick="PresentationTools.closeAudioEditor()" style="padding: 5px 10px; background: #ff5555; color: #fff; border: none; border-radius: 4px; margin-left: 5px;">X</button>
                        </div>
                    `;
                    makeDraggable(audioToolLayer);
                    this.activeTool = 'audio';
                } else {
                    debug.error('Audio insert tool layer not found');
                }
            });
        } else {
            debug.error('Audio tool button not found');
        }

        const whiteboardTool = document.getElementById('whiteboard-tool');
        if (whiteboardTool) {
            whiteboardTool.addEventListener('click', () => {
                debug.log('Whiteboard tool clicked');
                const currentSlide = document.querySelector('.slides .present');
                if (currentSlide) {
                    const whiteboardWrapper = document.createElement('div');
                    whiteboardWrapper.className = 'draggable-element';
                    whiteboardWrapper.style.zIndex = 2500;
                    whiteboardWrapper.style.top = '50px';
                    whiteboardWrapper.style.left = '50px';
                    whiteboardWrapper.innerHTML = `
                        <canvas id="whiteboard-canvas" style="width: 300px; height: 200px; background: rgba(255, 255, 255, 0.8); border-radius: 4px;"></canvas>
                        <div class="contextual-toolbar" style="display: none; position: absolute; top: -40px; left: 0; background: rgba(0, 0, 0, 0.9); padding: 5px; border-radius: 4px; gap: 5px;">
                            <button onclick="this.closest('.draggable-element').remove()" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                        <div id="whiteboard-controls" style="display: inline-block; margin-top: 10px; background: rgba(0, 0, 0, 0.9); padding: 10px; border-radius: 4px;">
                            <label>Color: <input type="color" id="whiteboard-color" value="#000000"></label>
                            <label>Thickness: <input type="range" id="whiteboard-thickness" min="1" max="10" value="2"></label>
                            <button onclick="PresentationTools.closeWhiteboard(this)" style="padding: 5px 10px;">Close</button>
                        </div>
                    `;
                    currentSlide.appendChild(whiteboardWrapper);
                    makeDraggable(whiteboardWrapper);
                    makeResizable(whiteboardWrapper, '#whiteboard-canvas');
                    whiteboardWrapper.addEventListener('click', (e) => {
                        if (this.editMode) {
                            deselectAllElements();
                            whiteboardWrapper.classList.add('selected');
                            this.selectedElement = whiteboardWrapper;
                            updateElementVisibility();
                            e.stopPropagation();
                        }
                    });
                    this.initWhiteboard();
                    this.activeTool = 'whiteboard';
                } else {
                    debug.error('No current slide found to add whiteboard');
                }
            });
        } else {
            debug.error('Whiteboard tool button not found');
        }

        const pollTool = document.getElementById('poll-tool');
        if (pollTool) {
            pollTool.addEventListener('click', () => {
                debug.log('Quick Poll tool clicked');
                const currentSlide = document.querySelector('.slides .present');
                if (currentSlide) {
                    const pollWrapper = document.createElement('div');
                    pollWrapper.className = 'draggable-element';
                    pollWrapper.style.zIndex = 2500;
                    pollWrapper.style.top = '50px';
                    pollWrapper.style.left = '50px';
                    pollWrapper.style.display = 'inline-block';
                    pollWrapper.innerHTML = `
                        <div id="poll-content" style="display: inline-block; padding: 15px; background: rgba(0, 0, 0, 0.9); color: #fff; max-width: 80%; width: 300px; border-radius: 8px;">
                            <input type="text" id="poll-question" placeholder="Enter poll question..." style="width: 70%; padding: 5px; border-radius: 4px; border: 1px solid #00ffff;">
                            <button onclick="PresentationTools.createPoll(this)" style="padding: 5px 10px; background: #00ffff; color: #000; border: none; border-radius: 4px; margin-left: 5px;">Create Poll</button>
                        </div>
                        <div class="contextual-toolbar" style="display: none; position: absolute; top: -40px; left: 0; background: rgba(0, 0, 0, 0.9); padding: 5px; border-radius: 4px; gap: 5px;">
                            <button onclick="this.closest('.draggable-element').remove()" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    currentSlide.appendChild(pollWrapper);
                    makeDraggable(pollWrapper);
                    pollWrapper.addEventListener('click', (e) => {
                        if (this.editMode) {
                            deselectAllElements();
                            pollWrapper.classList.add('selected');
                            this.selectedElement = pollWrapper;
                            updateElementVisibility();
                            e.stopPropagation();
                        }
                    });
                    this.activeTool = 'poll';
                } else {
                    debug.error('No current slide found to add poll');
                }
            });
        } else {
            debug.error('Poll tool button not found');
        }

        const spotlightTool = document.getElementById('spotlight-tool');
        if (spotlightTool) {
            spotlightTool.addEventListener('click', () => {
                debug.log('Spotlight tool clicked');
                const currentSlide = document.querySelector('.slides .present');
                if (currentSlide) {
                    const spotlightWrapper = document.createElement('div');
                    spotlightWrapper.className = 'draggable-element';
                    spotlightWrapper.id = 'spotlight-effect';
                    spotlightWrapper.style.zIndex = 2500;
                    spotlightWrapper.style.top = '50px';
                    spotlightWrapper.style.left = '50px';
                    spotlightWrapper.innerHTML = `
                        <div class="spotlight-content" style="width: 200px; height: 200px; background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 10%, transparent 70%); box-shadow: none;"></div>
                        <div class="contextual-toolbar" style="display: none; position: absolute; top: -40px; left: 0; background: rgba(0, 0, 0, 0.9); padding: 5px; border-radius: 4px; gap: 5px;">
                            <button onclick="this.closest('.draggable-element').remove()" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    currentSlide.appendChild(spotlightWrapper);
                    makeDraggable(spotlightWrapper);
                    spotlightWrapper.addEventListener('click', (e) => {
                        if (this.editMode) {
                            deselectAllElements();
                            spotlightWrapper.classList.add('selected');
                            this.selectedElement = spotlightWrapper;
                            updateElementVisibility();
                            this.updatePropertiesPanel('spotlight');
                            e.stopPropagation();
                        }
                    });
                    this.activeTool = 'spotlight';
                } else {
                    debug.error('No current slide found to add spotlight');
                }
            });
        } else {
            debug.error('Spotlight tool button not found');
        }

        const timerTool = document.getElementById('timer-tool');
        if (timerTool) {
            timerTool.addEventListener('click', () => {
                debug.log('Timer tool clicked');
                const timerDisplay = document.getElementById('timer-display');
                if (timerDisplay) {
                    timerDisplay.style.display = timerDisplay.style.display === 'block' ? 'none' : 'block';
                    timerDisplay.innerHTML = `
                        <div id="timer-wrapper" class="draggable-element" style="display: inline-block; padding: 10px; background: rgba(0, 0, 0, 0.9); color: #fff; z-index: 2500; border-radius: 8px; top: 50px; right: 320px;">
                            <div id="timer" style="font-size: 20px; margin-bottom: 10px;">00:00</div>
                            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                <input type="number" id="timer-minutes" placeholder="Minutes" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 80px;" min="0">
                                <input type="number" id="timer-seconds" placeholder="Seconds" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 80px;" min="0">
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="PresentationTools.startTimer()" style="padding: 5px 10px; background: #00ffff; color: #000; border: none; border-radius: 4px;">Start Timer</button>
                                <button onclick="PresentationTools.closeTimer()" style="padding: 5px 10px; background: #ff5555; color: #fff; border: none; border-radius: 4px;">Close Timer</button>
                            </div>
                            <div class="contextual-toolbar" style="display: none; position: absolute; top: -40px; left: 0; background: rgba(0, 0, 0, 0.9); padding: 5px; border-radius: 4px; gap: 5px;">
                                <button onclick="this.closest('.draggable-element').remove()" title="Delete"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                    const timerWrapper = document.getElementById('timer-wrapper');
                    makeDraggable(timerWrapper);
                    timerWrapper.addEventListener('click', (e) => {
                        if (this.editMode) {
                            deselectAllElements();
                            timerWrapper.classList.add('selected');
                            this.selectedElement = timerWrapper;
                            updateElementVisibility();
                            e.stopPropagation();
                        }
                    });
                    this.activeTool = 'timer';
                } else {
                    debug.error('Timer display not found');
                }
            });
        } else {
            debug.error('Timer tool button not found');
        }
    },

    updatePropertiesPanel: function(type) {
        const toolsDiv = document.getElementById('tools');
        if (!toolsDiv) return;

        if (!type) {
            toolsDiv.innerHTML = `
                <div class="tool-section">
                    <h4>Content Tools</h4>
                    <button id="text-tool"><i class="fas fa-font"></i> Text</button>
                    <button id="background-tool"><i class="fas fa-image"></i> Background</button>
                    <button id="image-tool"><i class="fas fa-photo-film"></i> Image</button>
                    <button id="audio-tool"><i class="fas fa-music"></i> Audio</button>
                </div>
                <div class="tool-section">
                    <h4>Interactive Tools</h4>
                    <button id="whiteboard-tool"><i class="fas fa-pen-ruler"></i> Whiteboard</button>
                    <button id="poll-tool"><i class="fas fa-poll"></i> Quick Poll</button>
                    <button id="spotlight-tool"><i class="fas fa-lightbulb"></i> Spotlight</button>
                    <button id="timer-tool"><i class="fas fa-clock"></i> Timer</button>
                </div>
            `;
            this.setupToolButtons();
            return;
        }

        if (type === 'text') {
            const content = this.selectedElement.querySelector('.text-content');
            toolsDiv.innerHTML = `
                <div class="tool-section" style="padding: 10px;">
                    <h4 style="margin-bottom: 10px;">Text Properties</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center;">
                        <label style="color: #fff;">Font Size:</label>
                        <input type="number" id="prop-font-size" value="${parseInt(content.style.fontSize) || 16}" min="8" max="72" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">Color:</label>
                        <input type="color" id="prop-color" value="${content.style.color || '#ffffff'}" style="width: 100%; height: 30px; border: none;">
                        
                        <label style="color: #fff;">Alignment:</label>
                        <select id="prop-align" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                            <option value="left" ${content.style.textAlign === 'left' ? 'selected' : ''}>Left</option>
                            <option value="center" ${content.style.textAlign === 'center' ? 'selected' : ''}>Center</option>
                            <option value="right" ${content.style.textAlign === 'right' ? 'selected' : ''}>Right</option>
                        </select>
                        
                        <label style="color: #fff;">Background Color:</label>
                        <input type="color" id="prop-bg-color" value="${content.style.backgroundColor || '#000000'}" style="width: 100%; height: 30px; border: none;">
                        
                        <label style="color: #fff;">Font Family:</label>
                        <select id="prop-font-family" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                            <option value="Arial" ${content.style.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option value="Times New Roman" ${content.style.fontFamily === '"Times New Roman"' ? 'selected' : ''}>Times New Roman</option>
                            <option value="Courier New" ${content.style.fontFamily === '"Courier New"' ? 'selected' : ''}>Courier New</option>
                            <option value="Georgia" ${content.style.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                        </select>
                        
                        <label style="color: #fff;">Line Height:</label>
                        <input type="number" id="prop-line-height" value="${parseFloat(content.style.lineHeight) || 1.5}" min="0.5" max="3" step="0.1" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">Bold:</label>
                        <input type="checkbox" id="prop-bold" ${content.style.fontWeight === 'bold' ? 'checked' : ''} style="width: 20px; height: 20px;">
                        
                        <label style="color: #fff;">Italic:</label>
                        <input type="checkbox" id="prop-italic" ${content.style.fontStyle === 'italic' ? 'checked' : ''} style="width: 20px; height: 20px;">
                        
                        <label style="color: #fff;">Underline:</label>
                        <input type="checkbox" id="prop-underline" ${content.style.textDecoration.includes('underline') ? 'checked' : ''} style="width: 20px; height: 20px;">
                    </div>
                </div>
            `;
            document.getElementById('prop-font-size').addEventListener('input', (e) => {
                content.style.fontSize = `${e.target.value}px`;
            });
            document.getElementById('prop-color').addEventListener('input', (e) => {
                content.style.color = e.target.value;
            });
            document.getElementById('prop-align').addEventListener('change', (e) => {
                content.style.textAlign = e.target.value;
            });
            document.getElementById('prop-bg-color').addEventListener('input', (e) => {
                content.style.backgroundColor = e.target.value;
            });
            document.getElementById('prop-font-family').addEventListener('change', (e) => {
                content.style.fontFamily = e.target.value;
            });
            document.getElementById('prop-line-height').addEventListener('input', (e) => {
                content.style.lineHeight = e.target.value;
            });
            document.getElementById('prop-bold').addEventListener('change', (e) => {
                content.style.fontWeight = e.target.checked ? 'bold' : 'normal';
            });
            document.getElementById('prop-italic').addEventListener('change', (e) => {
                content.style.fontStyle = e.target.checked ? 'italic' : 'normal';
            });
            document.getElementById('prop-underline').addEventListener('change', (e) => {
                content.style.textDecoration = e.target.checked ? 'underline' : 'none';
            });
        } else if (type === 'image') {
            const content = this.selectedElement.querySelector('.image-content');
            toolsDiv.innerHTML = `
                <div class="tool-section" style="padding: 10px;">
                    <h4 style="margin-bottom: 10px;">Image Properties</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center;">
                        <label style="color: #fff;">Opacity:</label>
                        <input type="range" id="prop-opacity" min="0" max="1" step="0.1" value="${content.style.opacity || 1}" style="width: 100%;">
                        
                        <label style="color: #fff;">Rotation:</label>
                        <input type="number" id="prop-rotation" value="${content.dataset.rotation || 0}" min="0" max="360" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">Scale:</label>
                        <input type="range" id="prop-scale" min="0.1" max="3" step="0.1" value="${content.dataset.scale || 1}" style="width: 100%;">
                        
                        <label style="color: #fff;">Border Radius:</label>
                        <input type="number" id="prop-border-radius" value="${parseInt(content.style.borderRadius) || 0}" min="0" max="50" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">Brightness:</label>
                        <input type="range" id="prop-brightness" min="0" max="2" step="0.1" value="${content.dataset.brightness || 1}" style="width: 100%;">
                        
                        <label style="color: #fff;">Contrast:</label>
                        <input type="range" id="prop-contrast" min="0" max="2" step="0.1" value="${content.dataset.contrast || 1}" style="width: 100%;">
                        
                        <label style="color: #fff;">Flip Horizontal:</label>
                        <input type="checkbox" id="prop-flip-horizontal" ${content.dataset.flipHorizontal === 'true' ? 'checked' : ''} style="width: 20px; height: 20px;">
                        
                        <label style="color: #fff;">Flip Vertical:</label>
                        <input type="checkbox" id="prop-flip-vertical" ${content.dataset.flipVertical === 'true' ? 'checked' : ''} style="width: 20px; height: 20px;">
                    </div>
                </div>
            `;
            document.getElementById('prop-opacity').addEventListener('input', (e) => {
                content.style.opacity = e.target.value;
            });
            document.getElementById('prop-rotation').addEventListener('input', (e) => {
                content.style.transform = `rotate(${e.target.value}deg) scale(${content.dataset.scale || 1}) scaleX(${content.dataset.flipHorizontal === 'true' ? -1 : 1}) scaleY(${content.dataset.flipVertical === 'true' ? -1 : 1})`;
                content.dataset.rotation = e.target.value;
            });
            document.getElementById('prop-scale').addEventListener('input', (e) => {
                content.style.transform = `rotate(${content.dataset.rotation || 0}deg) scale(${e.target.value}) scaleX(${content.dataset.flipHorizontal === 'true' ? -1 : 1}) scaleY(${content.dataset.flipVertical === 'true' ? -1 : 1})`;
                content.dataset.scale = e.target.value;
            });
            document.getElementById('prop-border-radius').addEventListener('input', (e) => {
                content.style.borderRadius = `${e.target.value}px`;
            });
            document.getElementById('prop-brightness').addEventListener('input', (e) => {
                content.style.filter = `brightness(${e.target.value}) contrast(${content.dataset.contrast || 1})`;
                content.dataset.brightness = e.target.value;
            });
            document.getElementById('prop-contrast').addEventListener('input', (e) => {
                content.style.filter = `brightness(${content.dataset.brightness || 1}) contrast(${e.target.value})`;
                content.dataset.contrast = e.target.value;
            });
            document.getElementById('prop-flip-horizontal').addEventListener('change', (e) => {
                content.dataset.flipHorizontal = e.target.checked;
                content.style.transform = `rotate(${content.dataset.rotation || 0}deg) scale(${content.dataset.scale || 1}) scaleX(${e.target.checked ? -1 : 1}) scaleY(${content.dataset.flipVertical === 'true' ? -1 : 1})`;
            });
            document.getElementById('prop-flip-vertical').addEventListener('change', (e) => {
                content.dataset.flipVertical = e.target.checked;
                content.style.transform = `rotate(${content.dataset.rotation || 0}deg) scale(${content.dataset.scale || 1}) scaleX(${content.dataset.flipHorizontal === 'true' ? -1 : 1}) scaleY(${e.target.checked ? -1 : 1})`;
            });
        } else if (type === 'audio') {
            const content = this.selectedElement.querySelector('.audio-content');
            toolsDiv.innerHTML = `
                <div class="tool-section" style="padding: 10px;">
                    <h4 style="margin-bottom: 10px;">Audio Properties</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center;">
                        <label style="color: #fff;">Volume:</label>
                        <input type="range" id="prop-volume" min="0" max="1" step="0.1" value="${content.volume}" style="width: 100%;">
                        
                        <label style="color: #fff;">Loop:</label>
                        <input type="checkbox" id="prop-loop" ${content.loop ? 'checked' : ''} style="width: 20px; height: 20px;">
                        
                        <label style="color: #fff;">Autoplay:</label>
                        <input type="checkbox" id="prop-autoplay" ${content.autoplay ? 'checked' : ''} style="width: 20px; height: 20px;">
                        
                        <label style="color: #fff;">Playback Speed:</label>
                        <select id="prop-playback-speed" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                            <option value="0.5" ${content.playbackRate === 0.5 ? 'selected' : ''}>0.5x</option>
                            <option value="1" ${content.playbackRate === 1 ? 'selected' : ''}>1x</option>
                            <option value="1.5" ${content.playbackRate === 1.5 ? 'selected' : ''}>1.5x</option>
                            <option value="2" ${content.playbackRate === 2 ? 'selected' : ''}>2x</option>
                        </select>
                        
                        <label style="color: #fff;">Start Time (s):</label>
                        <input type="number" id="prop-start-time" value="${content.dataset.startTime || 0}" min="0" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">End Time (s):</label>
                        <input type="number" id="prop-end-time" value="${content.dataset.endTime || content.duration || ''}" min="0" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">Fade In (s):</label>
                        <input type="number" id="prop-fade-in" value="${content.dataset.fadeIn || 0}" min="0" max="10" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">Fade Out (s):</label>
                        <input type="number" id="prop-fade-out" value="${content.dataset.fadeOut || 0}" min="0" max="10" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                    </div>
                </div>
            `;
            document.getElementById('prop-volume').addEventListener('input', (e) => {
                content.volume = e.target.value;
            });
            document.getElementById('prop-loop').addEventListener('change', (e) => {
                content.loop = e.target.checked;
            });
            document.getElementById('prop-autoplay').addEventListener('change', (e) => {
                content.autoplay = e.target.checked;
                if (e.target.checked) content.play();
            });
            document.getElementById('prop-playback-speed').addEventListener('change', (e) => {
                content.playbackRate = parseFloat(e.target.value);
            });
            document.getElementById('prop-start-time').addEventListener('input', (e) => {
                content.currentTime = e.target.value;
                content.dataset.startTime = e.target.value;
            });
            document.getElementById('prop-end-time').addEventListener('input', (e) => {
                content.dataset.endTime = e.target.value;
                content.addEventListener('timeupdate', () => {
                    if (content.currentTime >= parseFloat(content.dataset.endTime)) {
                        content.pause();
                        content.currentTime = content.dataset.startTime || 0;
                    }
                });
            });
            document.getElementById('prop-fade-in').addEventListener('input', (e) => {
                content.dataset.fadeIn = e.target.value;
                debug.log(`Set fade-in to ${e.target.value} seconds (not fully implemented)`);
            });
            document.getElementById('prop-fade-out').addEventListener('input', (e) => {
                content.dataset.fadeOut = e.target.value;
                debug.log(`Set fade-out to ${e.target.value} seconds (not fully implemented)`);
            });
        } else if (type === 'spotlight') {
            const content = this.selectedElement.querySelector('.spotlight-content');
            toolsDiv.innerHTML = `
                <div class="tool-section" style="padding: 10px;">
                    <h4 style="margin-bottom: 10px;">Spotlight Properties</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center;">
                        <label style="color: #fff;">Intensity:</label>
                        <input type="range" id="prop-intensity" min="0" max="1" step="0.1" value="0.8" style="width: 100%;">
                        
                        <label style="color: #fff;">Size:</label>
                        <input type="number" id="prop-size" value="${parseInt(content.style.width) || 200}" min="50" max="500" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">Color:</label>
                        <input type="color" id="prop-spotlight-color" value="#ffffff" style="width: 100%; height: 30px; border: none;">
                        
                        <label style="color: #fff;">Shape:</label>
                        <select id="prop-shape" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                            <option value="circle" ${content.dataset.shape === 'circle' || !content.dataset.shape ? 'selected' : ''}>Circle</option>
                            <option value="square" ${content.dataset.shape === 'square' ? 'selected' : ''}>Square</option>
                        </select>
                        
                        <label style="color: #fff;">Blur:</label>
                        <input type="number" id="prop-blur" value="${content.dataset.blur || 0}" min="0" max="20" style="padding: 5px; border-radius: 4px; border: 1px solid #00ffff; width: 100%;">
                        
                        <label style="color: #fff;">Opacity:</label>
                        <input type="range" id="prop-opacity" min="0" max="1" step="0.1" value="${content.style.opacity || 1}" style="width: 100%;">
                        
                        <label style="color: #fff;">Scale:</label>
                        <input type="range" id="prop-scale" min="0.1" max="3" step="0.1" value="${content.dataset.scale || 1}" style="width: 100%;">
                    </div>
                </div>
            `;
            document.getElementById('prop-intensity').addEventListener('input', (e) => {
                this.adjustSpotlightIntensity(e.target);
            });
            document.getElementById('prop-size').addEventListener('input', (e) => {
                content.style.width = `${e.target.value}px`;
                content.style.height = `${e.target.value}px`;
            });
            document.getElementById('prop-spotlight-color').addEventListener('input', (e) => {
                const intensity = document.getElementById('prop-intensity')?.value || 0.8;
                content.style.background = `radial-gradient(${content.dataset.shape || 'circle'}, ${e.target.value}${Math.round(intensity * 255).toString(16).padStart(2, '0')} 10%, transparent 70%)`;
            });
            document.getElementById('prop-shape').addEventListener('change', (e) => {
                content.dataset.shape = e.target.value;
                const intensity = document.getElementById('prop-intensity')?.value || 0.8;
                const color = document.getElementById('prop-spotlight-color')?.value || '#ffffff';
                content.style.background = `radial-gradient(${e.target.value}, ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')} 10%, transparent 70%)`;
            });
            document.getElementById('prop-blur').addEventListener('input', (e) => {
                content.style.filter = `blur(${e.target.value}px)`;
                content.dataset.blur = e.target.value;
            });
            document.getElementById('prop-opacity').addEventListener('input', (e) => {
                content.style.opacity = e.target.value;
            });
            document.getElementById('prop-scale').addEventListener('input', (e) => {
                content.style.transform = `scale(${e.target.value})`;
                content.dataset.scale = e.target.value;
            });
        }
    },

    addTextToSlide: function() {
        debug.log('Adding text to slide');
        const textInput = document.getElementById('text-input');
        if (textInput) {
            const text = textInput.value || 'Enter text here';
            const currentSlide = document.querySelector('.slides .present');
            if (currentSlide) {
                const textWrapper = document.createElement('div');
                textWrapper.className = 'draggable-element';
                textWrapper.style.zIndex = 2500;
                textWrapper.innerHTML = `
                    <div class="text-content" contenteditable="true" style="display: inline-block; color: #fff; font-size: 16px; padding: 5px;">${text}</div>
                    <div class="contextual-toolbar" style="display: none; position: absolute; top: -40px; left: 0; background: rgba(0, 0, 0, 0.9); padding: 5px; border-radius: 4px; gap: 5px;">
                        <button onclick="this.closest('.draggable-element').remove()" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                currentSlide.appendChild(textWrapper);
                makeDraggable(textWrapper);
                makeResizable(textWrapper, '.text-content');
                textWrapper.addEventListener('click', (e) => {
                    if (this.editMode) {
                        deselectAllElements();
                        textWrapper.classList.add('selected');
                        this.selectedElement = textWrapper;
                        updateElementVisibility();
                        this.updatePropertiesPanel('text');
                        e.stopPropagation();
                    }
                });
                debug.log(`Added text to slide: ${text}`);

                HistoryManager.addAction({
                    type: 'addText',
                    undo: () => {
                        textWrapper.remove();
                        debug.log(`Undid text addition: ${text}`);
                    }
                });
            } else {
                debug.error('No current slide found to add text');
            }
        } else {
            debug.error('Text input field not found');
        }
    },

    closeTextEditor: function() {
        const textToolbar = document.getElementById('text-editor-toolbar');
        if (textToolbar) {
            textToolbar.style.display = 'none';
            this.activeTool = null;
            debug.log('Text editor closed');
        }
    },

    changeBackgroundColor: function() {
        debug.log('Changing background color');
        const backgroundColor = document.getElementById('background-color');
        if (backgroundColor) {
            const color = backgroundColor.value;
            const currentSlide = document.querySelector('.slides .present');
            if (currentSlide) {
                const previousColor = currentSlide.style.backgroundColor;
                currentSlide.style.backgroundColor = color;
                debug.log(`Changed background color to: ${color}`);

                HistoryManager.addAction({
                    type: 'changeBackground',
                    undo: () => {
                        currentSlide.style.backgroundColor = previousColor;
                        debug.log(`Undid background color change to: ${previousColor}`);
                    }
                });
            } else {
                debug.error('No current slide found to change background');
            }
        } else {
            debug.error('Background color input not found');
        }
    },

    closeBackgroundEditor: function() {
        const backgroundEditor = document.getElementById('background-editor');
        if (backgroundEditor) {
            backgroundEditor.style.display = 'none';
            this.activeTool = null;
            debug.log('Background editor closed');
        }
    },

    addImageToSlide: function() {
        debug.log('Adding image to slide');
        const imageUpload = document.getElementById('image-upload');
        if (imageUpload && imageUpload.files[0]) {
            const imageFile = imageUpload.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const currentSlide = document.querySelector('.slides .present');
                if (currentSlide) {
                    const imageWrapper = document.createElement('div');
                    imageWrapper.className = 'draggable-element';
                    imageWrapper.style.zIndex = 2500;
                    imageWrapper.innerHTML = `
                        <img class="image-content" src="${e.target.result}" style="width: 300px; height: auto;">
                        <div class="contextual-toolbar" style="display: none; position: absolute; top: -40px; left: 0; background: rgba(0, 0, 0, 0.9); padding: 5px; border-radius: 4px; gap: 5px;">
                            <button onclick="this.closest('.draggable-element').remove()" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    currentSlide.appendChild(imageWrapper);
                    makeDraggable(imageWrapper);
                    makeResizable(imageWrapper, '.image-content');
                    imageWrapper.addEventListener('click', (e) => {
                        if (this.editMode) {
                            deselectAllElements();
                            imageWrapper.classList.add('selected');
                            this.selectedElement = imageWrapper;
                            updateElementVisibility();
                            this.updatePropertiesPanel('image');
                            e.stopPropagation();
                        }
                    });
                    debug.log('Added image to slide');

                    HistoryManager.addAction({
                        type: 'addImage',
                        undo: () => {
                            imageWrapper.remove();
                            debug.log('Undid image addition');
                        }
                    });
                } else {
                    debug.error('No current slide found to add image');
                }
            };
            reader.readAsDataURL(imageFile);
        } else {
            debug.error('No image file selected or image upload input not found');
        }
    },

    closeImageEditor: function() {
        const imageToolLayer = document.getElementById('image-insert-tool');
        if (imageToolLayer) {
            imageToolLayer.style.display = 'none';
            this.activeTool = null;
            debug.log('Image editor closed');
        }
    },

    addAudioToSlide: function() {
        debug.log('Adding audio to slide');
        const audioUpload = document.getElementById('audio-upload');
        if (audioUpload && audioUpload.files[0]) {
            const audioFile = audioUpload.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const currentSlide = document.querySelector('.slides .present');
                if (currentSlide) {
                    const audioWrapper = document.createElement('div');
                    audioWrapper.className = 'draggable-element audio-wrapper';
                    audioWrapper.style.zIndex = 2500;
                    audioWrapper.innerHTML = `
                        <audio class="audio-content" controls src="${e.target.result}" style="display: block;"></audio>
                        <div class="contextual-toolbar" style="display: none; position: absolute; top: -40px; left: 0; background: rgba(0, 0, 0, 0.9); padding: 5px; border-radius: 4px; gap: 5px;">
                            <button onclick="this.closest('.draggable-element').remove()" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    currentSlide.appendChild(audioWrapper);
                    makeDraggable(audioWrapper);
                    audioWrapper.addEventListener('click', (e) => {
                        if (this.editMode) {
                            deselectAllElements();
                            audioWrapper.classList.add('selected');
                            this.selectedElement = audioWrapper;
                            updateElementVisibility();
                            this.updatePropertiesPanel('audio');
                            e.stopPropagation();
                        }
                    });
                    debug.log('Added audio to slide');

                    HistoryManager.addAction({
                        type: 'addAudio',
                        undo: () => {
                            audioWrapper.remove();
                            debug.log('Undid audio addition');
                        }
                    });
                } else {
                    debug.error('No current slide found to add audio');
                }
            };
            reader.readAsDataURL(audioFile);
        } else {
            debug.error('No audio file selected or audio upload input not found');
        }
    },

    closeAudioEditor: function() {
        const audioToolLayer = document.getElementById('audio-insert-tool');
        if (audioToolLayer) {
            audioToolLayer.style.display = 'none';
            this.activeTool = null;
            debug.log('Audio editor closed');
        }
    },

    initWhiteboard: function() {
        debug.log('Initializing whiteboard');
        const canvas = document.getElementById('whiteboard-canvas');
        const ctx = canvas.getContext('2d');
        let drawing = false;

        if (canvas) {
            canvas.width = 300;
            canvas.height = 200;

            const updateLineStyle = () => {
                const colorInput = document.getElementById('whiteboard-color');
                const thicknessInput = document.getElementById('whiteboard-thickness');
                if (colorInput && thicknessInput) {
                    ctx.strokeStyle = colorInput.value;
                    ctx.lineWidth = thicknessInput.value;
                }
            };

            updateLineStyle();

            document.getElementById('whiteboard-color')?.addEventListener('change', updateLineStyle);
            document.getElementById('whiteboard-thickness')?.addEventListener('input', updateLineStyle);

            canvas.addEventListener('mousedown', (e) => {
                drawing = true;
                const rect = canvas.getBoundingClientRect();
                ctx.beginPath();
                ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
            });
            canvas.addEventListener('mouseup', () => drawing = false);
            canvas.addEventListener('mousemove', (e) => {
                if (drawing) {
                    const rect = canvas.getBoundingClientRect();
                    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                }
            });

            debug.log('Whiteboard initialized');
        } else {
            debug.error('Whiteboard canvas not found');
        }
    },

    closeWhiteboard: function(button) {
        const whiteboardWrapper = button.closest('.draggable-element');
        if (whiteboardWrapper) {
            whiteboardWrapper.remove();
            this.activeTool = null;
            debug.log('Whiteboard closed');
        }
    },

    createPoll: function(button) {
        debug.log('Creating poll');
        const pollQuestion = document.getElementById('poll-question');
        if (pollQuestion) {
            const question = pollQuestion.value;
            if (question) {
                const pollContent = document.getElementById('poll-content');
                if (pollContent) {
                    pollContent.innerHTML = `
                        <div style="padding: 10px;">
                            Poll: ${question}<br>
                            <button onclick="PresentationTools.votePoll('Yes')" style="padding: 5px 10px; margin: 5px;">Yes</button>
                            <button onclick="PresentationTools.votePoll('No')" style="padding: 5px 10px; margin: 5px;">No</button>
                            <button onclick="PresentationTools.closePoll(this)" style="padding: 5px 10px; margin: 5px;">Close Poll</button>
                        </div>
                    `;
                    debug.log(`Created poll: ${question}`);
                } else {
                    debug.error('Poll content not found');
                }
            } else {
                debug.log('No poll question provided');
            }
        } else {
            debug.error('Poll question input not found');
        }
    },

    votePoll: function(vote) {
        debug.log(`Poll vote: ${vote}`);
        alert(`You voted: ${vote}`);
    },

    closePoll: function(button) {
        const pollWrapper = button.closest('.draggable-element');
        if (pollWrapper) {
            pollWrapper.remove();
            this.activeTool = null;
            debug.log('Poll closed');
        }
    },

    adjustSpotlightIntensity: function(inputElement) {
        const intensity = inputElement 
            ? inputElement.value 
            : (document.getElementById('spotlight-intensity')?.value || document.getElementById('prop-intensity')?.value || 0.8);
        const spotlightEffect = inputElement 
            ? inputElement.closest('.draggable-element').querySelector('.spotlight-content')
            : document.querySelector('#spotlight-effect .spotlight-content');
        if (spotlightEffect) {
            const colorInput = document.getElementById('prop-spotlight-color');
            const color = colorInput ? colorInput.value : '#ffffff';
            spotlightEffect.style.background = `radial-gradient(${spotlightEffect.dataset.shape || 'circle'}, ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')} 10%, transparent 70%)`;
            spotlightEffect.style.boxShadow = `none`;
            debug.log(`Adjusted spotlight intensity to: ${intensity}`);
        }
    },

    closeSpotlight: function(button) {
        const spotlightWrapper = button.closest('.draggable-element');
        if (spotlightWrapper) {
            spotlightWrapper.remove();
            this.activeTool = null;
            debug.log('Spotlight closed');
        }
    },

    startTimer: function() {
        debug.log('Starting timer');
        const timerMinutesInput = document.getElementById('timer-minutes');
        const timerSecondsInput = document.getElementById('timer-seconds');
        let minutes = parseInt(timerMinutesInput?.value) || 0;
        let seconds = parseInt(timerSecondsInput?.value) || 0;
        let totalSeconds = (minutes * 60) + seconds;
        if (totalSeconds <= 0) totalSeconds = 60;

        const timerElement = document.getElementById('timer');
        if (timerElement) {
            let timeLeft = totalSeconds;
            const interval = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    timerElement.textContent = '00:00';
                    const ringSound = new Audio('https://www.soundjay.com/school/school-bell-01a.mp3');
                    ringSound.play().catch(error => {
                        debug.error('Failed to play school bell sound, falling back to beep', error);
                        const beepSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
                        beepSound.play().catch(err => {
                            debug.error('Failed to play fallback beep sound', err);
                        });
                    });
                    debug.log('Timer finished, school bell played');
                    return;
                }
                const minutesLeft = Math.floor(timeLeft / 60);
                const secondsLeft = timeLeft % 60;
                timerElement.textContent = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
                timeLeft--;
            }, 1000);
            debug.log(`Timer started for ${totalSeconds} seconds`);
            timerElement.dataset.interval = interval;
        } else {
            debug.error('Timer element not found');
        }
    },

    closeTimer: function() {
        const timerDisplay = document.getElementById('timer-display');
        const timerElement = document.getElementById('timer');
        if (timerDisplay && timerElement) {
            const interval = timerElement.dataset.interval;
            if (interval) clearInterval(interval);
            timerDisplay.style.display = 'none';
            this.activeTool = null;
            debug.log('Timer closed');
        }
    },

    toggleEditMode: function() {
        this.editMode = !this.editMode;
        const toggleButton = document.getElementById('edit-toggle');
        const sidebar = document.getElementById('edit-sidebar');

        if (this.editMode) {
            toggleButton.textContent = 'Disable Edit Mode';
            sidebar.classList.add('open');
            sidebar.classList.remove('collapsed');
            debug.log('Edit mode enabled');
        } else {
            toggleButton.textContent = 'Enable Edit Mode';
            sidebar.classList.remove('open');
            sidebar.classList.add('collapsed');
            debug.log('Edit mode disabled');
            document.querySelectorAll('.tool-layer:not(#timer-display)').forEach(layer => {
                layer.style.display = 'none';
            });
            this.activeTool = null;
            deselectAllElements();
        }
        updateElementVisibility();
    }
};