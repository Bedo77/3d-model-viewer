/**
 * lessonPlan.js
 * Last Updated: 2025-05-05 00:02:28 UTC
 * Author: Bedo77
 * Description: Handles lesson plan management functionality including creation, editing,
 * and display of lesson plans with 3D model support.
 */

// Global Variables
let lessons = [];
let selectedLesson = null;
let isCreatingNewLesson = true;
let currentlyEditingLessonName = null;
let tempImageData = [];
let tempModelData = [];
let tempIconData = null;
let tempStandards = [];
let availableModels = [];
let lessonsModified = false;
let isDeleteMode = false;

// DOM Elements for Delete Mode
const lessonCheckboxes = document.getElementById('lessonCheckboxes');
const lessonCheckboxList = document.getElementById('lessonCheckboxList');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');

// DOM Elements (unchanged)
const lessonModal = document.getElementById('lessonModal');
const modalTitle = document.getElementById('modalTitle');
const lessonNameInput = document.getElementById('lessonNameInput');
const teacherNameInput = document.getElementById('teacherNameInput');
const learningObjectivesInput = document.getElementById('learningObjectivesInput');
const standardsAlignmentInput = document.getElementById('standardsAlignmentInput');
const customStandardInput = document.getElementById('customStandardInput');
const engageInput = document.getElementById('engageInput');
const exploreInput = document.getElementById('exploreInput');
const explainInput = document.getElementById('explainInput');
const elaborateInput = document.getElementById('elaborateInput');
const evaluateInput = document.getElementById('evaluateInput');
const materialsNeededInput = document.getElementById('materialsNeededInput');
const keyVocabularyInput = document.getElementById('keyVocabularyInput');
const supplementaryLinksInput = document.getElementById('supplementaryLinksInput');
const teacherNotesInput = document.getElementById('teacherNotesInput');
const selectedStandardsDisplayModal = document.getElementById('selectedStandardsDisplayModal');
const modalResourcePreview = document.getElementById('modalResourcePreview');
const modalModelPreview = document.getElementById('modalModelPreview');
const modalLessonIconPreview = document.getElementById('modalLessonIconPreview');
const lessonSelect = document.getElementById('lessonSelect');
const lessonDisplayArea = document.getElementById('lessonDisplayArea');
const lessonTabContent = document.getElementById('lessonTabContent');
const lessonTitleDisplay = document.getElementById('lessonTitleDisplay');
const teacherNameDisplay = document.getElementById('teacherNameDisplay');
const lastUpdated = document.getElementById('lastUpdated');
const learningObjectivesList = document.getElementById('learningObjectivesList');
const standardsAlignmentDisplay = document.getElementById('standardsAlignmentDisplay');
const engageContent = document.getElementById('engageContent');
const exploreContent = document.getElementById('exploreContent');
const explainContent = document.getElementById('explainContent');
const elaborateContent = document.getElementById('elaborateContent');
const evaluateContent = document.getElementById('evaluateContent');
const materialsNeededList = document.getElementById('materialsNeededList');
const keyVocabularyTags = document.getElementById('keyVocabularyTags');
const supplementaryLinksList = document.getElementById('supplementaryLinksList');
const teacherNotesContent = document.getElementById('teacherNotesContent');
const resourcePreview = document.getElementById('resourcePreview');
const lessonIconPreview = document.getElementById('lessonIconPreview');
const modelPreview = document.getElementById('modelPreview');
const editLessonButton = document.getElementById('editLessonButton');
const printButton = document.getElementById('printButton');
const exportButton = document.getElementById('exportButton');
const removeLessonButton = document.getElementById('removeLessonButton');
const imageUploadInput = document.getElementById('imageUploadInput');
const modelUploadInput = document.getElementById('modelUploadInput');
const lessonIconUploadInput = document.getElementById('lessonIconUploadInput');
const bulkModelUploadInput = document.getElementById('bulkModelUploadInput');
const bulkLessonsUploadInput = document.getElementById('bulkLessonsUploadInput');
const downloadTemplateButton = document.getElementById('downloadTemplateButton');
const subjectInput = document.getElementById('subjectInput');
const subjectDisplay = document.getElementById('subjectDisplay');
const backToTopButton = document.getElementById('backToTopButton');

// Loading Bar Elements
const modelLoadingBarContainer = document.getElementById('model-loading-bar-container');
const modelLoadingBar = modelLoadingBarContainer.querySelector('.loading-bar');
const modelLoadingText = modelLoadingBarContainer.querySelector('.loading-text');

const bulkModelLoadingBarContainer = document.getElementById('bulk-model-loading-bar-container');
const bulkModelLoadingBar = bulkModelLoadingBarContainer.querySelector('.loading-bar');
const bulkModelLoadingText = bulkModelLoadingBarContainer.querySelector('.loading-text');

