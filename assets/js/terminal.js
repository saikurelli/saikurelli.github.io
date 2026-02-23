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

	var commandList = ['help', 'ls', 'cat', 'pwd', 'whoami', 'date', 'open', 'history', 'theme', 'intro', 'work', 'about', 'contact', 'github', 'clear'];
	var sectionCommands = ['intro', 'work', 'about', 'contact'];
	var virtualFiles = {
		'about.txt': 'I am Sai Kurelli. I studied Computer Science at UT Austin and enjoy building practical software with clear architecture.',
		'work.txt': 'Most of my projects are on GitHub. I focus on backend systems, automation, and terminal-inspired UX patterns.',
		'contact.txt': 'Email: saikurelli1@gmail.com\nGitHub: https://github.com/saikurelli\nLinkedIn: https://www.linkedin.com/in/sai-kurelli/',
		'resume.txt': 'Resume: https://saikurelli.github.io/resume/'
	};
	var history = [];
	var historyIndex = -1;
	var themeStorageKey = 'saikurelli-theme';

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
		printLine('Opening ' + section.charAt(0).toUpperCase() + section.slice(1) + ' section...');
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

		printLine('$ ' + normalized);

		if (command === 'clear') {
			outputEl.innerHTML = '';
			printLine("Terminal cleared. Try 'help'.");
			return;
		}

		if (command === 'help') {
			printLines([
				'Available commands:',
				'- ls',
				'- cat <about.txt|work.txt|contact.txt|resume.txt>',
				'- pwd, whoami, date',
				'- history',
				'- theme <dark|light|toggle|status>',
				'- open <intro|work|about|contact>',
				'- intro, work, about, contact, github, clear'
			]);
			return;
		}

		if (command === 'ls') {
			printLine('about.txt  work.txt  contact.txt  resume.txt');
			return;
		}

		if (command === 'cat') {
			var fileName = args[0] || '';
			if (!fileName) {
				printLine("Usage: cat <about.txt|work.txt|contact.txt|resume.txt>");
				return;
			}

			if (!(fileName in virtualFiles)) {
				printLine("cat: " + fileName + ': No such file');
				return;
			}

			virtualFiles[fileName].split('\n').forEach(function (line) {
				printLine(line);
			});
			return;
		}

		if (command === 'pwd') {
			printLine('/home/saikurelli/portfolio');
			return;
		}

		if (command === 'whoami') {
			printLine('saikurelli');
			return;
		}

		if (command === 'date') {
			printLine(new Date().toString());
			return;
		}

		if (command === 'history') {
			if (!history.length) {
				printLine('No commands in history yet.');
				return;
			}

			history.forEach(function (historyCommand, index) {
				printLine((index + 1) + '  ' + historyCommand.trim());
			});
			return;
		}

		if (command === 'theme') {
			var themeArg = args[0] || 'toggle';

			if (themeArg === 'status') {
				printLine('Theme: ' + getTheme());
				return;
			}

			if (themeArg === 'dark' || themeArg === 'light') {
				setTheme(themeArg);
				printLine('Theme set to ' + themeArg + '.');
				return;
			}

			if (themeArg === 'toggle') {
				var nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
				setTheme(nextTheme);
				printLine('Theme set to ' + nextTheme + '.');
				return;
			}

			printLine('Usage: theme <dark|light|toggle|status>');
			return;
		}

		if (command === 'open') {
			var section = args[0] || '';
			if (sectionCommands.indexOf(section) < 0) {
				printLine("Usage: open <intro|work|about|contact>");
				return;
			}
			openSection(section);
			return;
		}

		if (command === 'github') {
			printLine('Opening GitHub profile...');
			window.open('https://github.com/saikurelli', '_blank', 'noopener,noreferrer');
			return;
		}

		if (sectionCommands.indexOf(command) >= 0) {
			openSection(command);
			return;
		}

		printLine("Unknown command: '" + command + "'. Type 'help'.");
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
			inputEl.value = history[historyIndex] || '';
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
			}
		});
	}

	setPopoutState(false);
	initializeTheme();
})();
