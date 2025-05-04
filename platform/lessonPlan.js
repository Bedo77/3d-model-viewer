// lessonPlan.js
// Located at: E:\Python backups\3d converter\ar module\The platform Studio\physics\Grade One\lessonPlan.js

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
let isDeleteMode = false; // Ensure single declaration

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
    tempImageData.forEach(data => URL.revokeObjectURL(data.src || data));
    tempModelData.forEach(data => URL.revokeObjectURL(data.src));
    if (tempIconData) URL.revokeObjectURL(tempIconData.src || tempIconData);
    tempImageData = [];
    tempModelData = [];
    tempIconData = null;
    tempStandards = [];
    clearModalForm();
    // Hide all loading bars when modal closes
    hideLoadingBar(true, 'model');
    hideLoadingBar(true, 'bulk-model');
    hideLoadingBar(true, 'bulk-lesson');
}

function clearModalForm() {
    lessonNameInput.value = '';
    subjectInput.value = ''; // New field
    teacherNameInput.value = '';
    learningObjectivesInput.value = '';
    standardsAlignmentInput.value = '';
    customStandardInput.value = '';
    engageInput.value = '';
    exploreInput.value = '';
    explainInput.value = '';
    elaborateInput.value = '';
    evaluateInput.value = '';
    materialsNeededInput.value = '';
    keyVocabularyInput.value = '';
    supplementaryLinksInput.value = '';
    teacherNotesInput.value = '';
    selectedStandardsDisplayModal.innerHTML = '';
    modalResourcePreview.innerHTML = '';
    modalModelPreview.innerHTML = '';
    modalLessonIconPreview.innerHTML = '';
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
    lessonNameInput.value = lesson.name || '';
    subjectInput.value = lesson.subject || ''; // New field
    teacherNameInput.value = lesson.teacher || '';
    learningObjectivesInput.value = lesson.objectives?.learningObjectives?.join('\n') || '';
    tempStandards = lesson.objectives?.standardsAlignment ? [...lesson.objectives.standardsAlignment] : [];
    renderStandardsInModal();
    engageInput.value = lesson.structure?.engage || '';
    exploreInput.value = lesson.structure?.explore || '';
    explainInput.value = lesson.structure?.explain || '';
    elaborateInput.value = lesson.structure?.elaborate || '';
    evaluateInput.value = lesson.structure?.evaluate || '';
    materialsNeededInput.value = lesson.resources?.materialsNeeded?.join(', ') || '';
    keyVocabularyInput.value = lesson.resources?.keyVocabulary?.join('\n') || '';
    supplementaryLinksInput.value = lesson.resources?.supplementaryLinks?.join('\n') || '';
    tempImageData = lesson.resources?.images ? [...lesson.resources.images] : [];
    tempModelData = lesson.models ? [...lesson.models] : [];
    tempIconData = lesson.lessonIcon || null;
    teacherNotesInput.value = lesson.notes?.teacherNotes || '';
    renderModalPreviews();
}