const bulkLessonLoadingBarContainer = document.getElementById('bulk-lesson-loading-bar-container');
const bulkLessonLoadingBar = bulkLessonLoadingBarContainer.querySelector('.loading-bar');
const bulkLessonLoadingText = bulkLessonLoadingBarContainer.querySelector('.loading-text');

// Grade One Content
const gradeOneContent = {
    lessons: []
};

// Event Listeners Setup
function setupEventListeners() {
    console.log('[DEBUG] Setting up event listeners');
    
    // Clean up old listeners first
    const oldSelect = lessonSelect;
    const newSelect = oldSelect.cloneNode(true);
    oldSelect.parentNode.replaceChild(newSelect, oldSelect);
    
    // Setup lesson select dropdown
    newSelect.addEventListener('mousedown', function(e) {
        if (this.options.length > 0) {
            e.preventDefault();
            this.size = this.options.length > 10 ? 10 : this.options.length;
            this.focus();
        }
    });

    newSelect.addEventListener('blur', function() {
        this.size = 1;
    });

    newSelect.addEventListener('change', function() {
        this.size = 1;
        syncLessonPlan();
    });

    // Setup action buttons with proper cleanup
    document.querySelectorAll('.action-button').forEach(button => {
        // Remove old listeners before adding new ones
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
        clone.addEventListener('click', handleButtonClick);
    });

    // Setup file input handlers with cleanup
    const setupInput = (input, handler) => {
        if (input) {
            const clone = input.cloneNode(true);
            input.parentNode.replaceChild(clone, input);
            clone.addEventListener('change', handler);
        }
    };

    setupInput(imageUploadInput, handleImageUpload);
    setupInput(modelUploadInput, handleModelUpload);
    setupInput(lessonIconUploadInput, handleLessonIconUpload);
    setupInput(bulkModelUploadInput, handleBulkModelUpload);
    setupInput(bulkLessonsUploadInput, handleBulkLessonsUpload);
    setupInput(standardsAlignmentInput, handleStandardsChange);

    // Setup other buttons with cleanup
    if (downloadTemplateButton) {
        const clone = downloadTemplateButton.cloneNode(true);
        downloadTemplateButton.parentNode.replaceChild(clone, downloadTemplateButton);
        clone.addEventListener('click', downloadCsvTemplate);
    }

    if (removeLessonButton) {
        const clone = removeLessonButton.cloneNode(true);
        removeLessonButton.parentNode.replaceChild(clone, removeLessonButton);
        clone.addEventListener('click', removeLesson);
    }

    // Setup back to top button with cleanup
    if (backToTopButton) {
        const clone = backToTopButton.cloneNode(true);
        backToTopButton.parentNode.replaceChild(clone, backToTopButton);
        clone.addEventListener('click', scrollToTop);
    }

    // Document-level click handler for dropdown
    document.addEventListener('click', function(e) {
        if (lessonSelect && !lessonSelect.contains(e.target)) {
            lessonSelect.size = 1;
        }
    });
}

// Button Click Handler
function handleButtonClick(event) {
    const button = event.target;
    const buttonId = button.id;
    console.log('[DEBUG] Button clicked:', buttonId);

    switch (buttonId) {
        case 'createLessonButton':
            event.preventDefault();
            openCreateModal();
            break;
        case 'editLessonButton':
            openEditModal();
            break;
        case 'printButton':
            printLesson();
            break;
        case 'exportButton':
            exportLesson();
            break;
        case 'removeLessonButton':
            removeLesson();
            break;
        case 'downloadTemplateButton':
            downloadCsvTemplate();
            break;
        case 'backToTopButton':
            scrollToTop();
            break;
        case 'addCustomStandardButton':
            addCustomStandard();
            break;
    }
}

