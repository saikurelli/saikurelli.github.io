(function () {
	var outputEl = document.getElementById('terminal-output');
	var formEl = document.getElementById('terminal-form');
	var inputEl = document.getElementById('terminal-input');
	var suggestionsEl = document.getElementById('terminal-suggestions');
	var popoutButton = document.getElementById('terminal-popout');
	var terminalPane = document.querySelector('.terminal-pane');

	if (!outputEl || !formEl || !inputEl || !suggestionsEl || !terminalPane) {
		return;
	}

	var commandList = ['help', 'ls', 'cat', 'pwd', 'whoami', 'date', 'open', 'history', 'theme', 'ask', 'intro', 'work', 'about', 'contact', 'resume', 'github', 'devpost', 'clear'];
	var sectionCommands = ['intro', 'work', 'about', 'contact', 'resume'];
	var commandArgs = {
		'open':  ['intro', 'work', 'about', 'contact', 'resume'],
		'theme': ['dark', 'light', 'toggle', 'status']
	};
	var virtualFiles = {
		'about.txt': 'I am Sai Kurelli. I studied Computer Science at UT Austin and enjoy turning complex problems into clean, well-engineered solutions.',
		'work.txt': 'Most of my projects are on GitHub (https://github.com/saikurelli). I also build on Devpost (https://devpost.com/saikurelli) — check out my hackathon submissions there.',
		'contact.txt': 'Email: saikurelli1@gmail.com\nGitHub: https://github.com/saikurelli\nLinkedIn: https://www.linkedin.com/in/sai-kurelli/',
		'resume.txt': 'Resume: https://saikurelli.github.io/resume/',
		'.plans.txt': 'Planned next steps include search, richer terminal commands, and optional personalization controls.'
	};
	var virtualFileMeta = {
		'about.txt':   { permissions: '-rw-r--r--', modified: new Date('2025-01-15T10:30:00') },
		'work.txt':    { permissions: '-rw-r--r--', modified: new Date('2025-03-20T14:45:00') },
		'contact.txt': { permissions: '-rw-r--r--', modified: new Date('2025-04-01T09:15:00') },
		'resume.txt':  { permissions: '-rw-r--r--', modified: new Date('2025-02-10T16:20:00') },
		'.plans.txt':  { permissions: '-rw-------', modified: new Date('2025-05-01T12:00:00') }
	};
	// Resume knowledge base — each entry has keyword triggers and a plain-text answer.
	var resumeKnowledgeBase = [
		{
			keywords: ['name', 'who are you', 'who is', 'introduce', 'yourself', 'sai', 'saikurelli', 'sairaja'],
			answer: "I'm Sai Kurelli (Sairaja Kurelli) — a software engineer who studied Computer Science at The University of Texas at Austin. I enjoy building practical software with clean architecture and a strong developer experience."
		},
		{
			keywords: ['education', 'university', 'college', 'school', 'degree', 'study', 'studied', 'major', 'ut austin', 'texas', 'cs degree', 'computer science', 'graduate', 'graduated'],
			answer: "Sai studied Computer Science at The University of Texas at Austin. The program included systems-heavy coursework. He was also active in ACM, UT's close-knit CS community."
		},
		{
			keywords: ['acm', 'club', 'organization', 'vice president', 'vp', 'finance', 'community', 'student org', 'student organization', 'leadership'],
			answer: "At UT Austin, Sai served as ACM's Vice President of Finance — helping plan budgets and community events for one of UT's largest engineering organizations."
		},
		{
			keywords: ['skill', 'skills', 'technology', 'technologies', 'tech stack', 'languages', 'tools', 'programming', 'proficient', 'expertise'],
			answer: "Sai's focus areas include backend systems, high-level system design, and developer tooling. He values clean architecture, readable code, and maintainable engineering choices."
		},
		{
			keywords: ['backend', 'back-end', 'server', 'systems', 'system design', 'infrastructure', 'api', 'database'],
			answer: "Sai's primary technical focus is backend systems and system design. He enjoys high-level architectural thinking and building reliable, well-structured server-side software."
		},
		{
			keywords: ['project', 'projects', 'hackathon', 'devpost', 'side project', 'portfolio', 'worked on', 'created', 'developed', 'built'],
			answer: "Sai's projects live on GitHub (https://github.com/saikurelli) and Devpost (https://devpost.com/saikurelli). He has hackathon submissions and personal projects at both. Type 'github' or 'devpost' to open them directly."
		},
		{
			keywords: ['github', 'git', 'repository', 'repositories', 'repo', 'open source', 'contributions', 'contribution graph'],
			answer: "Sai's GitHub is at https://github.com/saikurelli — the contribution graph may include private projects too. Type 'github' to open it in a new tab."
		},
		{
			keywords: ['contact', 'reach', 'email', 'linkedin', 'message', 'hire', 'hiring', 'connect', 'social', 'talk'],
			answer: "You can reach Sai via:\n  Email: saikurelli1@gmail.com\n  LinkedIn: https://www.linkedin.com/in/sai-kurelli/\n  GitHub: https://github.com/saikurelli\nType 'contact' to open the contact section."
		},
		{
			keywords: ['interest', 'interests', 'like', 'enjoy', 'passion', 'passionate', 'love', 'focus', 'currently', 'working on', 'goal', 'goals'],
			answer: "Sai is especially interested in terminal-inspired UX patterns, practical automation, backend systems, and maintainable engineering decisions. He prefers iterative delivery and readable code."
		},
		{
			keywords: ['resume', 'cv', 'curriculum vitae', 'download', 'pdf', 'work history', 'employment', 'experience'],
			answer: "Sai's full resume is available at https://saikurelli.github.io/resume/. Type 'resume' to open the resume section."
		},
		{
			keywords: ['website', 'site', 'portfolio site', 'how was', 'built with', 'made with', 'framework', 'html', 'css', 'javascript', 'terminal ui'],
			answer: "This portfolio is built with HTML, CSS, and vanilla JavaScript. It uses a terminal-inspired UX to make navigation fast and fun — the shell-like interface is intentional!"
		},
		{
			keywords: ['available', 'availability', 'open to', 'looking for', 'job search', 'internship', 'full time', 'full-time', 'opportunity', 'opportunities', 'collaborate'],
			answer: "For availability and opportunities, reach out directly: email saikurelli1@gmail.com or connect on LinkedIn at https://www.linkedin.com/in/sai-kurelli/."
		}
	];

	function matchResumeQuestion(question) {
		var q = question.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
		var best = null;
		var bestScore = 0;

		resumeKnowledgeBase.forEach(function (entry) {
			var score = 0;
			entry.keywords.forEach(function (kw) {
				if (q.indexOf(kw) >= 0) {
					// Longer keyword phrases get higher weight so precise matches win.
					score += kw.split(' ').length;
				}
			});
			if (score > bestScore) {
				bestScore = score;
				best = entry;
			}
		});

		return bestScore > 0 ? best.answer : null;
	}

	function printAgentAnswer(answer) {
		var thinkingLine = document.createElement('div');
		thinkingLine.className = 'terminal-line cmd-muted';
		thinkingLine.textContent = 'Thinking…';
		outputEl.appendChild(thinkingLine);
		outputEl.scrollTop = outputEl.scrollHeight;

		setTimeout(function () {
			outputEl.removeChild(thinkingLine);

			var lines = answer.split('\n');
			lines.forEach(function (line) {
				var el = document.createElement('div');
				el.className = 'terminal-line agent-answer';
				el.textContent = line;
				outputEl.appendChild(el);
			});
			outputEl.scrollTop = outputEl.scrollHeight;
		}, 500);
	}

	var history = [];
	var historyIndex = -1;
	var themeStorageKey = 'saikurelli-theme';
	var tabMatches = [];
	var tabMatchIndex = -1;

	function escapeHtml(text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function printHTML(html, cssClass) {
		var line = document.createElement('div');
		line.className = 'terminal-line' + (cssClass ? ' ' + cssClass : '');
		line.innerHTML = html;
		outputEl.appendChild(line);
		outputEl.scrollTop = outputEl.scrollHeight;
	}

	function getTheme() {
		return document.body.classList.contains('theme-light') ? 'light' : 'dark';
	}

	function setTheme(theme) {
		if (theme === 'light') {
			document.body.classList.add('theme-light');
		} else {
			document.body.classList.remove('theme-light');
		}

		try {
			window.localStorage.setItem(themeStorageKey, theme);
		} catch (error) {
			// Ignore storage errors silently.
		}
	}

	function initializeTheme() {
		var savedTheme = 'dark';
		try {
			savedTheme = window.localStorage.getItem(themeStorageKey) || 'dark';
		} catch (error) {
			savedTheme = 'dark';
		}

		setTheme(savedTheme === 'light' ? 'light' : 'dark');
	}

	function setPopoutState(isPopout) {
		terminalPane.classList.toggle('popout', isPopout);
		document.body.classList.toggle('terminal-popout-active', isPopout);
		if (popoutButton) {
			popoutButton.textContent = isPopout ? 'Close' : 'Pop Out';
		}
	}

	function printLine(text, cssClass) {
		var line = document.createElement('div');
		line.className = 'terminal-line' + (cssClass ? ' ' + cssClass : '');
		line.textContent = text;
		outputEl.appendChild(line);
		outputEl.scrollTop = outputEl.scrollHeight;
	}

	function printLines(lines) {
		lines.forEach(function (line) {
			printLine(line);
		});
	}

	function openSection(section) {
		printHTML('<span class="cmd-info">Opening ' + escapeHtml(section.charAt(0).toUpperCase() + section.slice(1)) + ' section...</span>');
		window.location.hash = '#' + section;
	}

	function runCommand(rawValue) {
		var value = rawValue.trim();
		var normalized = value.toLowerCase();
		var parts = normalized.split(/\s+/).filter(Boolean);
		var command = parts[0] || '';
		var args = parts.slice(1);

		if (!normalized) {
			return;
		}

		var echoArgs = parts.slice(1).join(' ');
		printHTML(
			'<span class="cmd-prompt">&gt;</span>' +
			' <span class="cmd-highlight">' + escapeHtml(command) + '</span>' +
			(echoArgs ? ' <span class="cmd-muted">' + escapeHtml(echoArgs) + '</span>' : '')
		);

		if (command === 'clear') {
			outputEl.innerHTML = '';
			printHTML('<span class="cmd-info">Terminal cleared. Type \'help\' to explore.</span>');
			return;
		}

		if (command === 'help') {
			printLine('Available commands:');
			[
				['ls', '[-l] [-a] [-t] [-r] [file]'],
				['cat', '&lt;about.txt|work.txt|contact.txt|resume.txt&gt;'],
				['pwd', ''],
				['whoami', ''],
				['date', ''],
				['history', ''],
				['theme', '&lt;dark|light|toggle|status&gt;'],
				['ask', '&lt;question about Sai&gt;'],
				['open', '&lt;intro|work|about|contact|resume&gt;'],
				['intro', ''],
				['work', ''],
				['about', ''],
				['contact', ''],
				['resume', ''],
				['github', ''],
				['devpost', ''],
				['clear', '']
			].forEach(function (entry) {
				var cmd = entry[0];
				var args = entry[1];
				printHTML(
					'  <span class="cmd-highlight">' + cmd + '</span>' +
					(args ? ' <span class="cmd-muted">' + args + '</span>' : '')
				);
			});
			printLine('');
			printLine('Keyboard shortcuts:');
			[
				['Ctrl+L', 'clear terminal output'],
				['Ctrl+U', 'clear current input line'],
				['Ctrl+`', 'toggle pop-out mode'],
				['Escape', 'close pop-out mode'],
				['↑ / ↓', 'navigate command history'],
				['Tab', 'autocomplete command or argument']
			].forEach(function (entry) {
				printHTML(
					'  <span class="cmd-highlight">' + escapeHtml(entry[0]) + '</span>' +
					'  <span class="cmd-muted">' + escapeHtml(entry[1]) + '</span>'
				);
			});
			return;
		}

		if (command === 'ls') {
			// Parse flags and optional file-name argument
			var lsFlags = '';
			var lsTarget = '';
			args.forEach(function (a) {
				if (a.charAt(0) === '-') {
					lsFlags += a.slice(1);
				} else {
					lsTarget = a;
				}
			});

			var showLong    = lsFlags.indexOf('l') >= 0;
			var showHidden  = lsFlags.indexOf('a') >= 0;
			var sortByTime  = lsFlags.indexOf('t') >= 0;
			var reverseSort = lsFlags.indexOf('r') >= 0;

			var fileNames = lsTarget
				? (lsTarget in virtualFiles ? [lsTarget] : [])
				: Object.keys(virtualFiles).filter(function (name) {
					return showHidden || name.charAt(0) !== '.';
				});

			if (lsTarget && !fileNames.length) {
				printHTML('<span class="cmd-error">ls: ' + escapeHtml(lsTarget) + ': No such file</span>');
				return;
			}

			if (sortByTime) {
				fileNames.sort(function (a, b) {
					return virtualFileMeta[b].modified - virtualFileMeta[a].modified;
				});
			}

			if (reverseSort) {
				fileNames.reverse();
			}

			if (showLong) {
				fileNames.forEach(function (name) {
					var meta = virtualFileMeta[name];
					var d = meta.modified;
					var dateStr = d.toLocaleDateString('en-US', { month: 'short' }) + ' ' + String(d.getDate()).padStart(2, '0') + ' ' + d.getFullYear();
					var size = (virtualFiles[name] || '').length;
					printHTML(
						'<span class="cmd-muted">' + escapeHtml(meta.permissions) +
						' 1 saikurelli saikurelli ' + String(size).padStart(5) +
						' ' + escapeHtml(dateStr) + '</span>' +
						' <span class="cmd-file">' + escapeHtml(name) + '</span>'
					);
				});
			} else {
				var fileHtml = fileNames.map(function (name) {
					return '<span class="cmd-file">' + escapeHtml(name) + '</span>';
				}).join('  ');
				printHTML(fileHtml);
			}
			return;
		}

		if (command === 'cat') {
			var fileName = args[0] || '';
			if (!fileName) {
				printHTML('<span class="cmd-error">Usage: cat &lt;' + Object.keys(virtualFiles).map(escapeHtml).join('|') + '&gt;</span>');
				return;
			}

			if (!(fileName in virtualFiles)) {
				printHTML('<span class="cmd-error">cat: ' + escapeHtml(fileName) + ': No such file</span>');
				return;
			}

			virtualFiles[fileName].split('\n').forEach(function (line) {
				printLine(line);
			});
			return;
		}

		if (command === 'pwd') {
			printHTML('<span class="cmd-path">/home/saikurelli/portfolio</span>');
			return;
		}

		if (command === 'whoami') {
			printHTML('<span class="cmd-value">saikurelli</span>');
			return;
		}

		if (command === 'date') {
			printHTML('<span class="cmd-value">' + escapeHtml(new Date().toString()) + '</span>');
			return;
		}

		if (command === 'history') {
			if (!history.length) {
				printHTML('<span class="cmd-info">No commands in history yet.</span>');
				return;
			}

			history.forEach(function (historyCommand, index) {
				printHTML(
					'<span class="cmd-muted">' + (index + 1) + '</span>' +
					'  <span class="cmd-highlight">' + escapeHtml(historyCommand.trim()) + '</span>'
				);
			});
			return;
		}

		if (command === 'theme') {
			var themeArg = args[0] || 'toggle';

			if (themeArg === 'status') {
				printHTML('<span class="cmd-info">Theme: </span><span class="cmd-value">' + escapeHtml(getTheme()) + '</span>');
				return;
			}

			if (themeArg === 'dark' || themeArg === 'light') {
				setTheme(themeArg);
				printHTML('<span class="cmd-info">Theme set to </span><span class="cmd-value">' + escapeHtml(themeArg) + '</span><span class="cmd-info">.</span>');
				return;
			}

			if (themeArg === 'toggle') {
				var nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
				setTheme(nextTheme);
				printHTML('<span class="cmd-info">Theme set to </span><span class="cmd-value">' + escapeHtml(nextTheme) + '</span><span class="cmd-info">.</span>');
				return;
			}

			printLine('Usage: theme <dark|light|toggle|status>');
			return;
		}

		if (command === 'open') {
			var section = args[0] || '';
			if (sectionCommands.indexOf(section) < 0) {
				printLine("Usage: open <intro|work|about|contact|resume>");
				return;
			}
			openSection(section);
			return;
		}

		if (command === 'github') {
			printHTML('<span class="cmd-info">Opening GitHub profile...</span>');
			window.open('https://github.com/saikurelli', '_blank', 'noopener,noreferrer');
			return;
		}

		if (command === 'devpost') {
			printHTML('<span class="cmd-info">Opening Devpost profile...</span>');
			window.open('https://devpost.com/saikurelli', '_blank', 'noopener,noreferrer');
			return;
		}

		if (sectionCommands.indexOf(command) >= 0) {
			openSection(command);
			return;
		}

		if (command === 'ask') {
			var question = args.join(' ').trim();
			if (!question) {
				printHTML('<span class="cmd-info">Usage: ask &lt;question about Sai&gt;</span>');
				printHTML('<span class="cmd-muted">Examples: ask what did you study? &nbsp; ask what are your skills? &nbsp; ask how to contact you?</span>');
				return;
			}

			var answer = matchResumeQuestion(question);
			if (answer) {
				printAgentAnswer(answer);
			} else {
				printHTML('<span class="cmd-muted">Hmm, I\'m not sure about that. Try asking about education, skills, projects, contact, or interests.</span>');
			}
			return;
		}

		printHTML('<span class="cmd-error">Unknown command: \'' + escapeHtml(command) + '\'.</span> Type \'help\'.');
	}

	function renderSuggestions(inputValue) {
		var value = inputValue.trim().toLowerCase();
		suggestionsEl.innerHTML = '';

		if (!value) {
			return;
		}

		var matches = commandList.filter(function (command) {
			return command.indexOf(value) === 0;
		}).slice(0, 6);

		matches.forEach(function (command) {
			var item = document.createElement('button');
			item.type = 'button';
			item.className = 'suggestion-item';
			item.textContent = command;
			item.setAttribute('aria-label', 'Insert command: ' + command);
			item.addEventListener('click', function () {
				inputEl.value = command;
				suggestionsEl.innerHTML = '';
				inputEl.focus();
			});
			suggestionsEl.appendChild(item);
		});
	}

	terminalPane.addEventListener('click', function (event) {
		var tag = event.target.tagName.toLowerCase();
		if (tag !== 'input' && tag !== 'button' && tag !== 'a') {
			inputEl.focus();
		}
	});

	formEl.addEventListener('submit', function (event) {
		event.preventDefault();
		var value = inputEl.value;
		runCommand(value);
		if (value.trim()) {
			history.push(value);
		}
		historyIndex = history.length;
		inputEl.value = '';
		suggestionsEl.innerHTML = '';
	});

	inputEl.addEventListener('input', function (event) {
		renderSuggestions(event.target.value);
	});

	inputEl.addEventListener('keydown', function (event) {
		if (event.ctrlKey && event.key === 'l') {
			event.preventDefault();
			outputEl.innerHTML = '';
			printHTML('<span class="cmd-info">Terminal cleared. Type \'help\' to explore.</span>');
			return;
		}

		if (event.ctrlKey && event.key === 'u') {
			event.preventDefault();
			inputEl.value = '';
			suggestionsEl.innerHTML = '';
			tabMatches = [];
			tabMatchIndex = -1;
			return;
		}

		if (event.key === 'Tab') {
			event.preventDefault();
			var value = inputEl.value;
			var parts = value.split(/\s+/);
			var cmd = parts[0] ? parts[0].toLowerCase() : '';
			var isArgPosition = parts.length > 1 || (parts.length === 1 && value.slice(-1) === ' ');

			if (!isArgPosition) {
				// Complete the command name
				var cmdMatches = commandList.filter(function (c) {
					return c.indexOf(cmd) === 0;
				});

				if (cmdMatches.length === 0) {
					return;
				}

				if (event.shiftKey) {
					if (tabMatches.join(',') !== cmdMatches.join(',')) {
						tabMatches = cmdMatches;
						tabMatchIndex = cmdMatches.length;
					}
					tabMatchIndex = (tabMatchIndex <= 0 ? cmdMatches.length : tabMatchIndex) - 1;
				} else {
					if (tabMatches.join(',') !== cmdMatches.join(',')) {
						tabMatches = cmdMatches;
						tabMatchIndex = -1;
					}
					tabMatchIndex = (tabMatchIndex + 1) % cmdMatches.length;
				}

				if (cmdMatches.length === 1) {
					inputEl.value = cmdMatches[0] + ' ';
					tabMatches = [];
					tabMatchIndex = -1;
				} else {
					inputEl.value = tabMatches[tabMatchIndex];
				}
				renderSuggestions(inputEl.value);
			} else {
				// Complete the argument
				var arg = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
				var options = [];
				if (cmd === 'cat' || cmd === 'ls') {
					options = Object.keys(virtualFiles);
				} else if (commandArgs[cmd]) {
					options = commandArgs[cmd].slice();
				}

				var argMatches = options.filter(function (o) {
					return o.indexOf(arg) === 0;
				});

				if (argMatches.length === 0) {
					return;
				}

				if (event.shiftKey) {
					if (tabMatches.join(',') !== argMatches.join(',')) {
						tabMatches = argMatches;
						tabMatchIndex = argMatches.length;
					}
					tabMatchIndex = (tabMatchIndex <= 0 ? argMatches.length : tabMatchIndex) - 1;
				} else {
					if (tabMatches.join(',') !== argMatches.join(',')) {
						tabMatches = argMatches;
						tabMatchIndex = -1;
					}
					tabMatchIndex = (tabMatchIndex + 1) % argMatches.length;
				}

				inputEl.value = cmd + ' ' + tabMatches[tabMatchIndex];
				renderSuggestions('');
			}
			return;
		}

		// Reset tab cycle state on non-Tab, non-navigation keys
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
			tabMatches = [];
			tabMatchIndex = -1;
		}

		if (!history.length) {
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			historyIndex = Math.max(0, historyIndex - 1);
			inputEl.value = history[historyIndex] || '';
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			historyIndex = Math.min(history.length, historyIndex + 1);
			if (historyIndex === history.length) {
				inputEl.value = '';
			} else {
				inputEl.value = history[historyIndex];
			}
		}
	});

	document.querySelectorAll('[data-terminal-cmd]').forEach(function (button) {
		button.addEventListener('click', function () {
			var command = button.getAttribute('data-terminal-cmd') || '';
			runCommand(command);
			inputEl.focus();
		});
	});

	if (popoutButton) {
		popoutButton.addEventListener('click', function () {
			var isPopout = !terminalPane.classList.contains('popout');
			setPopoutState(isPopout);
			inputEl.focus();
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && terminalPane.classList.contains('popout')) {
				setPopoutState(false);
				inputEl.focus();
				return;
			}

			if (event.ctrlKey && event.key === '`') {
				event.preventDefault();
				var isPopout = !terminalPane.classList.contains('popout');
				setPopoutState(isPopout);
				inputEl.focus();
			}
		});
	}

	setPopoutState(false);
	initializeTheme();
})();
