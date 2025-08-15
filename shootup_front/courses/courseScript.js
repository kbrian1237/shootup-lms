
/* --- Internal JavaScript based on learnBEscript.js --- */

        // State variables (should be loaded from localStorage on init)
        // 'intro' is unlocked by default. Other sections are added upon meeting criteria.
        // !!! IMPORTANT: Update these objects for each new course !!!

        const achievementBadge = document.getElementById('achievement-badge');
        const achievementList = document.getElementById('achievement-list');
        const themeSelect = document.getElementById('theme-select');
        const fontSelect = document.getElementById('font-select');
        const noteTabletToggleBtn = document.getElementById('note-tablet-toggle');
        const noteTabletPanel = document.getElementById('note-tablet-panel');
        const closeNoteTabletBtn = document.getElementById('close-note-tablet');
        const noteTextarea = document.getElementById('note-textarea');
        const downloadNotesBtn = document.getElementById('download-notes-btn');
        const toggleAchievementsBtn = document.getElementById('toggle-achievements-btn');
        const achievementsPanel = document.getElementById('achievements-panel');
        const achievementsToggleIcon = document.getElementById('achievements-toggle-icon');
        const footerElement = document.querySelector('footer'); // Get the footer element
        const addHeadingBtn = document.getElementById('add-heading-btn');
        const addListBtn = document.getElementById('add-list-btn');
        const addBoldBtn = document.getElementById('add-bold-btn');
        const addItalicBtn = document.getElementById('add-italic-btn');
        const addUnderlineBtn = document.getElementById('add-underline-btn');
        const addHrBtn = document.getElementById('add-hr-btn');
        const clearNotesBtn = document.getElementById('clear-notes-btn');
        const styleSelect = document.getElementById('style-select');
        const cssLink = document.getElementById('layout');


        


        // --- Navigation Functionality ---
        document.querySelectorAll('.nav-tabs li').forEach(li => {
            const btn = li.querySelector('.nav-btn');
            const target = li.getAttribute('data-target');

            // Add click listener to the list item
            li.addEventListener('click', function() {
                const clickedTarget = this.getAttribute('data-target');

                // Only allow navigation if the section is unlocked
                if (unlockedSections.includes(clickedTarget)) {
                    // Remove active class from all buttons and sections
                    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));

                    // Add active class to clicked button
                    const targetBtn = document.querySelector(`.nav-btn[data-target="${clickedTarget}"]`);
                    if(targetBtn) {
                         targetBtn.classList.add('active');
                    }

                    // Show corresponding section
                    const targetSection = document.getElementById(clickedTarget);
                    if(targetSection) {
                        targetSection.classList.add('active');
                    }

                    // Progress update happens when sections are UNLOCKED, not just clicked
                } else {
                    // Provide feedback that the section is locked
                    console.log(`Section ${clickedTarget} is locked. Complete the previous section's challenges to unlock.`);
                    // Optional: Show a temporary message on the screen to the user
                    // Find the feedback area of the CURRENTLY ACTIVE section (which should be the one before the locked one)
                    const activeSectionId = document.querySelector('.lesson-section.active')?.id;
                    // Try to find a general feedback area within the active section's exercise block
                    const feedbackArea = activeSectionId ? document.querySelector(`#${activeSectionId} .exercise .feedback`) : null;

                     if (feedbackArea) {
                         showFeedback(feedbackArea, `Section "${clickedTarget}" is locked. Complete the quizzes in this section!`, 'error');
                         // Hide after a few seconds
                         setTimeout(() => {
                             feedbackArea.style.display = 'none';
                         }, 3000);
                     } else {
                         // Fallback if no specific feedback area found
                         alert(`Section "${clickedTarget}" is locked. Complete the quizzes in the current section!`);
                     }
                }
            });
        });

        // Function to unlock a section
        function unlockSection(target) {
            // Prevent unlocking if already unlocked
            if (!unlockedSections.includes(target)) {
                unlockedSections.push(target);
                // Save the updated list of unlocked sections
                localStorage.setItem('unlockedSections', JSON.stringify(unlockedSections));

                // Find the list item and enable the navigation button
                const li = document.querySelector(`.nav-tabs li[data-target="${target}"]`);
                if (li) {
                    const btn = li.querySelector('.nav-btn');
                    btn.disabled = false; // Enable the button
                    li.classList.remove('locked'); // Remove locked class for styling

                    // Change the lock icon to an open lock
                    const lockIcon = li.querySelector('.lock-icon');
                    if (lockIcon) {
                        lockIcon.classList.remove('fas', 'fa-lock');
                        lockIcon.classList.add('fas', 'fa-lock-open'); // Font Awesome open lock icon
                        lockIcon.style.color = 'var(--success-color)'; // Optional: change color to indicate unlocked
                         lockIcon.style.display = 'inline-block'; // Ensure icon is visible
                    }
                }

                // Update progress after unlocking a new section
                updateProgress();

                // Optional: Show a message or animation for unlocking
                console.log(`Section "${target}" unlocked!`);
            }
        }

        // --- Quiz Checking ---
        // Handles quizzes from any section
        function checkQuiz(name, correctAnswer) {
            const selected = document.querySelector(`input[name="${name}"]:checked`);
            // Find the feedback element for this specific quiz using its ID
            const feedback = document.getElementById(`feedback-${name}`);

            // Ensure feedback element exists
            if (!feedback) {
                console.error(`Feedback element not found for quiz: ${name}`);
                return;
            }

            // Determine the section ID from the quiz name
            // Split the name by hyphens and take all parts except the last two ('quiz' and the number)
            const nameParts = name.split('-');
            // Assuming the format is 'section-name(s)-quiz-number'
            // The section name is all parts before the last two
            const sectionIdParts = nameParts.slice(0, -2);
            const sectionId = sectionIdParts.join('-'); // Rejoin the parts with hyphen
            

            if (!selected) {
                showFeedback(feedback, 'Please select an answer!', 'error');
                // Mark as incorrect if no answer is selected
                if (sectionQuizCorrect[sectionId] && sectionQuizCorrect[sectionId].hasOwnProperty(name)) {
                     sectionQuizCorrect[sectionId][name] = false;
                }
                return;
            }

            if (selected.value === correctAnswer) {
                showFeedback(feedback, 'Correct! Well done!', 'success');
                // Mark this specific quiz as correct for its section
                if (sectionQuizCorrect[sectionId] && sectionQuizCorrect[sectionId].hasOwnProperty(name)) {
                    sectionQuizCorrect[sectionId][name] = true;
                }
                // After a correct answer, check if all quizzes in this section are correct
                checkSectionQuizzesCompletion(sectionId);

            } else {
                showFeedback(feedback, 'Not quite right. Try again!', 'error');
                // Mark this specific quiz as incorrect for its section
                if (sectionQuizCorrect[sectionId] && sectionQuizCorrect[sectionId].hasOwnProperty(name)) {
                    sectionQuizCorrect[sectionId][name] = false;
                }
            }
            // Save quiz state to localStorage after each check
            localStorage.setItem('sectionQuizCorrect', JSON.stringify(sectionQuizCorrect));
        }

        // Generic function to check if all quizzes in a given section are correct
        function checkSectionQuizzesCompletion(sectionId) {
            // Ensure the section exists in our tracking object
            if (!sectionQuizCorrect[sectionId]) {
                console.error(`Quiz data not found for section: ${sectionId}`);
                return;
            }

            // Check if all quizzes in this section are marked true
            const allCorrect = Object.values(sectionQuizCorrect[sectionId]).every(isCorrect => isCorrect === true);

            if (allCorrect) {
                // Get the ID of the next section to unlock
                const nextSectionId = nextSectionMap[sectionId];
                // Get the achievement title for completing this section's quizzes
                const achievementTitle = sectionAchievementMap[sectionId];

                // Unlock the next section if it exists
                if (nextSectionId) {
                    unlockSection(nextSectionId);
                }

                // Award achievement for completing this section's quizzes
                if (achievementTitle) {
                     unlockAchievement(achievementTitle);
                }

                // Optional: Provide feedback that the section quizzes are completed
                // Find the main feedback area for the section's exercise block
                const feedbackArea = document.querySelector(`#${sectionId} .exercise .feedback`);
                 if (feedbackArea) {
                     showFeedback(feedbackArea, `All quizzes in the "${sectionId}" section completed!`, 'success');
                 }
            }
        }


        // Show feedback message for a specific feedback element
        function showFeedback(feedbackElement, message, type) {
            feedbackElement.textContent = message;
            // Remove previous feedback classes
            feedbackElement.classList.remove('success', 'error');
            // Add the new type class for styling
            feedbackElement.classList.add(type);
            // Ensure it's visible
            feedbackElement.style.display = 'block';
        }


        // --- Achievement System ---
        // Function to unlock an achievement
        function unlockAchievement(title) {
            // Check if the achievement has already been unlocked
            if (!achievements.includes(title)) {
                // Add the achievement title to our list
                achievements.push(title);
                // Save the updated achievements list to localStorage
                localStorage.setItem('achievements', JSON.stringify(achievements));

                // Show the temporary badge notification
                const badge = document.getElementById('achievement-badge');
                const badgeText = badge.querySelector('.badge-text');

                badgeText.textContent = `Achievement Unlocked: ${title}!`;
                badge.classList.add('show'); // Trigger CSS animation

                // Hide the badge after 3 seconds
                setTimeout(() => {
                    badge.classList.remove('show');
                }, 3000);

                // Add the achievement to the permanent footer list
                addAchievementToFooter(title);
            }
        }

        // Add achievement title to the footer list
        function addAchievementToFooter(title) {
            const list = document.getElementById('achievement-list');
            if (list) {
                const item = document.createElement('li');
                item.textContent = title;
                list.appendChild(item);
            }
        }

        // Display all loaded achievements in the footer when the page loads
        function displayAchievementsInFooter() {
            const list = document.getElementById('achievement-list');
            if (list) {
                list.innerHTML = ''; // Clear any existing list items
                achievements.forEach(title => {
                    addAchievementToFooter(title); // Add each achievement from the loaded state
                });
            }
        }


                // --- Progress Tracking ---
        // Update progress based on the number of UNLOCKED sections
        function updateProgress() {
            // Calculate the total number of sections from the navigation map
            let totalSections = 0;
            let currentSection = 'intro'; // Start from the first section
            while (currentSection !== null) {
                totalSections++;
                currentSection = nextSectionMap[currentSection];
            }

            // Count the number of currently unlocked sections that are part of the defined sequence
            const unlockedCount = unlockedSections.filter(sectionId => {
                 // Check if the sectionId exists as a key in the nextSectionMap or is the final section
                 return nextSectionMap.hasOwnProperty(sectionId) || sectionId === 'final';
            }).length;


            // Calculate percentage
            const percent = totalSections > 0 ? Math.round((unlockedCount / totalSections) * 100) : 0;

            // Ensure percentage does not exceed 100
            const clampedPercent = Math.min(percent, 100);


            // Update the progress bar width and text
            const progressFill = document.getElementById('progress-fill');
            const progressPercentText = document.getElementById('progress-percent');

            if (progressFill) {
                progressFill.style.width = `${clampedPercent}%`;
            }
            if (progressPercentText) {
                progressPercentText.textContent = clampedPercent;
            }

            // The overall completion achievement should be handled by completing the final section's quizzes
            // checkSectionQuizzesCompletion('final'); // This function call should happen when final quizzes are passed
        }

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', function() {
            // Load state from localStorage first
            loadState();
            
            // Set up initial UI based on loaded state
            updateNavButtons();
            displayAchievementsInFooter();
            updateProgress();

            // Store default codes for code editors
            document.querySelectorAll('.code-input').forEach(editor => {
                editor.dataset.default = editor.value;
            });

            // Set initial active section
            const initialActiveSection = unlockedSections[unlockedSections.length - 1] || 'intro';
            const activeSectionElement = document.getElementById(initialActiveSection);
            const activeNavButton = document.querySelector(`.nav-btn[data-target="${initialActiveSection}"]`);

            // Reset active states
            document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

            // Set active states
            if (activeSectionElement) {
                activeSectionElement.classList.add('active');
            }
            if (activeNavButton) {
                activeNavButton.classList.add('active');
            }

            // Hide loader
            document.getElementById('loader-overlay').classList.add('hidden');
        });

        // Function to load state from localStorage
        function loadState() {
            const savedUnlockedSections = localStorage.getItem('unlockedSections');
            if (savedUnlockedSections) {
                // Parse the saved string back into an array
                unlockedSections = JSON.parse(savedUnlockedSections);
            } else {
                // If no saved state, only intro is unlocked initially
                unlockedSections = ['intro'];
            }

            const savedSectionQuizCorrect = localStorage.getItem('sectionQuizCorrect');
            if (savedSectionQuizCorrect) {
                // Parse the saved string back into an object
                const loadedState = JSON.parse(savedSectionQuizCorrect);
                // Merge loaded state with default structure to handle new quizzes/sections
                // This prevents errors if new quizzes are added after a user has saved state
                for (const section in sectionQuizCorrect) {
                    if (loadedState[section]) {
                        for (const quiz in sectionQuizCorrect[section]) {
                            if (loadedState[section].hasOwnProperty(quiz)) {
                                sectionQuizCorrect[section][quiz] = loadedState[section][quiz];
                            }
                        }
                    }
                }
            } else {
                // If no saved state, all quizzes are initially incorrect (default structure is used)
            }

            const savedAchievements = localStorage.getItem('achievements');
            if (savedAchievements) {
                // Parse the saved string back into an array
                achievements = JSON.parse(savedAchievements);
            } else {
                // If no saved state, no achievements are unlocked initially
                achievements = [];
            }
        }

        // Function to update navigation button states based on unlockedSections
        function updateNavButtons() {
            document.querySelectorAll('.nav-tabs li').forEach(li => {
                const btn = li.querySelector('.nav-btn');
                const target = li.getAttribute('data-target');
                const lockIcon = li.querySelector('.lock-icon');

                // The 'intro' section is always unlocked and its lock icon should be hidden
                if (target === 'intro') {
                    btn.disabled = false;
                    li.classList.remove('locked');
                    if (lockIcon) lockIcon.style.display = 'none'; // Hide lock icon for intro
                    return; // Skip the rest of the logic for the intro tab
                }

                // For all other sections, check if they are in the unlockedSections array
                if (unlockedSections.includes(target)) {
                    btn.disabled = false; // Enable the button
                    li.classList.remove('locked'); // Remove locked styling class
                    if (lockIcon) {
                        lockIcon.classList.remove('fas', 'fa-lock'); // Remove lock icon class
                        lockIcon.classList.add('fas', 'fa-lock-open'); // Add open lock icon class
                        lockIcon.style.color = 'var(--success-color)'; // Optional: change color to indicate unlocked
                         lockIcon.style.display = 'inline-block'; // Ensure icon is visible
                    }
                } else {
                    btn.disabled = true; // Keep the button disabled
                    li.classList.add('locked'); // Add locked styling class
                    if (lockIcon) {
                         lockIcon.classList.remove('fas', 'fa-lock-open'); // Remove open lock icon class
                         lockIcon.classList.add('fas', 'fa-lock'); // Add closed lock icon class
                         lockIcon.style.color = ''; // Reset color or set a default locked color
                         lockIcon.style.display = 'inline-block'; // Ensure icon is visible
                    }
                }
            });
        }

        // --- Code Execution Simulation Functions (Placeholder) ---
        // !!! IMPORTANT: Customize these functions for the specific topic of your course !!!

        // Run code and update visualization/terminal
        function runCode(editorId, visId) {
            const code = document.getElementById(editorId).value;
            const terminal = document.querySelector(`#${visId} .terminal`);
            // Add other visualization elements you need to access

            // Clear terminal
            if (terminal) terminal.innerHTML = '';

            // --- Simulation Logic ---
            // Implement the logic to simulate the code execution based on the course topic.
            // This might involve:
            // - Parsing the code (simple string checks or more complex parsing)
            // - Simulating operations (e.g., server requests, data processing)
            // - Updating the visualization elements
            // - Adding output to the terminal

            // Example: Simple simulation based on console.log
            try {
                // Use a sandboxed environment for running user code in a real application!
                // For this template, we'll just simulate console.log output.
                const consoleLogs = code.match(/console\.log\((.*?)\)/g);
                if (consoleLogs) {
                    consoleLogs.forEach(log => {
                        const logContent = log.substring(12, log.length - 1).trim();
                        addTerminalLine(terminal, `> ${logContent}`, 'system'); // Simulate console log output
                    });
                } else {
                     addTerminalLine(terminal, 'No console.log statements found to simulate.', 'system');
                }

                // Add more specific simulation logic here based on the section/challenge
                // Example: If editorId is 'section1-code', add logic specific to section 1's challenge.

            } catch (e) {
                addTerminalLine(terminal, `Simulation Error: ${e.message}`, 'error');
                console.error('Simulation Error:', e);
            }
        }

         // Add line to terminal with styling based on type
        function addTerminalLine(terminal, text, type) {
            if (!terminal) return; // Ensure terminal exists

            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.classList.add(type); // Add type class for CSS styling

            line.textContent = text;
            terminal.appendChild(line);

            // Scroll to bottom
            terminal.scrollTop = terminal.scrollHeight;
        }


        // Reset code to default and clear visualization state
        function resetCode(editorId) {
            const editor = document.getElementById(editorId);
            // Get the default code from the data attribute
            const defaultCode = editor.dataset.default || '';
            editor.value = defaultCode;

            // Also reset the visualization if needed
            const visId = editorId.replace('-code', '-vis');
            const terminal = document.querySelector(`#${visId} .terminal`);
            if (terminal) terminal.innerHTML = ''; // Clear terminal output

            // Reset any specific visualization elements for this section
            // Example: const serverLight = document.querySelector(`#${visId} .server-light`);
            // if (serverLight) serverLight.classList.remove('active');

            console.log(`Code and visualization for ${editorId} reset.`);
        }

        // --- Exercise Check Functions (Placeholder) ---
        // !!! IMPORTANT: Implement the logic for each section's challenge !!!

        // Example check function for section 1's challenge
        function checkSection1Exercise() {
            const code = document.getElementById('section1-code').value;
            const feedback = document.getElementById('feedback-section1-challenge'); // Use the specific feedback ID

            if (!feedback) {
                console.error('Feedback element not found for section 1 challenge.');
                return;
            }

            // --- Challenge Check Logic ---
            // Implement the logic to check if the user's code meets the challenge requirements.
            // This will be specific to the code and goal of Section 1's challenge.
            // Example: Check if the code includes a specific function call or variable.

            const challengePassed = code.includes('// Expected code or logic'); // Replace with actual check

            if (challengePassed) {
                showFeedback(feedback, 'Challenge complete! Well done!', 'success');
                // Optional: Unlock a specific achievement for this challenge
                // unlockAchievement('Section 1 Challenge Master');
            } else {
                showFeedback(feedback, 'Keep trying! Review the instructions and code.', 'error');
            }
        }

        // Add similar check functions for other section's challenges (checkSection2Exercise, checkFinalExercise, etc.)
        // Remember to update the onclick handler on the challenge button in the HTML.

         // Placeholder check function for the final project challenge
         function checkFinalExercise() {
             const code = document.getElementById('final-code').value;
             const feedback = document.getElementById('feedback-final-challenge');

             if (!feedback) {
                 console.error('Feedback element not found for final challenge.');
                 return;
             }

             // --- Final Project Challenge Check Logic ---
             // This check might be more complex, potentially looking for the presence of
             // required routes, database interactions, etc.
             // For a simple template, you might just check if the code editor is not empty
             // or if it contains certain keywords.

             const challengeAttempted = code.trim().length > 0; // Simple check: is there any code?

             if (challengeAttempted) {
                 showFeedback(feedback, 'Great start on the final project! Keep building!', 'success');
                 // The "Course Champion" achievement is unlocked by completing all quizzes,
                 // but you could add a separate achievement for completing the final project challenge.
             } else {
                 showFeedback(feedback, 'Start writing your final project code in the editor!', 'error');
             }
         }

         // Function to add an achievement to the list in the footer
    function addAchievementToFooter(title) {
        if (achievementList) {
            const item = document.createElement('li');
            item.textContent = title;
            // Optionally add an icon or styling
            // item.innerHTML = `🏆 ${title}`;
            achievementList.appendChild(item);
        }
    }

    // Function to display all loaded achievements in the footer on page load
    function displayAchievementsInFooter() {
        if (achievementList) {
            achievementList.innerHTML = ''; // Clear any existing items first
            achievements.forEach(title => {
                addAchievementToFooter(title);
            });
        }
    }

    // --- Achievements Panel Toggle (Footer) ---
    if (toggleAchievementsBtn && achievementsPanel && achievementsToggleIcon && footerElement) {
        toggleAchievementsBtn.addEventListener('click', () => {
            // Check if the panel is currently open by checking its display style or a class
            const isOpen = footerElement.classList.contains('achievements-open');

            if (isOpen) {
                // Close the panel
                achievementsPanel.style.display = 'none';
                achievementsToggleIcon.classList.remove('fa-chevron-down');
                achievementsToggleIcon.classList.add('fa-chevron-up');
                footerElement.classList.remove('achievements-open'); // Remove class from footer
            } else {
                // Open the panel
                achievementsPanel.style.display = 'block'; // Or 'flex', 'grid' depending on layout
                achievementsToggleIcon.classList.remove('fa-chevron-up');
                achievementsToggleIcon.classList.add('fa-chevron-down');
                 footerElement.classList.add('achievements-open'); // Add class to footer for CSS styling hooks
            }
        });
         // Ensure panel is hidden on initial load
         achievementsPanel.style.display = 'none';
         footerElement.classList.remove('achievements-open');
         achievementsToggleIcon.classList.remove('fa-chevron-down');
         achievementsToggleIcon.classList.add('fa-chevron-up');
    }
    // Adjust style select options for small screens
    function adjustStyleSelectForSmallScreens() {
        const styleSelect = document.getElementById('style-select'); // Ensure the element is selected dynamically
        if (window.innerWidth <= 768) { // Define small screen width threshold
            if (styleSelect) {
                styleSelect.innerHTML = `
                    <option value="default">Default</option>
                    <option value="retro">retro</option>
                    <option value="minimalistic">Minimalistic</option>
                `;
            }
        }
    }

    // Call the function on page load
    document.addEventListener('DOMContentLoaded', adjustStyleSelectForSmallScreens);

    // Call the function on window resize
    window.addEventListener('resize', adjustStyleSelectForSmallScreens);
    // Style switching
    
    if (styleSelect && cssLink) {
        styleSelect.addEventListener('change', function() {
            const selectedStyle = this.value;
            if (selectedStyle === 'default') {
                cssLink.href = 'defaultStyle.css'; // Switch to course template style
            } else if (selectedStyle === 'retro') {
                cssLink.href = 'retroStyle.css'; // Switch to futuristic style
            } else if (selectedStyle === 'futuristic') {
                cssLink.href = 'futuristicStyle.css'; // Switch to modern style
            } else if (selectedStyle === 'cyber') {
                cssLink.href = 'cyberStyle.css'; // Switch to cyber style
            } else if (selectedStyle === 'lux') {
                cssLink.href = 'luxuriousStyle.css'; // Switch to retro style
            } else if (selectedStyle === 'minimalistic') {
                cssLink.href = 'minimalistStyle.css'; // Switch to minimalistic style
            }
            localStorage.setItem('selectedStyle', selectedStyle); // Save selection
        });
    }

    // --- Theme Switching with Animation ---
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            const selectedTheme = this.value;

            // Add a fade-out animation to the body
            document.body.classList.add('theme-transition');
            setTimeout(() => {
                applyTheme(selectedTheme);
                localStorage.setItem('selectedTheme', selectedTheme); // Save selection

                // Remove the fade-out animation after the theme is applied
                document.body.classList.remove('theme-transition');
            }, 300); // Duration of the fade-out animation (in milliseconds)
        });
    }

    // Add CSS for the theme transition animation
    const style = document.createElement('style');
    style.textContent = `
        .theme-transition {
            transition: background-color 0.3s ease, color 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Apply saved style on page load
    document.addEventListener('DOMContentLoaded', function() {
        const savedStyle = localStorage.getItem('selectedStyle');
        if (savedStyle && styleSelect) {
            styleSelect.value = savedStyle; // Update dropdown
            if (savedStyle === 'default') {
                cssLink.href = 'defaultStyle.css'; // Switch to course template style
            } else if (savedStyle === 'retro') {
                cssLink.href = 'retroStyle.css'; // Switch to futuristic style
            } else if (savedStyle === 'futuristic') {
                cssLink.href = 'futuristicStyle.css'; // Switch to modern style
            } else if (savedStyle === 'cyber') {
                cssLink.href = 'cyberStyle.css'; // Switch to cyber style
            } else if (savedStyle === 'lux') {
                cssLink.href = 'luxuriousStyle.css'; // Switch to retro style
            } else if (savedStyle === 'minimalistic') {
                cssLink.href = 'minimalistStyle.css'; // Switch to minimalistic style
            }
        } else {
            // Set default style if no saved style exists
            cssLink.href = 'defaultStyle.css';
            if (styleSelect) styleSelect.value = 'default';
            localStorage.setItem('selectedStyle', 'default'); // Ensure default is saved
        }
    });

    // Function to apply a theme class to the body
    function applyTheme(themeName) {
        // Remove all potential theme classes first
        document.body.classList.remove('default-theme', 'dark-theme', 'light-theme', 'ocean-theme', 'forest-theme');
        // Add the selected theme class (if it's not the default)
        if (themeName && themeName !== 'default') {
            document.body.classList.add(`${themeName}-theme`);
        }
        // The default theme doesn't need a specific class added to the body,
        // as its styles are defined in the :root selector in the CSS.
    }

    // Function to apply the saved theme on page load
    function applySavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme) {
            if (themeSelect) themeSelect.value = savedTheme; // Update dropdown
            applyTheme(savedTheme); // Apply the theme
        } else {
            applyTheme('default'); // Apply default if nothing saved
        }
    }

    // --- Font Switching ---
    if (fontSelect) {
        fontSelect.addEventListener('change', function() {
            const selectedFont = this.value;
            applyFont(selectedFont);
            localStorage.setItem('selectedFont', selectedFont); // Save selection
        });
    }

    // Function to apply a font family to the body
    function applyFont(fontFamily) {
        document.body.style.fontFamily = fontFamily;
    }

    // Function to apply the saved font on page load
    function applySavedFont() {
        const savedFont = localStorage.getItem('selectedFont');
        if (savedFont) {
            if (fontSelect) fontSelect.value = savedFont; // Update dropdown
            applyFont(savedFont); // Apply the font
        } else {
            // Apply a default font if none saved (should match the CSS default)
            applyFont('Segoe UI, Tahoma, Geneva, Verdana, sans-serif');
        }
    }


    // --- Note Tablet Functionality ---
    if (noteTabletToggleBtn && noteTabletPanel && closeNoteTabletBtn && noteTextarea && downloadNotesBtn) {
        // Open the note tablet
        noteTabletToggleBtn.addEventListener('click', () => {
            noteTabletPanel.classList.add('open');
        });

        // Close the note tablet
        closeNoteTabletBtn.addEventListener('click', () => {
            noteTabletPanel.classList.remove('open');
            saveNotes(); // Save notes when closing the panel
        });

        // Save notes periodically as user types (optional, with debounce recommended for performance)
        let noteSaveTimeout;
        noteTextarea.addEventListener('input', () => {
            clearTimeout(noteSaveTimeout);
            noteSaveTimeout = setTimeout(saveNotes, 500); // Save 500ms after last input
        });

        // Save notes when the window is about to close/unload
        window.addEventListener('beforeunload', saveNotes);


        // Download notes as a text file
        downloadNotesBtn.addEventListener('click', () => {
            const notesContent = noteTextarea.value;
            const blob = new Blob([notesContent], { type: 'text/plain;charset=utf-8' }); // Specify charset
            const url = URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'course_notes.txt'; // Suggested file name
            document.body.appendChild(a); // Append link to body
            a.click(); // Simulate click

            // Clean up: remove link and revoke object URL
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
    function insertAtCursor(textarea, textToInsert, textToWrap) {
    const start = textarea.selectionStart; // Get the start position of the selection
    const end = textarea.selectionEnd;     // Get the end position of the selection
    const value = textarea.value;          // Get the current value of the textarea

    if (start === end) { // If no text is selected (cursor only)
        // Insert textToInsert at the cursor position
        textarea.value = value.substring(0, start) + textToInsert + value.substring(end);
        // Move the cursor to the end of the inserted text
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    } else { // If text is selected
        const prefix = textToWrap.prefix || ''; // Get the prefix for wrapping
        const suffix = textToWrap.suffix || ''; // Get the suffix for wrapping
        const selectedText = value.substring(start, end); // Get the selected text
        // Replace the selected text with the wrapped text
        textarea.value = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
        // Keep the wrapped text selected
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length + selectedText.length;
    }
    textarea.focus(); // Keep focus on the textarea after insertion/wrapping
    // Trigger the 'input' event manually to ensure the saveNotes function is called
    // This is important because programmatically changing the value doesn't trigger 'input' by default
    textarea.dispatchEvent(new Event('input'));
}

// Add event listeners to the buttons, ensuring the textarea exists
if (noteTextarea) {
    // Add Heading Button
    if (addHeadingBtn) {
        addHeadingBtn.addEventListener('click', () => {
            const start = noteTextarea.selectionStart;
            const value = noteTextarea.value;
            // Find the start of the current line
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const textBeforeCursor = value.substring(lineStart, start);

            // Check if the line already starts with a heading marker (#, ##, etc.)
            if (textBeforeCursor.match(/^#+\s/)) {
                // If it does, don't add another heading marker
                // Just focus and trigger save (in case the user clicked after typing)
                 noteTextarea.focus();
                 noteTextarea.dispatchEvent(new Event('input'));
            } else {
                // Insert heading marker at the beginning of the line
                 noteTextarea.value = value.substring(0, lineStart) + '### ' + value.substring(lineStart);
                 // Adjust cursor position to be after the inserted marker
                 noteTextarea.selectionStart = noteTextarea.selectionEnd = start + '### '.length;
                 noteTextarea.focus();
                 noteTextarea.dispatchEvent(new Event('input')); // Trigger save
            }
        });
    }

    // Add List Item Button
    if (addListBtn) {
        addListBtn.addEventListener('click', () => {
             const start = noteTextarea.selectionStart;
             const value = noteTextarea.value;
             // Find the start of the current line
             const lineStart = value.lastIndexOf('\n', start - 1) + 1;
             const textBeforeCursor = value.substring(lineStart, start);

             // Check if the line is empty or only whitespace
             if (textBeforeCursor.trim() === '') {
                 // Insert list item marker at the beginning of the line if it's empty
                 noteTextarea.value = value.substring(0, lineStart) + '- ' + value.substring(lineStart);
                 // Adjust cursor position
                 noteTextarea.selectionStart = noteTextarea.selectionEnd = start + '- '.length;
             } else {
                 // Insert list item marker on a new line if the current line has content
                 insertAtCursor(noteTextarea, '\n- ');
             }
             noteTextarea.focus();
             noteTextarea.dispatchEvent(new Event('input')); // Trigger save
        });
    }

    // Add Bold Button
    if (addBoldBtn) {
        addBoldBtn.addEventListener('click', () => {
            // If text is selected, wrap it with **. If not, insert **bold text**
            insertAtCursor(noteTextarea, '**bold text**', { prefix: '**', suffix: '**' });
        });
    }

    // Add Italic Button
    if (addItalicBtn) {
        addItalicBtn.addEventListener('click', () => {
            // If text is selected, wrap it with *. If not, insert *italic text*
            insertAtCursor(noteTextarea, '*italic text*', { prefix: '*', suffix: '*' });
        });
    }

    // Add Underline Button (using HTML <u> tags)
    if (addUnderlineBtn) {
        addUnderlineBtn.addEventListener('click', () => {
            // If text is selected, wrap it with <u></u>. If not, insert <u>underline text</u>
            insertAtCursor(noteTextarea, '<u>underline text</u>', { prefix: '<u>', suffix: '</u>' });
        });
    }

    // Add Horizontal Rule Button
    if (addHrBtn) {
        addHrBtn.addEventListener('click', () => {
            const start = noteTextarea.selectionStart;
            const value = noteTextarea.value;
            // Insert '---' on a new line. Add a newline before if not already at the start of a line.
            const textToInsert = (start > 0 && value[start - 1] !== '\n' ? '\n' : '') + '---\n';
            insertAtCursor(noteTextarea, textToInsert);
        });
    }

    // Clear Notes Button
    if (clearNotesBtn) {
        clearNotesBtn.addEventListener('click', () => {
            // Ask for user confirmation before clearing all notes
            if (confirm('Are you sure you want to clear all your notes? This action cannot be undone.')) {
                noteTextarea.value = ''; // Clear the textarea content
                noteTextarea.focus(); // Keep focus on the textarea
                noteTextarea.dispatchEvent(new Event('input')); // Trigger input event to save the empty state
            }
        });
    }

    // --- Local Storage Save/Load Functions (Ensure these are present) ---
    // You likely have these already, but including them for completeness

    // Function to load notes from localStorage when the page loads
    function loadNotes() {
        const savedNotes = localStorage.getItem('userNotes');
        if (savedNotes !== null && noteTextarea) { // Check if data exists and textarea is available
            noteTextarea.value = savedNotes;
        }
    }

    // Function to save notes to localStorage
    // This function is called by the 'input' event listener on the textarea
    // and when the note tablet is closed or window is unloaded.
    function saveNotes() {
        if (noteTextarea) {
            localStorage.setItem('userNotes', noteTextarea.value);
        }
    }

    // --- Call loadNotes on page load ---
    // Ensure loadNotes() is called when the DOM is ready.
    // If you have an existing DOMContentLoaded listener, add loadNotes() inside it.
    document.addEventListener('DOMContentLoaded', function() {
        // ... existing DOMContentLoaded logic ...

        // Call loadNotes here to load saved notes when the page loads
        loadNotes();

        // ... rest of existing DOMContentLoaded logic ...
    });

    // --- Ensure saveNotes is called on input, close, and beforeunload ---
    // These event listeners should already be present in your existing note tablet logic.
    // The manual dispatchEvent('input') calls in the button listeners will ensure
    // the existing input handler (which calls saveNotes) is triggered.

} 

 // Add line to terminal with styling based on type
function addTerminalLine(terminal, text, type) {
    if (!terminal) return; // Ensure terminal exists

    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.classList.add(type); // Add type class for CSS styling

    // Basic text sanitization to prevent rendering HTML from user input
    line.textContent = text;

    terminal.appendChild(line);

    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight;
}


// Reset code to default and clear visualization state
function resetCode(editorId) {
    const editor = document.getElementById(editorId);
    // Get the default code from the data attribute
    const defaultCode = editor.dataset.default || '';
    editor.value = defaultCode;

    // Also reset the visualization if needed
    const visId = editorId.replace('-code', '-vis');
    const terminal = document.querySelector(`#${visId} .terminal`);
    if (terminal) terminal.innerHTML = ''; // Clear terminal output

    // Reset any specific visualization elements for this section
    // Example: const serverLight = document.querySelector(`#${visId} .server-light`);
    // if (serverLight) serverLight.classList.remove('active');

    console.log(`Code and visualization for ${editorId} reset.`);
}
// Get the modal element
var modal = document.getElementById("settingsModal");