// Scroll to Top Function
function scrollToTop() {
    const content = lessonTabContent || document.documentElement;
    content.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Initialize Application
async function init() {
    console.log('[DEBUG] Starting application initialization');
    
    try {
        // Check DOM elements first
        const requiredElements = {
            lessonSelect,
            lessonDisplayArea,
            lessonTabContent,
            modelLoadingBarContainer,
            bulkModelLoadingBarContainer,
            bulkLessonLoadingBarContainer
        };

        // Verify all required elements exist
        Object.entries(requiredElements).forEach(([name, element]) => {
            if (!element) {
                throw new Error(`Required element not found: ${name}`);
            }
        });

        console.log('[DEBUG] Required DOM elements verified');

        // Load models with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                await loadModelsFromGitHub();
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    throw new Error(`Failed to load models after ${maxRetries} attempts: ${error.message}`);
                }
                console.warn(`[WARN] Retry ${retryCount}/${maxRetries} loading models`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }

        console.log('[DEBUG] Models loaded successfully');

        // Load lessons with retry logic
        retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                await loadLessonsFromStorage();
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    throw new Error(`Failed to load lessons after ${maxRetries} attempts: ${error.message}`);
                }
                console.warn(`[WARN] Retry ${retryCount}/${maxRetries} loading lessons`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }

        console.log('[DEBUG] Lessons loaded successfully');

        // Setup UI components
        updateLessonSelect();
        console.log('[DEBUG] Lesson select updated');

        setupEventListeners();
        console.log('[DEBUG] Event listeners setup complete');

        syncLessonPlan();
        console.log('[DEBUG] Lesson plan synced');

        // Initialize dropdown state
        if (lessonSelect) {
            lessonSelect.size = 1;
        }

        // Show success message
        if (document.getElementById('initStatus')) {
            document.getElementById('initStatus').textContent = 'Application initialized successfully';
            setTimeout(() => {
                const status = document.getElementById('initStatus');
                if (status) status.textContent = '';
            }, 3000);
        }

        console.log('[DEBUG] Application initialized successfully');

    } catch (error) {
        console.error('[ERROR] Failed to initialize application:', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <p>Failed to initialize application: ${error.message}</p>
            <button onclick="retryInitialization()">Retry</button>
            <button onclick="window.location.reload()">Refresh Page</button>
        `;

        // Insert error message at the top of the content area
        const contentArea = document.getElementById('lessonTabContent') || document.body;
        contentArea.insertBefore(errorMessage, contentArea.firstChild);

        throw error; // Re-throw for debugging purposes
    }
}

// Add retry function
async function retryInitialization() {
    console.log('[DEBUG] Retrying initialization');
    
    // Remove any existing error messages
    document.querySelectorAll('.error-message').forEach(msg => msg.remove());
    
    try {
        await init();
    } catch (error) {
        console.error('[ERROR] Retry initialization failed:', error);
    }
}

// Add initialization status check
function checkInitializationStatus() {
    return new Promise((resolve, reject) => {
        const requiredElements = [
            'lessonSelect',
            'lessonDisplayArea',
            'lessonTabContent',
            'modelLoadingBarContainer',
            'bulkModelLoadingBarContainer',
            'bulkLessonLoadingBarContainer'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            reject(new Error(`Missing required elements: ${missingElements.join(', ')}`));
            return;
        }

        resolve();
    });
}

// Modified document ready handler
function onDocumentReady() {
    checkInitializationStatus()
        .then(() => init())
        .catch(error => {
            console.error('[ERROR] Initialization check failed:', error);
            const message = `Failed to initialize application: ${error.message}. Please ensure all required elements are present.`;
            alert(message);
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDocumentReady);
} else {
    onDocumentReady();
}



// Modal Management
function openCreateModal() {
    console.log('[DEBUG] Opening create modal');
    isCreatingNewLesson = true;
    currentlyEditingLessonName = null;
    modalTitle.textContent = 'Create New Lesson';
    lessonModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    clearModalForm();
    lessonNameInput.focus();
    scrollToTop();
}

function openEditModal() {
    console.log('[DEBUG] Opening edit modal');
    if (!selectedLesson) {
        alert('Please select a lesson to edit.');
        return;
    }
    isCreatingNewLesson = false;
    currentlyEditingLessonName = selectedLesson.name;
    modalTitle.textContent = `Edit Lesson: ${selectedLesson.name}`;
    lessonModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    populateModalForm(selectedLesson);
    scrollToTop();
}

function closeModal() {
    console.log('[DEBUG] Closing modal');
    lessonModal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Cleanup temporary data
    tempImageData.forEach(data => {
        if (data.src) URL.revokeObjectURL(data.src);
        else if (typeof data === 'string' && data.startsWith('blob:')) URL.revokeObjectURL(data);
    });
    
    tempModelData.forEach(data => {
        if (data.src?.startsWith('blob:')) URL.revokeObjectURL(data.src);
    });
    
    if (tempIconData) {
        if (tempIconData.src) URL.revokeObjectURL(tempIconData.src);
        else if (typeof tempIconData === 'string' && tempIconData.startsWith('blob:')) URL.revokeObjectURL(tempIconData);
    }
    
    // Reset all temporary data
    tempImageData = [];
    tempModelData = [];
    tempIconData = null;
    tempStandards = [];
    
    clearModalForm();
    hideLoadingBar(true, 'model');
    hideLoadingBar(true, 'bulk-model');
    hideLoadingBar(true, 'bulk-lesson');
}

function clearModalForm() {
    // Reset all input fields
    const inputs = {
        lessonNameInput: '',
        subjectInput: '',
        teacherNameInput: '',
        learningObjectivesInput: '',
        standardsAlignmentInput: '',
        customStandardInput: '',
        engageInput: '',
        exploreInput: '',
        explainInput: '',
        elaborateInput: '',
        evaluateInput: '',
        materialsNeededInput: '',
        keyVocabularyInput: '',
        supplementaryLinksInput: '',
        teacherNotesInput: ''
    };

    Object.entries(inputs).forEach(([inputName, value]) => {
        const element = window[inputName];
        if (element) element.value = value;
    });

    // Clear preview areas
    const previewAreas = [
        selectedStandardsDisplayModal,
        modalResourcePreview,
        modalModelPreview,
        modalLessonIconPreview
    ];

    previewAreas.forEach(area => {
        if (area) area.innerHTML = '';
    });

    // Reset temporary data
    tempImageData = [];
    tempModelData = [];
    tempIconData = null;
    tempStandards = [];

    renderModalPreviews();
    resetFileInputs();
}

function populateModalForm(lesson) {
    console.log('[DEBUG] Populating modal form with lesson:', lesson.name);
    clearModalForm();

    if (!lesson) {
        console.error('[ERROR] No lesson provided to populateModalForm');
        return;
    }

    // Populate basic fields
    const fields = {
        lessonNameInput: lesson.name || '',
        subjectInput: lesson.subject || '',
        teacherNameInput: lesson.teacher || '',
        learningObjectivesInput: lesson.objectives?.learningObjectives?.join('\n') || '',
        engageInput: lesson.structure?.engage || '',
        exploreInput: lesson.structure?.explore || '',
        explainInput: lesson.structure?.explain || '',
        elaborateInput: lesson.structure?.elaborate || '',
        evaluateInput: lesson.structure?.evaluate || '',
        materialsNeededInput: lesson.resources?.materialsNeeded?.join(', ') || '',
        keyVocabularyInput: lesson.resources?.keyVocabulary?.join('\n') || '',
        supplementaryLinksInput: lesson.resources?.supplementaryLinks?.join('\n') || '',
        teacherNotesInput: lesson.notes?.teacherNotes || ''
    };

    Object.entries(fields).forEach(([fieldName, value]) => {
        const element = window[fieldName];
        if (element) element.value = value;
    });

    // Handle standards
    tempStandards = lesson.objectives?.standardsAlignment ? [...lesson.objectives.standardsAlignment] : [];
    renderStandardsInModal();

    // Handle media
    tempImageData = lesson.resources?.images ? [...lesson.resources.images] : [];
    tempModelData = lesson.models ? [...lesson.models] : [];
    tempIconData = lesson.lessonIcon || null;

    renderModalPreviews();
}

// Lesson Select Management
function updateLessonSelect() {
    console.log('[DEBUG] Updating lesson select...');
    
    if (!lessonSelect) {
        console.error('[ERROR] Lesson select element not found');
        return;
    }

    const currentVal = lessonSelect.value;
    
    // Clear existing options
    lessonSelect.innerHTML = '<option value="">Select a lesson</option>';
    
    // Sort and add lessons
    const sortedLessons = [...gradeOneContent.lessons].sort((a, b) => 
        a.name.localeCompare(b.name));
    
    console.log('[DEBUG] Adding sorted lessons to select:', sortedLessons.length);
    
    sortedLessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.name;
        option.textContent = lesson.name;
        lessonSelect.appendChild(option);
    });

    // Restore previous selection if valid
    const lessonExists = gradeOneContent.lessons.some(l => l.name === currentVal);
    lessonSelect.value = lessonExists ? currentVal : '';
    lessonSelect.size = 1; // Ensure dropdown is closed
    
    console.log('[DEBUG] Lesson select updated:', {
        totalOptions: lessonSelect.options.length,
        currentValue: lessonSelect.value
    });

    if (!lessonExists && selectedLesson) {
        selectedLesson = null;
        clearDisplayArea();
    }
}

// Lesson Display Management
function syncLessonPlan() {
    console.log('[DEBUG] Syncing lesson plan');
    const lessonName = lessonSelect.value;
    selectedLesson = gradeOneContent.lessons.find(lesson => lesson.name === lessonName) || null;
    
    if (selectedLesson) {
        displaySelectedLesson(selectedLesson);
        enableActionButtons();
    } else {
        clearDisplayArea();
        disableActionButtons();
    }
}

// Continued from Part 2...

function displaySelectedLesson(lesson) {
    const startTime = performance.now();
    console.log(`[DEBUG] Starting displaySelectedLesson for lesson: ${lesson.name}`);

    if (!lesson) {
        console.error('[ERROR] No lesson provided to displaySelectedLesson');
        clearDisplayArea();
        disableActionButtons();
        return;
    }

    // Save the selected lesson to localStorage for persistence
    try {
        localStorage.setItem('selectedLesson', JSON.stringify(lesson));
        console.log('[DEBUG] Saved selected lesson to localStorage:', lesson.name);
    } catch (error) {
        console.error('[ERROR] Failed to save selected lesson to localStorage:', error);
    }

    // Send models to parent window/explore tab
    try {
        window.parent.postMessage({
            type: 'loadLessonModels',
            primaryModel: lesson.models?.[0] || null,
            models: lesson.models || []
        }, '*');
        console.log('[DEBUG] Sent models to explore tab:', {
            primaryModel: lesson.models?.[0]?.name || 'None',
            totalModels: lesson.models?.length || 0
        });
    } catch (error) {
        console.error('[ERROR] Failed to send models to explore tab:', error);
    }

    // Display lesson content
    lessonDisplayArea.style.display = 'block';
    
    // Update timeline navigation if needed
    updateTimelineNavigation(lesson);

    // Update basic information
    const basicInfo = {
        lessonTitleDisplay: lesson.name,
        subjectDisplay: lesson.subject ? `Subject: ${lesson.subject}` : '',
        teacherNameDisplay: lesson.teacher ? `Teacher: ${lesson.teacher}` : '',
        lastUpdated: `Last Updated: ${lesson.lastUpdated || 'N/A'}`
    };

    Object.entries(basicInfo).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) element.textContent = value;
    });

    // Update content sections
    updateContentSections(lesson);
    
    // Update resource displays
    updateResourceDisplays(lesson);

    console.log(`[DEBUG] Finished displaySelectedLesson. Time taken: ${(performance.now() - startTime).toFixed(2)}ms`);
}

function updateTimelineNavigation(lesson) {
    const timelineContainer = lessonDisplayArea.querySelector('.lesson-timeline') || 
        document.createElement('div');
    
    if (!timelineContainer.classList.contains('lesson-timeline')) {
        timelineContainer.className = 'lesson-timeline';
        timelineContainer.innerHTML = `
            <div class="timeline-step" data-stage="engage"><span class="icon">💡</span>Engage</div>
            <div class="timeline-step" data-stage="explore"><span class="icon">🔍</span>Explore</div>
            <div class="timeline-step" data-stage="explain"><span class="icon">📝</span>Explain</div>
            <div class="timeline-step" data-stage="elaborate"><span class="icon">🛠️</span>Elaborate</div>
            <div class="timeline-step" data-stage="evaluate"><span class="icon">✅</span>Evaluate</div>
        `;
        
        // Add timeline to display area if it doesn't exist
        if (!lessonDisplayArea.querySelector('.lesson-timeline')) {
            lessonDisplayArea.insertBefore(timelineContainer, lessonDisplayArea.firstChild);
        }
    }

    // Setup timeline navigation
    timelineContainer.querySelectorAll('.timeline-step').forEach(step => {
        const clone = step.cloneNode(true);
        step.parentNode.replaceChild(clone, step);
        clone.addEventListener('click', () => {
            const stage = clone.dataset.stage;
            const section = document.getElementById(`${stage}Content`)?.parentElement;
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
                console.log(`[DEBUG] Navigated to ${stage} section`);
            }
        });
    });
}

function updateContentSections(lesson) {
    // Update 5E sections
    const sections = {
        engage: engageContent,
        explore: exploreContent,
        explain: explainContent,
        elaborate: elaborateContent,
        evaluate: evaluateContent
    };

    Object.entries(sections).forEach(([key, element]) => {
        if (element) {
            element.textContent = lesson.structure?.[key] || 'Not specified';
        }
    });

    // Update lists
    updateList(learningObjectivesList, lesson.objectives?.learningObjectives);
    updateList(materialsNeededList, lesson.resources?.materialsNeeded);
    updateTags(keyVocabularyTags, lesson.resources?.keyVocabulary);
    updateTags(standardsAlignmentDisplay, lesson.objectives?.standardsAlignment, 'tag standard-tag-view');
    updateLinks(supplementaryLinksList, lesson.resources?.supplementaryLinks);
    
    if (teacherNotesContent) {
        teacherNotesContent.textContent = lesson.notes?.teacherNotes || 'No notes added.';
    }
}

function updateResourceDisplays(lesson) {
    // Update resource previews
    updateResourcePreview(resourcePreview, lesson.resources?.images);
    updateResourcePreview(lessonIconPreview, lesson.lessonIcon ? [lesson.lessonIcon] : null);
    updateModelPreview(modelPreview, lesson.models);
}

function updateList(listElement, items, defaultText = 'None specified') {
    if (!listElement) return;

    const fragment = document.createDocumentFragment();
    
    if (items?.length) {
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            fragment.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = defaultText;
        fragment.appendChild(li);
    }
    
    listElement.innerHTML = '';
    listElement.appendChild(fragment);
}

function updateTags(tagElement, items, tagClass = 'tag') {
    if (!tagElement) return;

    const fragment = document.createDocumentFragment();
    
    if (items?.length) {
        items.forEach(item => {
            const span = document.createElement('span');
            span.className = tagClass;
            span.title = item;
            span.textContent = item.length > 60 ? item.substring(0, 57) + '...' : item;
            fragment.appendChild(span);
        });
    } else {
        const span = document.createElement('span');
        span.textContent = 'None specified';
        fragment.appendChild(span);
    }
    
    tagElement.innerHTML = '';
    tagElement.appendChild(fragment);
}

function updateLinks(linkElement, links) {
    if (!linkElement) return;

    const fragment = document.createDocumentFragment();
    
    if (links?.length) {
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.startsWith('http') ? link : `https://${link}`;
            a.textContent = link;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            fragment.appendChild(a);
            fragment.appendChild(document.createElement('br'));
        });
    } else {
        const span = document.createElement('span');
        span.textContent = 'No links provided';
        fragment.appendChild(span);
    }
    
    linkElement.innerHTML = '';
    linkElement.appendChild(fragment);
}