// Lesson Saving and Storage
async function saveLesson() {
    console.log('[DEBUG] Saving lesson');
    const lessonName = lessonNameInput.value.trim();
    if (!lessonName) {
        alert('Lesson Name cannot be empty.');
        lessonNameInput.focus();
        return;
    }
    const lowerCaseName = lessonName.toLowerCase();
    const isDuplicate = gradeOneContent.lessons.some(
        lesson => lesson.name.toLowerCase() === lowerCaseName && lesson.name !== currentlyEditingLessonName
    );
    if (isDuplicate) {
        alert(`A lesson with the name "${lessonName}" already exists.`);
        lessonNameInput.focus();
        return;
    }

    const getListFromTextArea = (textarea) => textarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    const getListFromCommaSeparated = (input) => input.value.split(',').map(s => s.trim()).filter(Boolean);
    const getLinksFromTextArea = (textarea) =>
        getListFromTextArea(textarea)
            .map(link => (link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`))
            .filter(link => { try { new URL(link); return true; } catch (_) { return false; } });

    const lessonData = {
        name: lessonName,
        subject: subjectInput.value.trim(), // New field
        teacher: teacherNameInput.value.trim(),
        lessonIcon: tempIconData,
        objectives: {
            learningObjectives: getListFromTextArea(learningObjectivesInput),
            standardsAlignment: [...tempStandards]
        },
        structure: {
            engage: engageInput.value.trim(),
            explore: exploreInput.value.trim(),
            explain: explainInput.value.trim(),
            elaborate: elaborateInput.value.trim(),
            evaluate: evaluateInput.value.trim()
        },
        resources: {
            materialsNeeded: getListFromCommaSeparated(materialsNeededInput),
            keyVocabulary: getListFromTextArea(keyVocabularyInput),
            supplementaryLinks: getLinksFromTextArea(supplementaryLinksInput),
            images: [...tempImageData]
        },
        notes: { teacherNotes: teacherNotesInput.value.trim() },
        models: tempModelData.map(m => ({
            name: m.name,
            src: m.src,
            base64: m.base64 || null
        })),
        lastUpdated: new Date().toLocaleString()
    };

    const lessonIndex = isCreatingNewLesson ? -1 : gradeOneContent.lessons.findIndex(lesson => lesson.name === currentlyEditingLessonName);
    if (lessonIndex >= 0) {
        gradeOneContent.lessons[lessonIndex] = lessonData;
    } else {
        gradeOneContent.lessons.push(lessonData);
    }

    lessonsModified = true;
    try {
        showLoadingBar('Saving lesson...', 'model'); // Using 'model' context for simplicity
        updateLoadingBar(10, 'model'); // Initial progress

        // Simulate progress during save
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing delay
        updateLoadingBar(50, 'model'); // Mid-point progress

        await saveLessonsToStorage(); // This uploads to GitHub
        updateLoadingBar(90, 'model'); // Near completion

        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate final processing
        updateLoadingBar(100, 'model'); // Complete

        const savedName = lessonData.name;
        closeModal();
        updateLessonSelect();
        lessonSelect.value = savedName;
        syncLessonPlan();
        alert(`Lesson "${savedName}" saved successfully!`);
    } catch (error) {
        console.error('[ERROR] Failed to save lesson:', error);
        alert(`Failed to save lesson: ${error.message}`);
    } finally {
        hideLoadingBar(false, 'model');
    }
}

async function saveLessonsToStorage() {
    try {
        localStorage.setItem('gradeOneLessons', JSON.stringify(gradeOneContent.lessons));
        window.parent.postMessage({ type: 'lessonsUpdated', lessons: gradeOneContent.lessons }, '*');
        if (lessonsModified) {
            console.log('[DEBUG] Lessons modified, uploading to GitHub.');
            await uploadLessonsToGitHub(gradeOneContent.lessons);
            lessonsModified = false;
        } else {
            console.log('[DEBUG] Lessons not modified, skipping GitHub upload.');
        }
    } catch (e) {
        console.error('[ERROR] Error saving lessons:', e);
        alert('Error saving lessons. Check console for details.');
    }
}

async function loadLessonsFromStorage() {
    console.log('[DEBUG] Loading lessons from storage');
    let loadedLessons = [];

    const githubLessons = await loadLessonsFromGitHub();
    if (githubLessons !== null) {
        loadedLessons = githubLessons.map(lesson => ({
            name: lesson.name || 'Untitled Lesson',
            teacher: lesson.teacher || '',
            lessonIcon: lesson.lessonIcon || null,
            objectives: {
                learningObjectives: lesson.objectives?.learningObjectives || [],
                standardsAlignment: lesson.objectives?.standardsAlignment || []
            },
            structure: {
                engage: lesson.structure?.engage || '',
                explore: lesson.structure?.explore || '',
                explain: lesson.structure?.explain || '',
                elaborate: lesson.structure?.elaborate || '',
                evaluate: lesson.structure?.evaluate || ''
            },
            resources: {
                materialsNeeded: lesson.resources?.materialsNeeded || [],
                keyVocabulary: lesson.resources?.keyVocabulary || [],
                supplementaryLinks: lesson.resources?.supplementaryLinks || [],
                images: lesson.resources?.images || []
            },
            notes: { teacherNotes: lesson.notes?.teacherNotes || '' },
            models: lesson.models || [],
            lastUpdated: lesson.lastUpdated || 'N/A'
        }));
        localStorage.setItem('gradeOneLessons', JSON.stringify(loadedLessons));
    } else {
        const savedLessonsJson = localStorage.getItem('gradeOneLessons');
        if (savedLessonsJson) {
            try {
                const parsedData = JSON.parse(savedLessonsJson);
                if (Array.isArray(parsedData)) {
                    loadedLessons = parsedData.map(lesson => ({
                        name: lesson.name || 'Untitled Lesson',
                        teacher: lesson.teacher || '',
                        lessonIcon: lesson.lessonIcon || null,
                        objectives: {
                            learningObjectives: lesson.objectives?.learningObjectives || [],
                            standardsAlignment: lesson.objectives?.standardsAlignment || []
                        },
                        structure: {
                            engage: lesson.structure?.engage || '',
                            explore: lesson.structure?.explore || '',
                            explain: lesson.structure?.explain || '',
                            elaborate: lesson.structure?.elaborate || '',
                            evaluate: lesson.structure?.evaluate || ''
                        },
                        resources: {
                            materialsNeeded: lesson.resources?.materialsNeeded || [],
                            keyVocabulary: lesson.resources?.keyVocabulary || [],
                            supplementaryLinks: lesson.resources?.supplementaryLinks || [],
                            images: lesson.resources?.images || []
                        },
                        notes: { teacherNotes: lesson.notes?.teacherNotes || '' },
                        models: lesson.models || [],
                        lastUpdated: lesson.lastUpdated || 'N/A'
                    }));
                }
            } catch (e) {
                console.error('[ERROR] Error parsing lessons:', e);
                localStorage.removeItem('gradeOneLessons');
            }
        }
    }

    gradeOneContent.lessons = loadedLessons;
    updateLessonSelect();
    console.log('[DEBUG] Loaded lessons:', gradeOneContent.lessons);
}

function removeLesson() {
    console.log('[DEBUG] removeLesson called');
    if (!gradeOneContent.lessons.length) {
        alert('No lessons available to delete.');
        return;
    }
    if (!isDeleteMode) {
        console.log('[DEBUG] Entering delete mode');
        isDeleteMode = true;
        lessonCheckboxes.style.display = 'block';
        confirmDeleteButton.style.display = 'inline-block';
        cancelDeleteButton.style.display = 'inline-block';
        lessonSelect.style.display = 'none';
        removeLessonButton.textContent = 'Exit Delete Mode';
        removeLessonButton.removeEventListener('click', removeLesson); // Remove old listener
        removeLessonButton.addEventListener('click', exitDeleteMode); // Add exit listener
        renderLessonCheckboxes();
        setupDeleteModeListeners(); // Set up confirm/cancel listeners
        lessonCheckboxes.style.visibility = 'visible';
        console.log('[DEBUG] lessonCheckboxes display set to:', lessonCheckboxes.style.display);
        console.log('[DEBUG] lessonCheckboxes children:', lessonCheckboxes.innerHTML);
        alert('Select the lessons you want to delete using the checkboxes, then click "Confirm Deletion" to remove them. Click "Cancel" or "Exit Delete Mode" to abort.');
    }
}

function exitDeleteMode() {
    console.log('[DEBUG] Exiting delete mode');
    isDeleteMode = false;
    lessonCheckboxes.style.display = 'none';
    confirmDeleteButton.style.display = 'none';
    cancelDeleteButton.style.display = 'none';
    lessonSelect.style.display = 'block';
    removeLessonButton.textContent = 'Remove Lesson';
    removeLessonButton.removeEventListener('click', exitDeleteMode); // Clean up
    removeLessonButton.addEventListener('click', removeLesson); // Restore original
    syncLessonPlan();
}

function confirmDeleteLessons() {
    console.log('[DEBUG] Confirming lesson deletion');
    const checkedBoxes = lessonCheckboxList.querySelectorAll('input[type="checkbox"]:checked');
    const lessonsToDelete = Array.from(checkedBoxes).map(cb => cb.value);
    if (lessonsToDelete.length === 0) {
        alert('No lessons selected for deletion.');
        return;
    }

    const confirmMsg = `Are you sure you want to delete the following ${lessonsToDelete.length} lesson(s)?\n\n${lessonsToDelete.join('\n')}\n\nThis action cannot be undone.`;
    if (confirm(confirmMsg)) {
        gradeOneContent.lessons = gradeOneContent.lessons.filter(lesson => !lessonsToDelete.includes(lesson.name));
        lessonsModified = true;
        saveLessonsToStorage();
        exitDeleteMode();
        updateLessonSelect();
        alert(`${lessonsToDelete.length} lesson(s) deleted successfully.`);
    }
}

function setupDeleteModeListeners() {
    console.log('[DEBUG] Setting up delete mode listeners');
    confirmDeleteButton.removeEventListener('click', confirmDeleteLessons);
    confirmDeleteButton.addEventListener('click', confirmDeleteLessons);
    cancelDeleteButton.removeEventListener('click', exitDeleteMode);
    cancelDeleteButton.addEventListener('click', exitDeleteMode);
    selectAllCheckbox.removeEventListener('change', handleSelectAllChange);
    selectAllCheckbox.addEventListener('change', handleSelectAllChange);
    lessonCheckboxList.removeEventListener('change', updateConfirmButtonState);
    lessonCheckboxList.addEventListener('change', updateConfirmButtonState);
}

// Lesson Display and Sync
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

function displaySelectedLesson(lesson) {
    const startTime = performance.now();
    console.log(`[DEBUG] Starting displaySelectedLesson for lesson: ${lesson.name}`);

    if (!lesson) {
        console.log('[DEBUG] No lesson provided to displaySelectedLesson');
        clearDisplayArea();
        disableActionButtons();
        return;
    }

    // Save the selected lesson to localStorage
    try {
        localStorage.setItem('selectedLesson', JSON.stringify(lesson));
        console.log('[DEBUG] Saved selected lesson to localStorage:', lesson.name);
    } catch (error) {
        console.error('[ERROR] Failed to save selected lesson to localStorage:', error);
    }

    // Dispatch the lessonSelected event to the parent window
    try {
        const event = new CustomEvent('lessonSelected', { detail: lesson });
        window.parent.dispatchEvent(event);
        console.log(`[DEBUG] Dispatched lessonSelected event for lesson: ${lesson.name}`);
    } catch (error) {
        console.error('[ERROR] Failed to dispatch lessonSelected event:', error);
    }

    lessonDisplayArea.style.display = 'block';
    const standardsContainer = document.getElementById('standardsAlignmentContainer');
    if (standardsContainer) {
        standardsContainer.style.display = 'block';
    } else {
        console.warn('[DEBUG] standardsAlignmentContainer not found in DOM');
    }

    lessonTitleDisplay.textContent = lesson.name;
    subjectDisplay.textContent = lesson.subject ? `Subject: ${lesson.subject}` : ''; // New display
    teacherNameDisplay.textContent = lesson.teacher ? `Teacher: ${lesson.teacher}` : '';
    lastUpdated.textContent = `Last Updated: ${lesson.lastUpdated || 'N/A'}`;

    const getText = (value, defaultText = 'Not specified') => value || defaultText;
    const populateList = (listElement, items, defaultText = '<li>None specified</li>') => {
        const fragment = document.createDocumentFragment();
        if (items?.length) {
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                fragment.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.innerHTML = defaultText;
            fragment.appendChild(li);
        }
        listElement.innerHTML = '';
        listElement.appendChild(fragment);
    };
    const populateTags = (tagElement, items, tagClass = 'tag', defaultText = '<span>None specified</span>') => {
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
            span.innerHTML = defaultText;
            fragment.appendChild(span);
        }
        tagElement.innerHTML = '';
        tagElement.appendChild(fragment);
    };
    const populateLinks = (linkElement, links, defaultText = '<span>None specified</span>') => {
        const fragment = document.createDocumentFragment();
        if (links?.length) {
            links.forEach(link => {
                const url = (link.startsWith('http://') || link.startsWith('https://')) ? link : `https://${link}`;
                const a = document.createElement('a');
                a.href = url;
                a.textContent = link;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                fragment.appendChild(a);
                fragment.appendChild(document.createElement('br'));
            });
        } else {
            const span = document.createElement('span');
            span.innerHTML = defaultText;
            fragment.appendChild(span);
        }
        linkElement.innerHTML = '';
        linkElement.appendChild(fragment);
    };
    function createImageElement(src, alt) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.onerror = () => { 
            console.warn(`[DEBUG] Image failed to load: ${src}`);
            img.alt = `${alt} (Error)`; 
            img.style.border = '1px solid red'; 
        };
        return img;
    }

    // Add 5E Timeline Navigation
    if (!lessonDisplayArea.querySelector('.lesson-timeline')) {
        const timeline = document.createElement('div');
        timeline.className = 'lesson-timeline';
        timeline.innerHTML = `
            <div class="timeline-step" data-stage="engage"><span class="icon">💡</span>Engage</div>
            <div class="timeline-step" data-stage="explore"><span class="icon">🔍</span>Explore</div>
            <div class="timeline-step" data-stage="explain"><span class="icon">📝</span>Explain</div>
            <div class="timeline-step" data-stage="elaborate"><span class="icon">🛠️</span>Elaborate</div>
            <div class="timeline-step" data-stage="evaluate"><span class="icon">✅</span>Evaluate</div>
        `;
        lessonDisplayArea.insertBefore(timeline, lessonDisplayArea.firstChild);

        timeline.querySelectorAll('.timeline-step').forEach(step => {
            step.addEventListener('click', () => {
                const stage = step.dataset.stage;
                const section = document.getElementById(`${stage}Content`).parentElement;
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                    console.log(`[DEBUG] Navigated to ${stage} section`);
                } else {
                    console.warn(`[DEBUG] Section ${stage}Content not found`);
                }
            });
        });
    }

    engageContent.textContent = getText(lesson.structure?.engage);
    exploreContent.textContent = getText(lesson.structure?.explore);
    explainContent.textContent = getText(lesson.structure?.explain);
    elaborateContent.textContent = getText(lesson.structure?.elaborate);
    evaluateContent.textContent = getText(lesson.structure?.evaluate);

    populateList(learningObjectivesList, lesson.objectives?.learningObjectives);
    populateTags(standardsAlignmentDisplay, lesson.objectives?.standardsAlignment, 'tag standard-tag-view', '<span>N/A</span>');

    populateList(materialsNeededList, lesson.resources?.materialsNeeded);
    populateTags(keyVocabularyTags, lesson.resources?.keyVocabulary);
    populateLinks(supplementaryLinksList, lesson.resources?.supplementaryLinks);

    const resourceFragment = document.createDocumentFragment();
    if (lesson.resources?.images?.length) {
        lesson.resources.images.forEach((imgData, i) => {
            resourceFragment.appendChild(createImageElement(imgData, `Resource ${i + 1}`));
        });
    } else {
        const span = document.createElement('span');
        span.className = 'no-preview';
        span.textContent = 'No images uploaded.';
        resourceFragment.appendChild(span);
    }
    resourcePreview.innerHTML = '';
    resourcePreview.appendChild(resourceFragment);

    const iconFragment = document.createDocumentFragment();
    if (lesson.lessonIcon) {
        iconFragment.appendChild(createImageElement(lesson.lessonIcon, 'Lesson Icon'));
    } else {
        const span = document.createElement('span');
        span.className = 'no-preview';
        span.textContent = 'No icon uploaded.';
        iconFragment.appendChild(span);
    }
    lessonIconPreview.innerHTML = '';
    lessonIconPreview.appendChild(iconFragment);

    console.log('[DEBUG] Lesson models:', lesson.models);
    const modelFragment = document.createDocumentFragment();
    if (lesson.models?.length) {
        lesson.models.forEach((model, index) => {
            console.log('[DEBUG] Rendering model:', model.name, model.src);
            const modelDiv = document.createElement('div');
            modelDiv.className = 'model-item';
            const canPreview = model.src && (model.src.startsWith('blob:') || model.src.startsWith('http') || model.src.startsWith('https'));
            const safeModelName = model.name.replace(/'/g, "\\'").replace(/"/g, '"');
            modelDiv.innerHTML = `
                <span class="model-name" title="${model.name}">${model.name}</span>
                <button type="button" class="preview-action-button" 
                    ${!canPreview ? 'disabled title="Preview requires a valid model URL"' : ''} 
                    onclick="${canPreview ? `previewModel('${model.src}', '${safeModelName}')` : ''}">
                    Preview
                </button>
            `;
            modelFragment.appendChild(modelDiv);
        });
    } else {
        const span = document.createElement('span');
        span.className = 'no-preview';
        span.textContent = 'No models associated.';
        modelFragment.appendChild(span);
    }
    modelPreview.innerHTML = '';
    modelPreview.appendChild(modelFragment);

    teacherNotesContent.textContent = getText(lesson.notes?.teacherNotes, 'No notes added.');

    enableActionButtons();
    setupEventListeners();

    console.log(`[DEBUG] Finished displaySelectedLesson for lesson: ${lesson.name}. Total time: ${(performance.now() - startTime).toFixed(2)}ms`);
}

