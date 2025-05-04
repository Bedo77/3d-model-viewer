// History stack for undo functionality
const HistoryManager = {
    actions: [],
    addAction: function(action) {
        this.actions.push(action);
        debug.log(`Action added to history: ${action.type}`);
        this.updateUndoButton();
    },
    undo: function() {
        const action = this.actions.pop();
        if (action) {
            action.undo();
            debug.log(`Undid action: ${action.type}`);
            this.updateUndoButton();
        } else {
            debug.log('No actions to undo');
        }
    },
    updateUndoButton: function() {
        const undoButton = document.getElementById('undo-button');
        if (undoButton) {
            undoButton.disabled = this.actions.length === 0;
        }
    }
};

// Slide Management Module
const SlideManager = {
    init: function() {
        debug.log('Initializing slide manager');
        this.initRevealJS();
        this.initNavigation();
        this.setupEventListeners();
        this.checkSavedLesson();
    },

    initRevealJS: function() {
        debug.log('Initializing Reveal.js');
        Reveal.initialize({
            controls: false,
            transition: 'slide',
            progress: true,
            center: true
        }).then(() => {
            debug.log('Reveal.js initialized successfully');
        }).catch(error => {
            debug.error('Failed to initialize Reveal.js', error);
        });
    },

    initNavigation: function() {
        debug.log('Initializing navigation controls');
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');
        const resetButton = document.getElementById('resetButton');

        if (prevButton && nextButton && resetButton) {
            prevButton.addEventListener('click', () => {
                debug.log('Previous button clicked');
                Reveal.prev();
            });
            
            nextButton.addEventListener('click', () => {
                debug.log('Next button clicked');
                Reveal.next();
            });
            
            resetButton.addEventListener('click', () => {
                debug.log('Reset button clicked');
                Reveal.slide(0);
            });
        } else {
            debug.error('Navigation buttons not found');
        }
    },

    setupEventListeners: function() {
        debug.log('Setting up slide manager event listeners');

        const undoButton = document.getElementById('undo-button');
        if (undoButton) {
            undoButton.addEventListener('click', () => {
                HistoryManager.undo();
            });
        } else {
            debug.error('Undo button not found');
        }

        window.addEventListener('message', (e) => {
            this.handleLessonMessage(e);
        });

        window.addEventListener('resize', () => {
            if (PresentationTools.whiteboard?.active) {
                PresentationTools.whiteboard.resizeCanvas();
            }
        });
    },

    handleLessonMessage: function(e) {
        debug.log(`Message received: ${JSON.stringify(e.data)}`);
        
        if (e.data?.type === 'lessonSelected') {
            debug.log(`Processing lesson: ${e.data.lesson?.name || 'Unnamed lesson'}`);
            this.createSlidesFromLesson(e.data.lesson);
        }
    },

    createSlidesFromLesson: function(lesson) {
        if (!lesson) {
            debug.log('No lesson provided, showing welcome slide');
            return;
        }

        debug.log(`Creating slides for lesson: ${lesson.name}`);
        const slidesContainer = document.querySelector('.slides');
        
        while (slidesContainer.children.length > 1) {
            slidesContainer.removeChild(slidesContainer.lastChild);
        }

        const slides = [
            this.createTitleSlide(lesson),
            this.createObjectivesSlide(lesson),
            ...this.create5ESlides(lesson),
            this.createSummarySlide(lesson)
        ];

        slides.forEach(slide => {
            const section = document.createElement('section');
            section.innerHTML = slide;
            slidesContainer.appendChild(section);
        });

        if (Reveal.isReady()) {
            Reveal.sync();
            Reveal.slide(1);
        } else {
            debug.log('Reveal.js not ready, waiting for initialization');
            Reveal.addEventListener('ready', () => {
                Reveal.sync();
                Reveal.slide(1);
            });
        }
    },

    createTitleSlide: function(lesson) {
        return `<h2>${lesson.name}</h2>
                <p>Teacher: ${lesson.teacher || 'N/A'}</p>
                <p>Subject: ${lesson.subject || 'Physics'}</p>
                <p>Last Updated: ${lesson.lastUpdated || 'N/A'}</p>`;
    },

    createObjectivesSlide: function(lesson) {
        const objectives = lesson.objectives?.learningObjectives || [];
        return `<h2>Learning Objectives</h2>
                ${objectives.length ? 
                    `<ul>${objectives.map(obj => `<li>${obj}</li>`).join('')}</ul>` : 
                    '<p>No objectives specified.</p>'}`;
    },

    create5ESlides: function(lesson) {
        const stages = ['Engage', 'Explore', 'Explain', 'Elaborate', 'Evaluate'];
        return stages.map(stage => {
            const content = lesson.structure?.[stage.toLowerCase()] || 'Not specified';
            return `<h2>${stage}</h2><p>${content}</p>`;
        });
    },

    createSummarySlide: function(lesson) {
        return `<h2>Summary</h2>
                <p>Materials: ${lesson.resources?.materialsNeeded?.join(', ') || 'None'}</p>
                <p>Vocabulary: ${lesson.resources?.keyVocabulary?.join(', ') || 'None'}</p>
                <p>Standards: ${lesson.objectives?.standardsAlignment?.join(', ') || 'N/A'}</p>`;
    },

    checkSavedLesson: function() {
        const savedLesson = localStorage.getItem('selectedLesson');
        if (savedLesson) {
            try {
                debug.log('Loading saved lesson from localStorage');
                const lesson = JSON.parse(savedLesson);
                if (lesson && typeof lesson === 'object' && lesson.name && lesson.lastUpdated) {
                    this.createSlidesFromLesson(lesson);
                } else {
                    debug.error('Invalid lesson data in localStorage', lesson);
                    localStorage.removeItem('selectedLesson');
                }
            } catch (error) {
                debug.error('Failed to parse saved lesson', error);
                localStorage.removeItem('selectedLesson');
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    debug.log('DOM fully loaded');
    SlideManager.init();
    PresentationTools.init();
});