function updateResourcePreview(previewElement, resources) {
    if (!previewElement) return;

    const fragment = document.createDocumentFragment();
    
    if (resources?.length) {
        resources.forEach((resource, index) => {
            const img = document.createElement('img');
            img.src = resource;
            img.alt = `Resource ${index + 1}`;
            img.onerror = () => {
                console.warn(`[DEBUG] Failed to load image: ${resource}`);
                img.alt = 'Failed to load image';
                img.classList.add('error');
            };
            fragment.appendChild(img);
        });
    } else {
        const span = document.createElement('span');
        span.className = 'no-preview';
        span.textContent = 'No resources uploaded.';
        fragment.appendChild(span);
    }
    
    previewElement.innerHTML = '';
    previewElement.appendChild(fragment);
}

function updateModelPreview(previewElement, models) {
    if (!previewElement) return;

    const fragment = document.createDocumentFragment();
    
    if (models?.length) {
        models.forEach(model => {
            const modelDiv = document.createElement('div');
            modelDiv.className = 'model-item';
            
            const canPreview = model.src && (
                model.src.startsWith('blob:') || 
                model.src.startsWith('http') || 
                model.src.startsWith('https')
            );
            
            const safeModelName = model.name.replace(/'/g, "\\'").replace(/"/g, '"');
            
            modelDiv.innerHTML = `
                <span class="model-name" title="${model.name}">${model.name}</span>
                <button type="button" class="preview-action-button" 
                    ${!canPreview ? 'disabled title="Preview requires a valid model URL"' : ''} 
                    onclick="${canPreview ? `previewModel('${model.src}', '${safeModelName}')` : ''}">
                    Preview
                </button>
            `;
            fragment.appendChild(modelDiv);
        });
    } else {
        const span = document.createElement('span');
        span.className = 'no-preview';
        span.textContent = 'No models associated.';
        fragment.appendChild(span);
    }
    
    previewElement.innerHTML = '';
    previewElement.appendChild(fragment);
}