// Get the button that opens the modal
var btn = document.getElementById("settingsButton");

// Get the <span> element (the close button)
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal content, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
document.addEventListener('DOMContentLoaded', function() {
    const loaderOverlay = document.getElementById('loader-overlay');
    const navButtons = document.querySelectorAll('.nav-btn'); // Assuming your nav buttons have class 'nav-btn'
  
    // Function to show the loader
    function showLoader() {
      if (loaderOverlay) {
        loaderOverlay.classList.remove('hidden');
        document.body.classList.add('loading'); // Optional: Disable scroll
      }
    }
  
    // Function to hide the loader
    function hideLoader() {
      if (loaderOverlay) {
        loaderOverlay.classList.add('hidden');
        document.body.classList.remove('loading'); // Optional: Enable scroll
      }
    }
  
    // --- Initial Page Load Animation ---
    showLoader(); // Show loader as soon as DOM is ready
  
    // Hide loader after a simulated delay (e.g., 1.5 seconds)
    // In a real application, you would hide it after all essential content is loaded.
    setTimeout(function() {
      hideLoader();
    }, 1500); // Adjust this delay as needed
  
    // --- Navigation Click Animation ---
    if (navButtons.length > 0) {
      navButtons.forEach(function(button) {
        button.addEventListener('click', function() {
          showLoader();
  
          // IMPORTANT: You need to call hideLoader() after your content
          // for the new section has actually loaded or been displayed.
          // This is a placeholder for that logic.
          // For example, if you are loading content via AJAX,
          // call hideLoader() in the success callback.
          // If you are just showing/hiding sections, call it after the new section is visible.
  
          // Example: Simulate content loading for 1 second then hide loader
          // Replace this with your actual content loading logic.
          console.log('Navigation clicked, showing loader. Implement logic to hide loader after content loads.');
          setTimeout(function() {
             // This is where you would typically hide the loader after the new content is displayed.
             // For the `learnjs.html` example, you might integrate this with the tab switching logic.
             // For instance, after the new section's 'active' class is set.
             hideLoader();
          }, 1000); // Simulated delay for content switch
        });
      });
    } else {
      console.warn('No elements with class "nav-btn" found for navigation loader.');
    }
  
  });
