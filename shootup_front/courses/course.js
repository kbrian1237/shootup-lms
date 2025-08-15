(function(){
	const qs = new URLSearchParams(location.search);
	const id = qs.get('id') || 'course_generic';
	const fileParam = qs.get('file');
	const fallbackMap = {
		'course_js': 'javascript.json',
		'course_backend': 'backend.json',
		'course_uiux': 'uiux.json',
		'course_html': 'html.json'
	};
	const jsonPath = fileParam ? fileParam : (id && fallbackMap[id] ? fallbackMap[id] : null);
	const STORAGE_KEY = 'courseProgress:' + id;

	function loadProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(_) { return {}; } }
	function saveProgress(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

	async function loadCourseData() {
		if (jsonPath) { const res = await fetch(jsonPath, { cache: 'no-store' }); return res.json(); }
		const all = await (window.ShootUpData && window.ShootUpData.load ? window.ShootUpData.load() : Promise.resolve({ courses: [] }));
		const course = (id && window.ShootUpData.getCourseById) ? window.ShootUpData.getCourseById(all, id) : (all.courses[0] || null);
		return course ? { title: course.title, category: course.category, level: course.level, rating: course.rating, description: course.description, banner: course.banner, outline: [], sections: [] } : null;
	}

	function el(id){ return document.getElementById(id); }
	function $(sel, root=document){ return root.querySelector(sel); }

	function renderNav(sections, progress){
		const nav = $('#course-nav'); if (!nav) return;
		nav.innerHTML = '';
		sections.forEach((s, i) => {
			const sid = 's-' + i;
			const a = document.createElement('a'); a.href = '#' + sid; a.textContent = (i+1) + '. ' + (s.title||('Section '+(i+1)));
			const locked = i>0 && !(progress.completed && progress.completed['s-'+(i-1)]);
			if (locked) { a.classList.add('pointer-events-none','opacity-50'); }
			nav.appendChild(a);
		});
	}

	function isPreviousComplete(progress, index) { if (index===0) return true; return !!(progress.completed && progress.completed['s-'+(index-1)]); }

	function runJS(code, outEl) {
		try { const fn = new Function('console', code); const buffer = []; const fakeConsole = { log: (...args) => buffer.push(args.map(a => typeof a==='object'? JSON.stringify(a): String(a)).join(' ')) }; fn(fakeConsole); outEl.textContent = buffer.join('\n'); } catch (e) { outEl.textContent = 'Error: ' + e.message; }
	}

	function renderSection(sec, index, progress) {
		const sid = 's-' + index;
		const container = document.createElement('section'); container.className = 'course-section'; container.id = sid;
		const locked = !isPreviousComplete(progress, index);
		container.innerHTML = `<h3 class="text-xl font-bold mb-3">${sec.title || 'Section ' + (index+1)}</h3>`;
		const body = document.createElement('div');
		if (locked) { body.innerHTML = '<p class="text-gray-400">Complete previous section to unlock this content.</p>'; container.appendChild(body); return container; }
		if (Array.isArray(sec.content)) {
			sec.content.forEach(block => {
				if (block.type === 'p') { const p = document.createElement('p'); p.className='text-gray-300 mb-3'; p.textContent = block.text||''; body.appendChild(p); }
				else if (block.type === 'img') { const img = document.createElement('img'); img.src=block.src; img.alt=block.alt||''; img.className='rounded-xl mb-3'; body.appendChild(img); }
				else if (block.type === 'code') { const pre=document.createElement('pre'); pre.innerHTML=`<code>${block.code||''}</code>`; body.appendChild(pre); if (block.playground===true){ const wrap=document.createElement('div'); wrap.className='mt-2'; const btn=document.createElement('button'); btn.className='px-3 py-1 bg-indigo-600 rounded mr-2'; btn.textContent='Run'; const out=document.createElement('pre'); out.className='mt-2 p-2 rounded bg-black/50'; btn.addEventListener('click',()=>runJS(block.code||'',out)); wrap.appendChild(btn); wrap.appendChild(out); body.appendChild(wrap);} }
			});
		}
		if (sec.quiz && Array.isArray(sec.quiz.questions) && sec.quiz.questions.length){
			const quizEl=document.createElement('div'); quizEl.className='mt-4 p-4 rounded bg-black/30 border border-white/10'; quizEl.innerHTML = `<h4 class="font-semibold mb-2">Quiz</h4>`; const form=document.createElement('form');
			sec.quiz.questions.forEach((q, qi)=>{ const qWrap=document.createElement('div'); qWrap.className='mb-3'; const qId=`${sid}-q-${qi}`; qWrap.innerHTML = `<p class=\"mb-1\">${qi+1}. ${q.prompt}</p>` + (q.choices||[]).map((choice,ci)=>`<label class=\"block\"><input type=\"radio\" name=\"${qId}\" value=\"${ci}\"> ${choice}</label>`).join(''); form.appendChild(qWrap); });
			const feedback=document.createElement('div'); feedback.className='text-sm mt-2'; const submitBtn=document.createElement('button'); submitBtn.type='button'; submitBtn.className='mt-2 px-3 py-1 rounded bg-green-600'; submitBtn.textContent='Check Answers';
			submitBtn.addEventListener('click',()=>{ let allCorrect=true; sec.quiz.questions.forEach((q,qi)=>{ const qId=`${sid}-q-${qi}`; const sel=form.querySelector(`input[name=\"${qId}\"]:checked`); if(!sel || Number(sel.value)!==Number(q.answerIndex)) allCorrect=false; }); if(allCorrect){ feedback.textContent='Correct! Section completed.'; feedback.classList.remove('text-red-400'); feedback.classList.add('text-green-400'); const prog=loadProgress(); prog.completed=prog.completed||{}; prog.completed[sid]=true; saveProgress(prog); renderNav(window.__COURSE_SECTIONS, prog); } else { feedback.textContent='Some answers are incorrect. Please try again.'; feedback.classList.remove('text-green-400'); feedback.classList.add('text-red-400'); } });
			quizEl.appendChild(form); quizEl.appendChild(submitBtn); quizEl.appendChild(feedback); body.appendChild(quizEl);
		}
		const controls=document.createElement('div'); controls.className='flex justify-between mt-4'; const prevBtn=document.createElement('a'); prevBtn.className='px-3 py-1 rounded bg-gray-700 hover:bg-gray-600'; prevBtn.textContent='Prev'; const nextBtn=document.createElement('a'); nextBtn.className='px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500'; nextBtn.textContent='Next';
		const prevId=index>0?('#s-'+(index-1)):null; if(prevId){ prevBtn.href=prevId; } else { prevBtn.classList.add('pointer-events-none','opacity-50'); }
		const nextId=(index < (window.__COURSE_SECTIONS.length-1))?('#s-'+(index+1)):null; if(nextId){ const canGoNext=!!(loadProgress().completed && loadProgress().completed[sid]); if(canGoNext) nextBtn.href=nextId; else { nextBtn.classList.add('pointer-events-none','opacity-50'); } } else { nextBtn.classList.add('pointer-events-none','opacity-50'); }
		container.appendChild(body); container.appendChild(controls); return container;
	}

	function navigateToAllowed(){ const hash=location.hash||'#s-0'; const progress=loadProgress(); const index=Math.max(0, parseInt((hash.split('-')[1]||'0'),10)); if(!isPreviousComplete(progress,index)){ location.hash='#s-0'; } }

	loadCourseData().then(data=>{
		if(!data) return; document.title=data.title||'Course'; el('course-title').textContent=data.title||'Course'; if(data.banner){ const b=el('course-banner'); b.src=data.banner; b.classList.remove('hidden'); } el('course-category').textContent=data.category||''; el('course-level').textContent=data.level||''; el('course-rating').textContent=data.rating!=null? String(data.rating):''; el('course-description').textContent=data.description||'';
		window.__COURSE_SECTIONS = Array.isArray(data.sections)? data.sections:[]; const progress=loadProgress(); renderNav(window.__COURSE_SECTIONS, progress);
		const wrap=el('course-sections'); wrap.innerHTML=''; window.__COURSE_SECTIONS.forEach((sec,i)=>{ wrap.appendChild(renderSection(sec, i, progress)); }); navigateToAllowed();
	}).catch(()=>{});
})(); 