// Continued from Part 3...
// Last Updated: 2025-05-05 00:10:31 UTC
// Author: Bedo77

// File Handling and Upload Management
async function handleModelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`[DEBUG] Processing model file: ${file.name}`);

    // Validate file
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
        alert('Please upload a valid 3D model file (.glb or .gltf).');
        resetFileInputs();
        return;
    }

    const maxFileSize = 100 * 1024 * 1024; // 100MB limit
    if (file.size > maxFileSize) {
        alert(`Model file exceeds ${maxFileSize / (1024 * 1024)}MB limit.`);
        resetFileInputs();
        return;
    }

    try {
        showLoadingBar(file.name, 'model');
        updateLoadingBar(10, 'model');

        // Upload to GitHub
        const githubUrl = await uploadModelToGitHub(file);
        updateLoadingBar(90, 'model');

        // Add to temp data
        tempModelData.push({
            name: file.name,
            src: githubUrl,
            base64: null
        });

        updateLoadingBar(100, 'model');
        renderModalPreviews();
        
        console.log(`[DEBUG] Model ${file.name} uploaded successfully`);
    } catch (error) {
        console.error(`[ERROR] Failed to upload model ${file.name}:`, error);
        alert(`Failed to upload model: ${error.message}`);
    } finally {
        hideLoadingBar(false, 'model');
        resetFileInputs();
    }
}