function clearDisplayArea() {
    lessonDisplayArea.style.display = 'none';
    lessonTitleDisplay.textContent = '[Lesson Name]';
    teacherNameDisplay.textContent = '';
    lastUpdated.textContent = 'Last Updated: [Timestamp]';
    const standardsContainer = document.getElementById('standardsAlignmentContainer');
    if (standardsContainer) {
        standardsContainer.style.display = 'none';
    }
    disableActionButtons();
}

function renderLessonCheckboxes() {
    console.log('[DEBUG] Rendering lesson checkboxes');
    if (!lessonCheckboxList) {
        console.error('[ERROR] lessonCheckboxList element not found');
        return;
    }
    console.log('[DEBUG] Lessons to render:', gradeOneContent.lessons);
    lessonCheckboxList.innerHTML = '';
    if (!gradeOneContent.lessons.length) {
        lessonCheckboxList.innerHTML = '<p>No lessons available to delete.</p>';
        console.log('[DEBUG] No lessons to render');
        return;
    }
    const fragment = document.createDocumentFragment();
    gradeOneContent.lessons.forEach((lesson, index) => {
        console.log('[DEBUG] Adding checkbox for lesson:', lesson.name);
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="lessonCheckbox${index}" value="${lesson.name}">
            <label for="lessonCheckbox${index}">${lesson.name}</label>
        `;
        fragment.appendChild(div);
    });
    lessonCheckboxList.appendChild(fragment);
    console.log('[DEBUG] Checkboxes rendered:', lessonCheckboxList.children.length);
}

function updateLessonSelect() {
    const currentVal = lessonSelect.value;
    lessonSelect.innerHTML = `<option value="">Select a lesson</option>`;
    const sortedLessons = [...gradeOneContent.lessons].sort((a, b) => a.name.localeCompare(b.name));
    sortedLessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.name;
        option.textContent = lesson.name;
        lessonSelect.appendChild(option);
    });

    const lessonExists = gradeOneContent.lessons.some(l => l.name === currentVal);
    lessonSelect.value = lessonExists ? currentVal : '';
    if (!lessonExists && selectedLesson) {
        selectedLesson = null;
        clearDisplayArea();
    }
}

// GitHub Upload Functions
async function uploadModelToGitHub(file, repoPath = 'Science/grade_one/models/') {
    const GITHUB_TOKEN = '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';
    const OWNER = 'Bedo77';
    const REPO = '3d-model-viewer';

    const PATH = `${repoPath}${file.name}`;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const base64Content = reader.result.split(',')[1];
            const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
            let sha = null;

            try {
                const res = await fetch(url, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
                });
                if (res.ok) {
                    sha = (await res.json()).sha;
                    console.log(`[DEBUG] File ${file.name} already exists on GitHub, updating with SHA: ${sha}`);
                } else if (res.status === 404) {
                    console.log(`[DEBUG] File ${file.name} not found on GitHub, treating as new upload.`);
                } else {
                    throw new Error(`Unexpected response: ${res.status} ${await res.text()}`);
                }
            } catch (e) {
                console.error(`[ERROR] Failed to check if ${file.name} exists on GitHub:`, e);
                reject(e);
                return;
            }

            const payload = {
                message: `Upload ${file.name} via Lesson Plan App`,
                content: base64Content
            };
            if (sha) payload.sha = sha;

            try {
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[ERROR] Failed to upload ${file.name} to GitHub: ${response.status}`, errorText);
                    throw new Error(`GitHub API error: ${errorText}`);
                }
                const data = await response.json();
                console.log(`[DEBUG] Successfully uploaded ${file.name} to GitHub. Download URL: ${data.content.download_url}`);
                resolve(data.content.download_url);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => {
            console.error(`[ERROR] Failed to read file ${file.name}`);
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}

async function uploadLessonsToGitHub(lessons) {
    const GITHUB_TOKEN = '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';
    const OWNER = 'Bedo77';
    const REPO = '3d-model-viewer';
    const BASE_PATH = 'Science/grade_one/savedLessons/';

    for (const lesson of lessons) {
        const fileName = `${lesson.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`; // Sanitize filename
        const PATH = `${BASE_PATH}${fileName}`;
        const base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(lesson, null, 2))));
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const payload = {
            message: `Update lesson ${lesson.name} via Lesson Plan App (${new Date().toLocaleString()})`,
            content: base64Content,
            sha: await getFileSha(url)
        };

        async function getFileSha(fileUrl) {
            const res = await fetch(fileUrl, {
                headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
            });
            return res.ok ? (await res.json()).sha : null;
        }

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Failed to upload lesson ${lesson.name}: ${await response.text()}`);
            console.log(`[DEBUG] Lesson ${lesson.name} uploaded to GitHub: ${PATH}`);
        } catch (error) {
            console.error(`[ERROR] Failed to upload lesson ${lesson.name}:`, error);
        }
    }
    console.log('[DEBUG] All lessons uploaded to GitHub');
}

async function loadModelsFromGitHub() {
    const GITHUB_TOKEN = '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';
    const OWNER = 'Bedo77';
    const REPO = '3d-model-viewer';
    const PATH = 'Science/grade_one/models/';

    try {
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('[DEBUG] Models directory not found on GitHub. Starting with empty availableModels.');
                return;
            }
            throw new Error(`GitHub API error: ${await response.text()}`);
        }

        const files = await response.json();
        const modelFiles = files.filter(file => file.name.endsWith('.glb') || file.name.endsWith('.gltf'));
        availableModels = modelFiles.map(file => ({
            name: file.name,
            src: file.download_url,
            base64: null
        }));
        console.log('[DEBUG] Loaded models from GitHub:', availableModels);
    } catch (error) {
        console.error('[ERROR] Failed to load models from GitHub:', error.message);
    }
}

async function loadLessonsFromGitHub() {
    const GITHUB_TOKEN = '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';
    const OWNER = 'Bedo77';
    const REPO = '3d-model-viewer';
    const PATH = 'Science/grade_one/savedLessons/';

    try {
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('[DEBUG] Saved lessons directory not found on GitHub. Starting with empty lessons.');
                return [];
            }
            throw new Error(`GitHub API error: ${await response.text()}`);
        }

        const files = await response.json();
        const lessonFiles = files.filter(file => file.name.endsWith('.json'));
        const lessons = [];

        for (const file of lessonFiles) {
            const fileUrl = file.download_url;
            const fileResponse = await fetch(fileUrl);
            if (fileResponse.ok) {
                const content = await fileResponse.text();
                const lesson = JSON.parse(content);
                lessons.push(lesson);
                console.log(`[DEBUG] Loaded lesson from GitHub: ${file.name}`);
            } else {
                console.error(`[ERROR] Failed to load lesson file ${file.name}: ${fileResponse.status}`);
            }
        }

        console.log('[DEBUG] Loaded lessons from GitHub:', lessons);
        return lessons;
    } catch (error) {
        console.error('[ERROR] Failed to load lessons from GitHub:', error.message);
        return [];
    }
}

// File Handling
async function handleModelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
        alert('Please upload a valid 3D model file (.glb or .gltf).');
        return;
    }
    const maxFileSize = 100 * 1024 * 1024;
    console.log(`[DEBUG] Processing file ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    if (file.size > maxFileSize) {
        alert(`Model file exceeds ${maxFileSize / (1024 * 1024)}MB limit.`);
        return;
    }

    try {
        showLoadingBar(file.name, 'model'); // Removed "Uploading model:" prefix
        updateLoadingBar(10, 'model'); // Initial progress

        // Simulate progress during upload
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing delay
        updateLoadingBar(50, 'model'); // Mid-point progress

        const githubUrl = await uploadModelToGitHub(file);
        updateLoadingBar(90, 'model'); // Near completion

        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate final processing
        updateLoadingBar(100, 'model'); // Complete

        tempModelData.push({ name: file.name, src: githubUrl, base64: null });
        renderModalPreviews();
    } catch (error) {
        console.error(`[ERROR] Failed to upload model ${file.name}:`, error);
        alert(`Failed to upload model: ${error.message}`);
    } finally {
        hideLoadingBar(false, 'model');
        resetFileInputs();
    }
}

