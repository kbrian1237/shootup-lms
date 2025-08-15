document.addEventListener('DOMContentLoaded', () => {
    // Load navigation from a separate HTML file.
    fetch('dist/navigation.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navigation-placeholder').innerHTML = data;
            // Initialize navigation toggle after navigation is loaded
            if (typeof initializeNavigationToggle === 'function') {
                initializeNavigationToggle();
            }
            // Load navigation auth script
            const authScript = document.createElement('script');
            authScript.src = 'dist/navigation-auth.js';
            document.head.appendChild(authScript);
            
            // Load mobile navigation script
            const mobileScript = document.createElement('script');
            mobileScript.src = 'dist/mobile-nav.js';
            document.head.appendChild(mobileScript);
        })
        .catch(() => {
            // Fallback navigation in case of an error.
            const fallback = `
<aside id="sidebar" class="bg-secondary-bg w-72 flex-shrink-0 p-6 flex flex-col justify-between border-r border-white/10 shadow-xl">
  <div>
    <div class="flex items-center space-x-3 mb-10 mt-10 brand-section">
      <i class="fa-solid fa-graduation-cap text-3xl text-indigo-400"></i>
      <h1 class="text-3xl font-bold tracking-wide header-title">ShootUp</h1>
    </div>
    <nav>
      <ul class="space-y-4">
        <li><a href="landing.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-home text-xl text-indigo-400"></i><span class="font-medium text-lg">Home</span></a></li>
        <li><a href="dashboard.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-tachometer-alt text-xl text-indigo-400"></i><span class="font-medium text-lg">Dashboard</span></a></li>
        <li><a href="courses.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-book-open text-xl text-indigo-400"></i><span class="font-medium text-lg">My Courses</span></a></li>
        <li><a href="schedule.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-calendar-alt text-xl text-indigo-400"></i><span class="font-medium text-lg">Schedule</span></a></li>
        <li><a href="analytics.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-chart-line text-xl text-indigo-400"></i><span class="font-medium text-lg">Analytics</span></a></li>
        <li><a href="achievements.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-trophy text-xl text-indigo-400"></i><span class="font-medium text-lg">Achievements</span></a></li>
        <li><a href="settings.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-cogs text-xl text-indigo-400"></i><span class="font-medium text-lg">Settings</span></a></li>
        <li><a href="admin.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-user-shield text-xl text-indigo-400"></i><span class="font-medium text-lg">Admin</span></a></li>
        <li><a href="login.html" class="nav-link flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5"><i class="fa-solid fa-right-to-bracket text-xl text-indigo-400"></i><span class="font-medium text-lg">Login</span></a></li>
      </ul>
    </nav>
  </div>
</aside>`;
            document.getElementById('navigation-placeholder').innerHTML = fallback;
            // Initialize navigation toggle after fallback navigation is loaded
            if (typeof initializeNavigationToggle === 'function') {
                initializeNavigationToggle();
            }
        });

    // Function to get course progress from Local Storage (using a fallback value if not set)
    function getCourseProgress(courseId) {
        const progress = localStorage.getItem(`progress_${courseId}`);
        return progress ? parseInt(progress, 10) : 0;
    }

    // Use the `ShootUpData` module to load data and render the course cards.
    window.ShootUpData.load()
        .then(data => {
            // Get the course cards container.
            const courseCardsContainer = document.querySelector('[data-component="courses-grid"]');

            if (courseCardsContainer) {
                // Generate and inject the HTML for each course card.
                courseCardsContainer.innerHTML = data.courses.map((c, idx) => {
                    const progress = getCourseProgress(c.id);
                    return `
<a href="${c.file}" class="course-card bg-[#282828] p-6 rounded-2xl shadow-lg border border-gray-700 cursor-pointer hover:scale-105 transition-transform duration-200 ease-in-out block animate-fade-in-up animate-delay-${(idx % 3) + 1}">
    <img src="${c.image}" alt="Course Image" class="w-full h-40 object-cover rounded-xl mb-4">
    <h3 class="text-2xl font-semibold mb-2">${c.title}</h3>
    <p class="text-gray-400 mb-2"><strong>Category:</strong> ${c.category}</p>
    <div class="w-full bg-gray-700 rounded-full h-2.5 progress-container">
        <div class="bg-indigo-600 h-2.5 rounded-full progress-bar" style="width: ${progress}%"></div>
    </div>
    <p class="text-sm text-gray-400 mt-2">${progress}% Complete</p>
</a>`;
                }).join('');
            }
        });

    // Iframe and navigation logic to display course content.
    const mainContainer = document.getElementById('main-container');
    const lmsView = document.getElementById('lms-view');
    const courseView = document.getElementById('course-view');
    const courseIframe = document.getElementById('course-iframe');

    // Event listener for clicking on a course card.
    document.body.addEventListener('click', function(event) {
        const courseCard = event.target.closest('.course-card');
        if (courseCard && courseView && courseIframe) {
            event.preventDefault();
            const courseFile = courseCard.getAttribute('href');
            showCourseDetail(courseFile);
        }
    });

    /**
     * Shows the course detail view by loading the course file into an iframe.
     * @param {string} courseFile - The URL of the course file.
     */
    function showCourseDetail(courseFile) {
        if (lmsView && courseView && courseIframe && mainContainer) {
            lmsView.classList.add('hidden');
            courseView.classList.remove('hidden');
            courseIframe.src = courseFile;
            mainContainer.classList.add('sidebar-collapsed');
        }
    }
    
    // Listen for messages from course iframe
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'showNavigation') {
            // Show navigation when requested from course iframe
            if (window.NavigationToggle) {
                window.NavigationToggle.show();
            }
        } else if (event.data && event.data.type === 'progressUpdate') {
            // Handle progress updates from course iframe
            const { courseId, progress } = event.data;
            if (courseId && typeof progress === 'number') {
                // Update the progress in localStorage (this is already done by the course, but ensures consistency)
                localStorage.setItem(`progress_${courseId}`, progress.toString());
                
                // Update any visible progress bars for this course
                updateCourseProgressDisplay(courseId, progress);
                
                console.log(`Progress updated for course ${courseId}: ${progress}%`);
            }
        }
    });
    
    // Function to update course progress display in the UI
    function updateCourseProgressDisplay(courseId, progress) {
        // Find all course cards and update the one matching this courseId
        const courseCards = document.querySelectorAll('.course-card');
        courseCards.forEach(card => {
            const href = card.getAttribute('href');
            if (href && href.includes(`id=${courseId}`)) {
                const progressBar = card.querySelector('.progress-bar');
                const progressText = card.querySelector('.text-sm');
                
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
                if (progressText) {
                    progressText.textContent = `${progress}% Complete`;
                }
            }
        });
    }
});