async function handleBulkModelUpload(event) {
    console.log('[DEBUG] Starting bulk model upload');
    const files = Array.from(event.target.files);
    const statusElement = document.getElementById('bulkUploadStatus');

    if (!statusElement) {
        console.error('[ERROR] Bulk upload status element not found');
        return;
    }

    if (!files.length) {
        updateBulkUploadStatus('No files selected.', 'error');
        return;
    }

    // Validate files
    const maxFileSize = 100 * 1024 * 1024;
    const { validFiles, invalidFiles } = validateModelFiles(files, maxFileSize);

    if (!validFiles.length) {
        const errorMessage = 'No valid models to upload:\n' + 
            invalidFiles.map(f => `${f.name}: ${f.reason}`).join('\n');
        updateBulkUploadStatus(errorMessage, 'error');
        return;
    }

    try {
        showLoadingBar('Processing bulk upload...', 'bulk-model');
        updateBulkUploadStatus(`Processing ${validFiles.length} model(s)...`, 'progress');

        const results = await processBulkModelUpload(validFiles);
        
        handleBulkUploadResults(results, validFiles);
        
    } catch (error) {
        console.error('[ERROR] Bulk upload failed:', error);
        updateBulkUploadStatus(`Upload failed: ${error.message}`, 'error');
    } finally {
        hideLoadingBar(false, 'bulk-model');
        resetFileInputs();
    }
}

