(function(){
	function qsParam(name){ return new URLSearchParams(location.search).get(name); }
	const file = qsParam('file') || 'courses/javascript.json';
	const id = qsParam('id');

	function $(sel, root=document){ return root.querySelector(sel); }
	function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

	function renderBlocks(container, blocks){
		if (!Array.isArray(blocks)) return;
		container.innerHTML = '';
		blocks.forEach(block => {
			if (block.type === 'p'){
				const p = document.createElement('p'); p.textContent = block.text || ''; container.appendChild(p);
			}else if (block.type === 'code'){
				const pre = document.createElement('pre'); const code = document.createElement('code'); code.textContent = block.code || ''; pre.appendChild(code); container.appendChild(pre);
			}else if (block.type === 'img'){
				const img = document.createElement('img'); img.src = block.src; img.alt = block.alt||''; img.style.maxWidth = '100%'; img.style.borderRadius = '8px'; container.appendChild(img);
			}
		});
	}

	function indexToLetter(i){ return String.fromCharCode('A'.charCodeAt(0) + Number(i)); }

	function renderQuizzes(exerciseRoot, sectionKey, quiz){
		if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length===0) return;
		exerciseRoot.innerHTML = '';
		quiz.questions.forEach((q, idx) => {
			const qName = `${sectionKey}-quiz-${idx+1}`;
			const wrapper = document.createElement('div'); wrapper.className = 'quiz'; wrapper.id = `quiz-${sectionKey}-${idx+1}`;
			const p = document.createElement('p'); p.innerHTML = `<strong>${idx+1}. ${q.prompt}</strong>`; wrapper.appendChild(p);
			const opts = document.createElement('div'); opts.className = 'quiz-options';
			(q.choices||[]).forEach((choice, ci)=>{
				const label = document.createElement('label');
				label.innerHTML = `<input type="radio" name="${qName}" value="${indexToLetter(ci)}"> ${choice}`;
				opts.appendChild(label); opts.appendChild(document.createElement('br'));
			});
			wrapper.appendChild(opts);
			const btn = document.createElement('button'); btn.className='check-btn'; btn.textContent='Check Answer';
			btn.setAttribute('onclick', `checkQuiz('${qName}', '${indexToLetter(q.answerIndex)}')`);
			wrapper.appendChild(btn);
			const fb = document.createElement('div'); fb.className='feedback'; fb.id = `feedback-${qName}`; wrapper.appendChild(fb);
			exerciseRoot.appendChild(wrapper);
		});
	}

	async function hydrate(){
		try{
			const res = await fetch(file, { cache: 'no-store' });
			const data = await res.json();
			// Header
			$('header h1').textContent = data.title || '[Course Title]';
			$('header p').textContent = data.description || '[Course Tagline or Description]';
			// Tabs
			const sections = Array.isArray(data.sections) ? data.sections : [];
			// Intro
			const introContent = $('#intro .lesson-content');
			if (introContent && sections[0]) renderBlocks(introContent, sections[0].content||[]);
			// Intro quiz
			const introExercise = $('#intro .exercise');
			if (introExercise && sections[0] && sections[0].quiz) renderQuizzes(introExercise, 'intro', sections[0].quiz);
			// Section 1
			const s1 = sections[1] || sections[0];
			const s1Title = $('#section1 .lesson-title'); if (s1Title && s1) s1Title.textContent = `Section 1: ${s1.title || ''}`;
			const s1Content = $('#section1 .lesson-content'); if (s1Content && s1) renderBlocks(s1Content, s1.content||[]);
			const s1Exercise = $('#section1 .exercise'); if (s1Exercise && s1 && s1.quiz) renderQuizzes(s1Exercise, 'section1', s1.quiz);
			// Prefill playground code for section1 if a playground block exists
			if (s1) {
				const pg = (s1.content||[]).find(b => b.type==='code' && b.playground===true);
				if (pg) { const ta = $('#section1-code'); if (ta) ta.value = pg.code; }
			}
			// Section 2 (if present)
			const s2 = sections[2];
			if (s2) {
				const s2Btn = $('button.nav-btn[data-target="section2"]'); if (s2Btn) s2Btn.textContent = `Section 2: ${s2.title || '[Topic]'}`;
				const s2Sec = $('#section2'); if (s2Sec) {
					const s2Title = $('#section2 .lesson-title'); if (s2Title) s2Title.textContent = `Section 2: ${s2.title || ''}`;
					const s2Content = $('#section2 .lesson-content'); if (s2Content) renderBlocks(s2Content, s2.content||[]);
					const s2Exercise = $('#section2 .exercise'); if (s2Exercise && s2.quiz) renderQuizzes(s2Exercise, 'section2', s2.quiz);
				}
			}
			// Final (if last section name contains project) leave as template
		}catch(e){ console.error('Failed to hydrate courseTemp:', e); }
	}

	document.addEventListener('DOMContentLoaded', hydrate);
})(); 