function handleImageUpload(event) {
    handleFileUpload(event, 'image/', tempImageData, renderModalPreviews);
}

function handleLessonIconUpload(event) {
    handleFileUpload(event, 'image/', null, (result) => {
        tempIconData = result;
        renderModalPreviews();
    });
}

function handleFileUpload(event, fileTypePrefix, targetArray, renderOrUpdateCallback) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith(fileTypePrefix)) {
        alert(`Please select a valid ${fileTypePrefix.replace('/', '')} file.`);
        resetFileInputs();
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        const result = e.target.result;
        if (targetArray) {
            targetArray.push(result);
            renderOrUpdateCallback();
        } else {
            renderOrUpdateCallback(result);
        }
        resetFileInputs();
    };
    reader.onerror = () => {
        alert('Error reading file.');
        resetFileInputs();
    };
    reader.readAsDataURL(file);
}

// Show loading bar with context
function showLoadingBar(message = 'Uploading...', context = 'model') {
    console.log('[DEBUG] Showing loading bar with message:', message, 'context:', context);
    let loadingBarContainer, loadingBar, loadingText;

    if (context === 'model') {
        loadingBarContainer = modelLoadingBarContainer;
        loadingBar = modelLoadingBar;
        loadingText = modelLoadingText;
    } else if (context === 'bulk-model') {
        loadingBarContainer = bulkModelLoadingBarContainer;
        loadingBar = bulkModelLoadingBar;
        loadingText = bulkModelLoadingText;
    } else if (context === 'bulk-lesson') {
        loadingBarContainer = bulkLessonLoadingBarContainer;
        loadingBar = bulkLessonLoadingBar;
        loadingText = bulkLessonLoadingText;
    }

    loadingText.textContent = message;
    loadingBar.style.setProperty('--progress', '0%');
    loadingBarContainer.classList.add('visible');
    loadingBarContainer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Update loading bar progress with context
function updateLoadingBar(progress, context = 'model') {
    console.log('[DEBUG] Updating loading bar progress:', progress, 'context:', context);
    let loadingBar;
    if (context === 'model') {
        loadingBar = modelLoadingBar;
    } else if (context === 'bulk-model') {
        loadingBar = bulkModelLoadingBar;
    } else if (context === 'bulk-lesson') {
        loadingBar = bulkLessonLoadingBar;
    }
    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    loadingBar.style.setProperty('--progress', `${clampedProgress}%`);
    loadingBar.setAttribute('aria-valuenow', clampedProgress);
    console.log('[DEBUG] Loading bar progress updated to:', clampedProgress);
}

// Hide loading bar with context
function hideLoadingBar(force = false, context = 'model') {
    console.log('[DEBUG] Hiding loading bar, force:', force, 'context:', context);
    let loadingBarContainer;
    if (context === 'model') {
        loadingBarContainer = modelLoadingBarContainer;
    } else if (context === 'bulk-model') {
        loadingBarContainer = bulkModelLoadingBarContainer;
    } else if (context === 'bulk-lesson') {
        loadingBarContainer = bulkLessonLoadingBarContainer;
    }

    if (force) {
        loadingBarContainer.classList.remove('visible');
        loadingBarContainer.style.display = 'none';
        document.body.style.overflow = '';
    } else {
        loadingBarContainer.classList.remove('visible');
        setTimeout(() => {
            loadingBarContainer.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

// [Continued from Part 1]

async function handleBulkModelUpload(event) {
    console.log('[DEBUG] handleBulkModelUpload triggered');
    const files = Array.from(event.target.files);
    const statusElement = document.getElementById('bulkUploadStatus');
    if (!statusElement) {
        console.error('[ERROR] bulkUploadStatus element not found');
        return;
    }

    if (!files.length) {
        statusElement.textContent = 'No models uploaded.';
        statusElement.className = 'bulk-status error';
        return;
    }

    const maxFileSize = 100 * 1024 * 1024;
    const invalidFiles = [];
    const validFiles = files.filter(file => {
        if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
            invalidFiles.push({ name: file.name, reason: 'Invalid format (must be .glb or .gltf)' });
            return false;
        }
        if (file.size > maxFileSize) {
            invalidFiles.push({ name: file.name, reason: `File exceeds ${maxFileSize / (1024 * 1024)}MB limit` });
            return false;
        }
        return true;
    });

    if (!validFiles.length) {
        statusElement.textContent = 'No valid models to upload:\n' + invalidFiles.map(f => `${f.name}: ${f.reason}`).join('\n');
        statusElement.className = 'bulk-status error';
        return;
    }

    statusElement.textContent = `Processing ${validFiles.length} model(s)...`;
    statusElement.className = 'bulk-status';

    try {
        showLoadingBar(`Bulk Models...`, 'bulk-model'); // Updated message
        let progress = 0;

        // Phase 1: 0% to 30% over exactly 1 second
        const initialStart = Date.now();
        const initialDuration = 1000; // 1 second
        const initialPromise = new Promise(resolve => {
            const initialInterval = setInterval(() => {
                const elapsed = Date.now() - initialStart;
                progress = Math.min((elapsed / initialDuration) * 30, 30);
                updateLoadingBar(progress, 'bulk-model');
                if (elapsed >= initialDuration) {
                    clearInterval(initialInterval);
                    updateLoadingBar(30, 'bulk-model');
                    resolve();
                }
            }, 50); // Update every 50ms for smoothness
        });

        // Prepare uploads
        const uploadPromises = validFiles.map(file => uploadModelToGitHub(file));
        await initialPromise; // Wait for 1s initial phase

        // Phase 2: 30% to 90% based on upload progress
        const uploadResults = await Promise.allSettled(uploadPromises);
        const progressPerFile = 60 / validFiles.length; // 60% distributed across files
        let currentProgress = 30;
        const successfulUploads = [];
        const failedUploads = [];

        uploadResults.forEach((result, i) => {
            currentProgress += progressPerFile;
            updateLoadingBar(Math.min(currentProgress, 90), 'bulk-model'); // Cap at 90%
            if (result.status === 'fulfilled') {
                const url = result.value;
                successfulUploads.push(validFiles[i]);
                const model = { name: validFiles[i].name, src: url, base64: null };
                availableModels.push(model);
                tempModelData.push(model);
            } else {
                failedUploads.push({ name: validFiles[i].name, reason: result.reason?.message || 'Upload failed' });
            }
        });

        // Phase 3: 90% to 100% over exactly 500ms
        const finalStart = Date.now();
        const finalDuration = 500; // 500ms
        await new Promise(resolve => {
            const finalInterval = setInterval(() => {
                const elapsed = Date.now() - finalStart;
                progress = 90 + Math.min((elapsed / finalDuration) * 10, 10); // 10% over 500ms
                updateLoadingBar(progress, 'bulk-model');
                if (elapsed >= finalDuration) {
                    clearInterval(finalInterval);
                    updateLoadingBar(100, 'bulk-model');
                    resolve();
                }
            }, 50); // Update every 50ms
        });

        renderModalPreviews();

        // Set status message
        let statusMessage;
        if (failedUploads.length === 0) {
            statusMessage = `${successfulUploads.length} model(s) uploaded successfully.`;
            statusElement.className = 'bulk-status success';
        } else {
            statusMessage = `${successfulUploads.length} model(s) uploaded successfully.\nFailed uploads:\n` +
                failedUploads.map(f => `${f.name}: ${f.reason}`).join('\n');
            statusElement.className = 'bulk-status warning';
        }
        statusElement.textContent = statusMessage;

        // Clear status after 5 seconds or on interaction
        const clearStatusTimeout = setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'bulk-status';
        }, 5000);

        const clearStatusOnInteraction = () => {
            clearTimeout(clearStatusTimeout);
            statusElement.textContent = '';
            statusElement.className = 'bulk-status';
            document.removeEventListener('click', clearStatusOnInteraction);
            document.removeEventListener('input', clearStatusOnInteraction);
        };
        document.addEventListener('click', clearStatusOnInteraction);
        document.addEventListener('input', clearStatusOnInteraction);
    } catch (error) {
        console.error('[ERROR] Unexpected error during bulk upload:', error);
        statusElement.textContent = `Unexpected error: ${error.message}`;
        statusElement.className = 'bulk-status error';
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'bulk-status';
        }, 5000);
    } finally {
        hideLoadingBar(false, 'bulk-model');
        resetFileInputs();
    }
}