async function processBulkModelUpload(validFiles) {
    const results = {
        successful: [],
        failed: []
    };

    // Initial progress phase (0% to 30%)
    await animateProgress(0, 30, 1000, 'bulk-model');

    // Upload phase (30% to 90%)
    const progressPerFile = 60 / validFiles.length;
    let currentProgress = 30;

    for (const file of validFiles) {
        try {
            const url = await uploadModelToGitHub(file);
            results.successful.push({
                name: file.name,
                url: url
            });
            
            currentProgress += progressPerFile;
            updateLoadingBar(Math.min(currentProgress, 90), 'bulk-model');
            
        } catch (error) {
            results.failed.push({
                name: file.name,
                reason: error.message
            });
        }
    }

    // Final progress phase (90% to 100%)
    await animateProgress(90, 100, 500, 'bulk-model');

    return results;
}

function validateModelFiles(files, maxFileSize) {
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
        if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
            invalidFiles.push({
                name: file.name,
                reason: 'Invalid format (must be .glb or .gltf)'
            });
        } else if (file.size > maxFileSize) {
            invalidFiles.push({
                name: file.name,
                reason: `File exceeds ${maxFileSize / (1024 * 1024)}MB limit`
            });
        } else {
            validFiles.push(file);
        }
    });

    return { validFiles, invalidFiles };
}

async function animateProgress(start, end, duration, context) {
    const startTime = Date.now();
    
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = start + Math.min((elapsed / duration) * (end - start), end - start);
            
            updateLoadingBar(progress, context);
            
            if (elapsed >= duration) {
                clearInterval(interval);
                updateLoadingBar(end, context);
                resolve();
            }
        }, 50);
    });
}

function updateBulkUploadStatus(message, type = 'info') {
    const statusElement = document.getElementById('bulkUploadStatus');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `bulk-status ${type}`;

    if (type !== 'progress') {
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'bulk-status';
        }, 5000);
    }
}

