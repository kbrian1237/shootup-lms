(function(){
	// Define the path to the data.json file.
	// Use relative path that works from any subdirectory
	const DATA_URL = window.location.pathname.includes('/courses/') ? '../dist/data.json' : 'dist/data.json';
	// Cache the data once it's loaded to avoid redundant fetches.
	let cache = null;
	// Store context objects for a more flexible data binding.
	const contexts = Object.create(null);

	/**
	 * Loads the data from the JSON file.
	 * @returns {Promise<Object>} The loaded JSON data.
	 */
	async function loadData() {
		// Return the cached data if it exists.
		if (cache) return cache;
		
		try {
			console.log('Loading data from:', DATA_URL);
			// Fetch the JSON file with a 'no-store' cache policy to get the latest data.
			const res = await fetch(DATA_URL, { cache: 'no-store' });
			
			if (!res.ok) {
				throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
			}
			
			// Parse the JSON response and store it in the cache.
			cache = await res.json();
			console.log('Data loaded successfully:', cache);
			return cache;
		} catch (error) {
			console.error('Error in loadData:', error);
			// Reset cache on error
			cache = null;
			throw error;
		}
	}

	/**
	 * Sets a context object for data binding.
	 * @param {string} key - The key for the context.
	 * @param {Object} obj - The context object to store.
	 */
	function setContext(key, obj) { contexts[key] = obj; }

	/**
	 * Resolves a dot-separated path on an object.
	 * @param {Object} obj - The object to resolve the path on.
	 * @param {string} path - The dot-separated path string.
	 * @returns {*} The value at the specified path, or undefined if not found.
	 */
	function resolvePath(obj, path) {
		const parts = path.split('.');
		let cur = obj;
		for (const p of parts) {
			if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p]; else return undefined;
		}
		return cur;
	}

	/**
	 * Resolves a path from either the contexts or the main data object.
	 * @param {Object} data - The main data object.
	 * @param {string} path - The dot-separated path string.
	 * @returns {*} The value at the specified path, or undefined if not found.
	 */
	function resolveFromContextsOrData(data, path) {
		const [head, ...rest] = path.split('.');
		if (contexts[head] != null) {
			return resolvePath(contexts[head], rest.join('.'));
		}
		return resolvePath(data, path);
	}

	/**
	 * Binds data from the provided object to DOM elements with a `data-bind` attribute.
	 * @param {Object} data - The data object to bind.
	 * @param {HTMLElement} [root=document] - The root element to start the query from.
	 */
	function hydrateBindings(data, root=document) {
		const nodes = root.querySelectorAll('[data-bind]');
		nodes.forEach(node => {
			const path = node.getAttribute('data-bind');
			const value = resolveFromContextsOrData(data, path);
			if (value === undefined || value === null) return;
			const tag = node.tagName;
			if (tag === 'IMG') {
				node.src = String(value);
			} else if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
				if (node.type === 'checkbox') node.checked = !!value; else node.value = value;
			} else {
				node.textContent = String(value);
			}
		});
	}

	/**
	 * Finds a course object by its ID.
	 * @param {Object} data - The data object.
	 * @param {string} id - The ID of the course.
	 * @returns {Object|null} The course object or null if not found.
	 */
	function getCourseById(data, id) { return data.courses.find(c => c.id === id) || null; }

	/**
	 * Finds multiple course objects by a list of IDs.
	 * @param {Object} data - The data object.
	 * @param {string[]} ids - An array of course IDs.
	 * @returns {Object[]} An array of course objects.
	 */
	function getCoursesByIds(data, ids) { return data.courses.filter(c => ids.includes(c.id)); }

	/**
	 * Computes dashboard data.
	 * NOTE: The provided data.json does not contain `progress` on courses or `dashboard.stats`.
	 * This function has been adjusted to only return `recentActivity`, which is available.
	 * @param {Object} data - The data object.
	 * @returns {Object} The dashboard data.
	 */
	function computeDashboard(data) {
		return { recentActivity: data.dashboard.recentActivity };
	}

	/**
	 * Computes the average score based on a distribution.
	 * @param {Object} data - The data object.
	 * @returns {number} The computed average score.
	 */
	function computeAverageScore(data) {
		// Simple weighted estimate from distribution buckets A,B,C,D -> 95,85,75,65
		const weights = { A: 95, B: 85, C: 75, D: 65 };
		const dist = data.analytics.scoreDistribution;
		let total = 0, count = 0;
		for (let i=0;i<dist.labels.length;i++) {
			const grade = dist.labels[i];
			const n = Number(dist.values[i]) || 0;
			total += (weights[grade] || 0) * n; count += n;
		}
		return count ? Math.round((total / count)) : 0;
	}

	// Expose the public functions to the global window object.
	window.ShootUpData = {
		load: loadData,
		setContext,
		bind: hydrateBindings,
		getCourseById,
		getCoursesByIds,
		computeDashboard,
		computeAverageScore
	};
})();