async function deleteModelFromGitHub(modelPath) {
    const GITHUB_TOKEN = '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';
    const OWNER = 'Bedo77';
    const REPO = '3d-model-viewer';
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${modelPath}`;

    // Get SHA of the file to delete
    const shaResponse = await fetch(url, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (!shaResponse.ok) {
        if (shaResponse.status === 404) {
            console.log(`[DEBUG] Model ${modelPath} not found on GitHub, skipping deletion.`);
            return;
        }
        throw new Error(`Failed to get SHA for ${modelPath}: ${await shaResponse.text()}`);
    }
    const { sha } = await shaResponse.json();

    // Delete the file
    const deleteResponse = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Delete model ${modelPath.split('/').pop()} via Lesson Plan App`,
            sha: sha
        })
    });

    if (!deleteResponse.ok) {
        throw new Error(`Failed to delete ${modelPath}: ${await deleteResponse.text()}`);
    }
    console.log(`[DEBUG] Deleted model from GitHub: ${modelPath}`);
}

async function handleBulkLessonsUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.csv')) {
        alert('Please upload a valid CSV file.');
        resetFileInputs();
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n').filter(row => row && !row.startsWith('#'));
        if (rows.length < 1) {
            alert('The CSV file is empty or does not contain valid data.');
            return;
        }

        const headers = rows[0].split(',').map(header => header.trim());
        const expectedHeaders = [
            'Lesson Name', 'Grade', 'Subject', 'Teacher', 'Icon URL',
            'Lesson Objectives', 'Engage', 'Explore', 'Explain', 'Elaborate', 'Evaluate',
            'Vocabulary', 'Materials', 'Standards', 'Supplementary Links', 'Teacher Notes', 'Models'
        ];
        if (!headers.every((header, index) => header === expectedHeaders[index])) {
            alert('The CSV file headers do not match the expected format. Please download the template and use it as a guide.');
            return;
        }

        const lessonsData = [];
        for (let i = 1; i < rows.length; i++) {
            const row = parseCsvRow(rows[i]);
            if (row.length === headers.length) {
                lessonsData.push(row);
            }
        }

        const newLessons = [];
        const errors = [];
        const warnings = [];

        try {
            showLoadingBar(`Bulk Lessons...`, 'bulk-lesson'); // Updated message
            updateLoadingBar(10, 'bulk-lesson'); // Initial progress

            lessonsData.forEach((row, i) => {
                const progressPerLesson = 80 / lessonsData.length; // Distribute 80% across all lessons
                const currentProgress = (i * progressPerLesson) + 10; // Start from 10%
                updateLoadingBar(currentProgress, 'bulk-lesson');

                const lesson = { objectives: {}, structure: {}, resources: {}, notes: {}, models: [] };
                headers.forEach((header, j) => {
                    const value = row[j] || '';
                    switch (header) {
                        case 'Lesson Name': lesson.name = value; break;
                        case 'Subject': lesson.subject = value; break; // Ensure stored
                        case 'Teacher': lesson.teacher = value; break;
                        case 'Icon URL': lesson.lessonIcon = value; break;
                        case 'Lesson Objectives':
                            lesson.objectives.learningObjectives = value.split(',').map(v => v.trim()).filter(Boolean);
                            break;
                        case 'Engage': lesson.structure.engage = value; break;
                        case 'Explore': lesson.structure.explore = value; break;
                        case 'Explain': lesson.structure.explain = value; break;
                        case 'Elaborate': lesson.structure.elaborate = value; break;
                        case 'Evaluate': lesson.structure.evaluate = value; break;
                        case 'Vocabulary':
                            lesson.resources.keyVocabulary = value.split(',').map(v => v.trim()).filter(Boolean);
                            break;
                        case 'Materials':
                            lesson.resources.materialsNeeded = value.split(',').map(v => v.trim()).filter(Boolean);
                            break;
                        case 'Standards':
                            lesson.objectives.standardsAlignment = value.split(',').map(v => v.trim()).filter(Boolean);
                            break;
                        case 'Supplementary Links':
                            lesson.resources.supplementaryLinks = value.split(',').map(v => v.trim()).filter(Boolean);
                            break;
                        case 'Teacher Notes': lesson.notes.teacherNotes = value; break;
                        case 'Models':
                            const modelNames = value.split(',').map(v => v.trim()).filter(Boolean);
                            modelNames.forEach((modelName, idx) => {
                                const normalizedModelName = modelName.toLowerCase().replace(/[_-]/g, '').replace(/\s+/g, '');
                                const model = availableModels.find(m => {
                                    const normalizedAvailableName = m.name.replace(/\.(glb|gltf)$/, '').toLowerCase().replace(/[_-]/g, '').replace(/\s+/g, '');
                                    return normalizedAvailableName.includes(normalizedModelName) || normalizedModelName.includes(normalizedAvailableName);
                                });
                                if (!model && modelName) {
                                    warnings.push(`Row ${i + 2}: Model "${modelName}" not found.`);
                                } else if (model) {
                                    lesson.models.push(model);
                                }
                            });
                            break;
                    }
                });

                if (!lesson.name) {
                    errors.push(`Row ${i + 2}: Lesson Name is required.`);
                    return;
                }

                lesson.lastUpdated = new Date().toLocaleString();
                lesson.resources.images = [];
                newLessons.push(lesson);
            });

            if (errors.length > 0) {
                alert('Errors found in CSV:\n\n' + errors.join('\n'));
                return;
            }

            const duplicates = newLessons.filter(l => gradeOneContent.lessons.some(el => el.name.toLowerCase() === l.name.toLowerCase()));
            if (duplicates.length) {
                warnings.push(`Duplicate lessons skipped: ${duplicates.map(l => l.name).join(', ')}`);
            }

            const uniqueLessons = newLessons.filter(l => !duplicates.some(d => d.name === l.name));
            updateLoadingBar(90, 'bulk-lesson'); // Near completion

            gradeOneContent.lessons.push(...uniqueLessons);
            lessonsModified = true;
            await saveLessonsToStorage();
            updateLoadingBar(100, 'bulk-lesson'); // Complete

            updateLessonSelect();

            let message = `${uniqueLessons.length} lesson(s) imported successfully!`;
            if (warnings.length > 0) {
                message += '\n\nWarnings:\n' + warnings.join('\n');
            }
            alert(message);
        } catch (error) {
            console.error('[ERROR] Failed to import lessons:', error);
            alert(`Failed to import lessons: ${error.message}`);
        } finally {
            hideLoadingBar(false, 'bulk-lesson');
        }
    };
    reader.readAsText(file);
    resetFileInputs();
}

function parseCsvRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}

function downloadCsvTemplate() {
    const headers = [
        'Lesson Name', 'Grade', 'Subject', 'Teacher', 'Icon URL',
        'Lesson Objectives', 'Engage', 'Explore', 'Explain', 'Elaborate', 'Evaluate',
        'Vocabulary', 'Materials', 'Standards', 'Supplementary Links', 'Teacher Notes', 'Models'
    ];
    const instructions = [
        '# Instructions for Bulk Lesson Upload',
        '# - Each row represents one lesson.',
        '# - Use \\n for line breaks within fields, wrap in quotes if needed.',
        '# - Separate multiple items with ", " (comma and space).',
        '# - Models must be uploaded first.',
        '# Example row:'
    ];
    const sampleRow = [
        'Sample Lesson', 'Grade 1', 'Physics', 'Ms. Smith', 'https://example.com/icon.png',
        'Identify forces, Understand motion',
        'Show a video.', 'Explore materials.', 'Discuss findings.', 'Create a project.', 'Quiz.',
        'force, motion', 'paper, glue', 'NGSS 1-PS4-1', 'https://example.com', 'Notes here.', 'gravity'
    ];
    const csvContent = [
        instructions.join('\n'),
        '',
        headers.join(','),
        sampleRow.map(item => `"${item}"`).join(',')
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'lesson_plan_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Model Preview
function previewModel(modelSrc, modelName) {
    console.log(`[DEBUG] Previewing model: ${modelName}, src: ${modelSrc}`);
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
                style="width: 100%; height: 400px;"
            >
                <div slot="progress-bar" class="model-loading">Loading model...</div>
                <div slot="poster" class="model-error" style="display: none;">Failed to load model.</div>
            </model-viewer>
        </div>
    `;
    document.body.appendChild(modal);

    const modelViewer = modal.querySelector('model-viewer');
    const loadingSlot = modal.querySelector('.model-loading');
    const errorSlot = modal.querySelector('.model-error');
    let isLoadingResolved = false;

    const hideLoadingLabel = () => {
        if (!isLoadingResolved) {
            console.log(`[DEBUG] Hiding loading label for model: ${modelName}`);
            loadingSlot.style.display = 'none';
            isLoadingResolved = true;
        }
    };

    modelViewer.addEventListener('load', () => {
        console.log(`[DEBUG] Model ${modelName} loaded`);
        hideLoadingLabel();
    }, { once: true });

    modelViewer.addEventListener('error', (e) => {
        console.error(`[ERROR] Failed to load model ${modelName}:`, e);
        hideLoadingLabel();
        errorSlot.style.display = 'block';
    }, { once: true });

    setTimeout(() => {
        if (!isLoadingResolved) {
            console.warn(`[WARN] Model loading timed out for: ${modelName}`);
            hideLoadingLabel();
            errorSlot.style.display = 'block';
            errorSlot.textContent = 'Model loading timed out. The file may be unavailable or unsupported.';
        }
    }, 10000); // 10 seconds

    modal.querySelector('.model-preview-close').onclick = () => {
        document.body.removeChild(modal);
    };
}

function renderModalPreviews() {
    modalResourcePreview.innerHTML = tempImageData.length ? tempImageData.map((imgData, index) => `
        <div class="preview-item image-preview-item">
            <img src="${imgData}" alt="Image Preview ${index + 1}">
            <button type="button" class="remove-preview-button" onclick="removeTempImage(${index})" title="Remove Image">×</button>
        </div>
    `).join('') : '<span class="no-preview">No images added yet.</span>';

    modalModelPreview.innerHTML = tempModelData.length ? tempModelData.map((model, index) => {
        const canPreview = model.src && (model.src.startsWith('blob:') || model.src.startsWith('http') || model.src.startsWith('https'));
        const safeModelName = model.name.replace(/'/g, "\\'").replace(/"/g, '"');
        return `
            <div class="model-item-preview">
                <span class="model-name" title="${model.name}">${model.name}</span>
                <div class="model-actions">
                    <button type="button" class="preview-action-button" 
                        ${!canPreview ? 'disabled' : ''} 
                        onclick="${canPreview ? `previewModel('${model.src}', '${safeModelName}')` : ''}">
                        Preview
                    </button>
                    <button type="button" class="remove-preview-button" onclick="removeTempModel(${index})" title="Remove Model">×</button>
                </div>
            </div>
        `;
    }).join('') : '<span class="no-preview">No models added yet.</span>';

    modalLessonIconPreview.innerHTML = tempIconData ? `
        <div class="preview-item icon-preview-item">
            <img src="${tempIconData}" alt="Icon Preview">
            <button type="button" class="remove-preview-button" onclick="removeTempIcon()" title="Remove Icon">×</button>
        </div>
    ` : '<span class="no-preview">No icon added.</span>';
}

function removeTempImage(index) {
    tempImageData.splice(index, 1);
    renderModalPreviews();
}

function removeTempModel(index) {
    if (tempModelData[index].src?.startsWith('blob:')) URL.revokeObjectURL(tempModelData[index].src);
    tempModelData.splice(index, 1);
    renderModalPreviews();
}

function removeTempIcon() {
    if (tempIconData?.startsWith('blob:')) URL.revokeObjectURL(tempIconData);
    tempIconData = null;
    renderModalPreviews();
}

// Event Listeners
function setupEventListeners() {
    console.log('[DEBUG] Setting up event listeners');
    document.querySelectorAll('.action-button').forEach(button => {
        button.removeEventListener('click', handleButtonClick);
        button.addEventListener('click', handleButtonClick);
    });

    lessonSelect.removeEventListener('change', syncLessonPlan);
    lessonSelect.addEventListener('change', syncLessonPlan);

    imageUploadInput.removeEventListener('change', handleImageUpload);
    imageUploadInput.addEventListener('change', handleImageUpload);

    modelUploadInput.removeEventListener('change', handleModelUpload);
    modelUploadInput.addEventListener('change', handleModelUpload);

    lessonIconUploadInput.removeEventListener('change', handleLessonIconUpload);
    lessonIconUploadInput.addEventListener('change', handleLessonIconUpload);

    bulkModelUploadInput.removeEventListener('change', handleBulkModelUpload);
    bulkModelUploadInput.addEventListener('change', handleBulkModelUpload);

    bulkLessonsUploadInput.removeEventListener('change', handleBulkLessonsUpload);
    bulkLessonsUploadInput.addEventListener('change', handleBulkLessonsUpload);

    standardsAlignmentInput.removeEventListener('change', handleStandardsChange);
    standardsAlignmentInput.addEventListener('change', handleStandardsChange);

    downloadTemplateButton.removeEventListener('click', downloadCsvTemplate);
    downloadTemplateButton.addEventListener('click', downloadCsvTemplate);

    removeLessonButton.removeEventListener('click', removeLesson);
    removeLessonButton.addEventListener('click', removeLesson);
}

function handleButtonClick(event) {
    const buttonId = event.target.id;
    console.log('[DEBUG] Button clicked:', buttonId);
    switch (buttonId) {
        case 'createLessonButton': openCreateModal(); break;
        case 'editLessonButton': openEditModal(); break;
        case 'printButton': printLesson(); break;
        case 'exportButton': exportLesson(); break;
        case 'removeLessonButton': removeLesson(); break;
        case 'downloadTemplateButton': downloadCsvTemplate(); break;
        case 'backToTopButton': scrollToTop(); break;
        case 'addCustomStandardButton': addCustomStandard(); break;
    }
}

function handleStandardsChange(event) {
    const value = event.target.value.trim();
    if (value && !tempStandards.includes(value)) {
        tempStandards.push(value);
        renderStandardsInModal();
    }
    event.target.value = '';
}

function handleSelectAllChange(event) {
    const isChecked = event.target.checked;
    lessonCheckboxList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = isChecked);
    updateConfirmButtonState();
}

function updateConfirmButtonState() {
    const anyChecked = lessonCheckboxList.querySelectorAll('input[type="checkbox"]:checked').length > 0;
    confirmDeleteButton.disabled = !anyChecked;
}

// Standards Management
function addCustomStandard() {
    const customStandard = customStandardInput.value.trim();
    if (!customStandard) {
        alert('Please enter a custom standard.');
        customStandardInput.focus();
        return;
    }
    if (tempStandards.includes(customStandard)) {
        alert('This standard is already added.');
        customStandardInput.focus();
        return;
    }
    tempStandards.push(customStandard);
    renderStandardsInModal();
    customStandardInput.value = '';
}

function removeStandard(standard) {
    tempStandards = tempStandards.filter(s => s !== standard);
    renderStandardsInModal();
}

function renderStandardsInModal() {
    selectedStandardsDisplayModal.innerHTML = tempStandards.length ? tempStandards.map(standard => `
        <span class="tag standard-tag" title="${standard}">
            ${standard.length > 60 ? standard.substring(0, 57) + '...' : standard}
            <button type="button" class="remove-standard-button" onclick="removeStandard('${standard.replace(/'/g, "\\'")}')" aria-label="Remove ${standard}">×</button>
        </span>
    `).join('') : '<span>No standards selected.</span>';
}

// Utility Functions
function scrollToTop() {
    lessonTabContent.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFileInputs() {
    [imageUploadInput, modelUploadInput, lessonIconUploadInput, bulkModelUploadInput, bulkLessonsUploadInput].forEach(input => {
        input.value = '';
    });
}

function enableActionButtons() {
    editLessonButton.disabled = false;
    printButton.disabled = false;
    exportButton.disabled = false;
}

function disableActionButtons() {
    editLessonButton.disabled = true;
    printButton.disabled = true;
    exportButton.disabled = true;
}

function printLesson() {
    if (!selectedLesson) {
        alert('Please select a lesson to print.');
        return;
    }
    console.log('[DEBUG] Printing lesson:', selectedLesson.name);

    if (window.isPrinting) {
        console.log('[DEBUG] Print sequence already in progress, ignoring');
        return;
    }
    window.isPrinting = true;

    if (confirm(`Are you sure you want to print "${selectedLesson.name}"?`)) {
        document.getElementById('printButton').blur();
        window.print();

        const handlePrintFinish = () => {
            console.log('[DEBUG] Print dialog closed');
            setTimeout(() => {
                document.getElementById('printButton').focus();
                console.log('[DEBUG] Focus restored to printButton');
                window.isPrinting = false;
            }, 300);
        };
        window.addEventListener('afterprint', handlePrintFinish, { once: true });
    } else {
        console.log('[DEBUG] Print canceled by user');
        window.isPrinting = false;
    }
}

async function exportLesson() {
    if (!selectedLesson) {
        alert('Please select a lesson to export.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 10;
    let y = margin;

    const addText = (text, fontSize, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, 190);
        if (y + lines.length * fontSize / 2 > 280) {
            doc.addPage();
            y = margin;
        }
        doc.text(lines, margin, y);
        y += lines.length * fontSize / 2 + 2;
    };

    const addList = (title, items, fontSize) => {
        addText(title, fontSize, true);
        if (items?.length) {
            items.forEach(item => addText(`- ${item}`, fontSize - 2));
        } else {
            addText('None specified', fontSize - 2);
        }
    };

    addText(`Lesson Plan: ${selectedLesson.name}`, 16, true);
    addText(`Teacher: ${selectedLesson.teacher || 'N/A'}`, 12);
    addText(`Last Updated: ${selectedLesson.lastUpdated || 'N/A'}`, 10);
    y += 5;

    addList('Learning Objectives:', selectedLesson.objectives?.learningObjectives, 12);
    addList('Standards Alignment:', selectedLesson.objectives?.standardsAlignment, 12);
    addText('Lesson Structure', 14, true);
    addText('Engage:', 12, true);
    addText(selectedLesson.structure?.engage || 'Not specified', 10);
    addText('Explore:', 12, true);
    addText(selectedLesson.structure?.explore || 'Not specified', 10);
    addText('Explain:', 12, true);
    addText(selectedLesson.structure?.explain || 'Not specified', 10);
    addText('Elaborate:', 12, true);
    addText(selectedLesson.structure?.elaborate || 'Not specified', 10);
    addText('Evaluate:', 12, true);
    addText(selectedLesson.structure?.evaluate || 'Not specified', 10);
    addList('Materials Needed:', selectedLesson.resources?.materialsNeeded, 12);
    addList('Key Vocabulary:', selectedLesson.resources?.keyVocabulary, 12);
    addList('Supplementary Links:', selectedLesson.resources?.supplementaryLinks, 12);
    addText('Teacher Notes:', 12, true);
    addText(selectedLesson.notes?.teacherNotes || 'No notes added.', 10);

    doc.save(`${selectedLesson.name}_Lesson_Plan.pdf`);
}

// Initialization
async function init() {
    console.log('[DEBUG] Initializing application');
    await loadModelsFromGitHub();
    await loadLessonsFromStorage();
    syncLessonPlan();
    setupEventListeners();
    // Temporary test
    setTimeout(() => {
        showLoadingBar('Testing Loading Bar...', 'model');
        updateLoadingBar(50, 'model');
        setTimeout(() => hideLoadingBar(false, 'model'), 3000); // Hide after 3 seconds
    }, 1000); // Show 1 second after init
}

document.addEventListener('DOMContentLoaded', init);