// GitHub Integration
async function uploadModelToGitHub(file) {
    const GITHUB_TOKEN = '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';
    const OWNER = 'Bedo77';
    const REPO = '3d-model-viewer';
    const PATH = `Science/grade_one/models/${file.name}`;
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async () => {
            const base64Content = reader.result.split(',')[1];
            
            try {
                // Check if file exists
                const existingFile = await checkFileExists(url, GITHUB_TOKEN);
                
                // Prepare upload payload
                const payload = {
                    message: `Upload ${file.name} via Lesson Plan App (${new Date().toISOString()})`,
                    content: base64Content
                };

                if (existingFile) {
                    payload.sha = existingFile.sha;
                }

                // Upload file
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${await response.text()}`);
                }

                const data = await response.json();
                console.log(`[DEBUG] Successfully uploaded ${file.name} to GitHub`);
                resolve(data.content.download_url);
                
            } catch (error) {
                console.error(`[ERROR] Failed to upload ${file.name}:`, error);
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error(`Failed to read file ${file.name}`));
        };

        reader.readAsDataURL(file);
    });
}

async function checkFileExists(url, token) {
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`GitHub API error: ${await response.text()}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[ERROR] Failed to check file existence:', error);
        return null;
    }
}

// Continued from Part 4...
// Last Updated: 2025-05-05 00:11:58 UTC
// Author: Bedo77

// Loading Bar Management
function showLoadingBar(message = 'Uploading...', context = 'model') {
    console.log('[DEBUG] Showing loading bar:', { message, context });
    
    const containers = {
        'model': modelLoadingBarContainer,
        'bulk-model': bulkModelLoadingBarContainer,
        'bulk-lesson': bulkLessonLoadingBarContainer
    };

    const loadingBar = containers[context]?.querySelector('.loading-bar');
    const loadingText = containers[context]?.querySelector('.loading-text');
    
    if (!loadingBar || !loadingText) {
        console.error(`[ERROR] Loading bar elements not found for context: ${context}`);
        return;
    }

    loadingText.textContent = message;
    loadingBar.style.setProperty('--progress', '0%');
    containers[context].classList.add('visible');
    containers[context].style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function updateLoadingBar(progress, context = 'model') {
    const loadingBars = {
        'model': modelLoadingBar,
        'bulk-model': bulkModelLoadingBar,
        'bulk-lesson': bulkLessonLoadingBar
    };

    const loadingBar = loadingBars[context];
    if (!loadingBar) {
        console.error(`[ERROR] Loading bar not found for context: ${context}`);
        return;
    }

    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    loadingBar.style.setProperty('--progress', `${clampedProgress}%`);
    loadingBar.setAttribute('aria-valuenow', clampedProgress);
    
    console.log('[DEBUG] Loading bar updated:', { context, progress: clampedProgress });
}

function hideLoadingBar(force = false, context = 'model') {
    console.log('[DEBUG] Hiding loading bar:', { force, context });
    
    const containers = {
        'model': modelLoadingBarContainer,
        'bulk-model': bulkModelLoadingBarContainer,
        'bulk-lesson': bulkLessonLoadingBarContainer
    };

    const container = containers[context];
    if (!container) {
        console.error(`[ERROR] Loading bar container not found for context: ${context}`);
        return;
    }

    if (force) {
        container.classList.remove('visible');
        container.style.display = 'none';
        document.body.style.overflow = '';
    } else {
        container.classList.remove('visible');
        setTimeout(() => {
            container.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

// Model Preview Management
function previewModel(modelSrc, modelName) {
    console.log(`[DEBUG] Opening model preview: ${modelName}`);
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'model-preview-modal';
    modal.innerHTML = `
        <div class="model-preview-container">
            <button class="model-preview-close" aria-label="Close preview">×</button>
            <h3>${modelName}</h3>
            <model-viewer
                class="model-preview-viewer"
                src="${modelSrc}"
                alt="${modelName}"
                auto-rotate
                camera-controls
                interaction-prompt="auto"
                interaction-prompt-threshold="0"
                ar
                ar-modes="webxr scene-viewer quick-look"
                shadow-intensity="1"
                environment-image="neutral"
                exposure="1"
                style="width: 100%; height: 400px;"
            >
                <div slot="progress-bar" class="model-loading">Loading model...</div>
                <div slot="poster" class="model-error" style="display: none;">Failed to load model.</div>
                <div slot="ar-prompt" class="ar-prompt">
                    👆 Tap to view in your space
                </div>
            </model-viewer>
        </div>
    `;

    // Add to document
    document.body.appendChild(modal);

    // Setup model viewer
    const modelViewer = modal.querySelector('model-viewer');
    const loadingSlot = modal.querySelector('.model-loading');
    const errorSlot = modal.querySelector('.model-error');
    let isLoadingResolved = false;

    // Loading management
    const hideLoadingLabel = () => {
        if (!isLoadingResolved) {
            loadingSlot.style.display = 'none';
            isLoadingResolved = true;
        }
    };

    // Event listeners
    modelViewer.addEventListener('load', () => {
        console.log(`[DEBUG] Model loaded: ${modelName}`);
        hideLoadingLabel();
    }, { once: true });

    modelViewer.addEventListener('error', (error) => {
        console.error(`[ERROR] Failed to load model ${modelName}:`, error);
        hideLoadingLabel();
        errorSlot.style.display = 'block';
        errorSlot.textContent = `Failed to load model: ${error.message || 'Unknown error'}`;
    }, { once: true });

    // Loading timeout
    setTimeout(() => {
        if (!isLoadingResolved) {
            console.warn(`[WARN] Model loading timed out: ${modelName}`);
            hideLoadingLabel();
            errorSlot.style.display = 'block';
            errorSlot.textContent = 'Model loading timed out. The file may be unavailable or unsupported.';
        }
    }, 30000); // 30 second timeout

    // Close button handler
    modal.querySelector('.model-preview-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Escape key to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Utility Functions
function resetFileInputs() {
    const inputs = [
        imageUploadInput,
        modelUploadInput,
        lessonIconUploadInput,
        bulkModelUploadInput,
        bulkLessonsUploadInput
    ];

    inputs.forEach(input => {
        if (input) {
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
        }
    });
}

function enableActionButtons() {
    [editLessonButton, printButton, exportButton].forEach(button => {
        if (button) button.disabled = false;
    });
}

function disableActionButtons() {
    [editLessonButton, printButton, exportButton].forEach(button => {
        if (button) button.disabled = true;
    });
}

// Error Handling
function handleError(error, context) {
    console.error(`[ERROR] ${context}:`, error);
    alert(`An error occurred: ${error.message}`);
}

// Window Message Handling
window.addEventListener('message', (event) => {
    try {
        const message = event.data;
        console.log('[DEBUG] Received message:', message.type);

        switch (message.type) {
            case 'modelLoaded':
                handleModelLoaded(message);
                break;
            case 'modelError':
                handleModelError(message);
                break;
            case 'updateLessonState':
                handleLessonStateUpdate(message);
                break;
            default:
                console.log('[DEBUG] Unhandled message type:', message.type);
        }
    } catch (error) {
        console.error('[ERROR] Failed to process window message:', error);
    }
});

// Clean up on page unload
window.addEventListener('unload', () => {
    // Cleanup blob URLs
    tempImageData.forEach(data => {
        if (data.src?.startsWith('blob:')) URL.revokeObjectURL(data.src);
    });
    tempModelData.forEach(data => {
        if (data.src?.startsWith('blob:')) URL.revokeObjectURL(data.src);
    });
    if (tempIconData?.startsWith('blob:')) URL.revokeObjectURL(tempIconData);
});

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export necessary functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        init,
        handleModelUpload,
        handleBulkModelUpload,
        previewModel,
        updateLessonSelect,
        syncLessonPlan,
        displaySelectedLesson,
        openCreateModal,
        openEditModal,
        closeModal,
        saveLesson,
        removeLesson,
        handleError
    };
}
