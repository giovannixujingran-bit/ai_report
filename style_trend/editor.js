let isEditMode = false;
const historyStack = [];

// Initialize Editor
document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.createElement('div');
    toolbar.id = 'editor-toolbar';
    toolbar.innerHTML = `
        <button id="toggle-edit" onclick="toggleEditMode()">Enable Edit Mode</button>
        <button id="undo-btn" onclick="undoLastAction()">Undo (Ctrl+Z)</button>
        <button id="export-btn" onclick="exportPage()">Export HTML</button>
    `;
    document.body.appendChild(toolbar);

    // Global Undo Listener
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undoLastAction();
        }
    });
});

function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById('toggle-edit');
    const body = document.body;

    if (isEditMode) {
        btn.textContent = 'Disable Edit Mode';
        btn.classList.add('active');
        body.classList.add('edit-mode-active');
        enableInteractions();
    } else {
        btn.textContent = 'Enable Edit Mode';
        btn.classList.remove('active');
        body.classList.remove('edit-mode-active');
        disableInteractions();
    }
}

function enableInteractions() {
    // Select broader range of elements, ensuring overlays are included
    const editables = document.querySelectorAll('h1, h2, h3, p, img, .cyber-item, .cyber-overlay');

    editables.forEach(el => {
        el.classList.add('editable');

        // Text Editing (contenteditable)
        // Exclude containers like .cyber-item/overlay from being contenteditable themselves, only their text children
        if (!['IMG', 'DIV', 'SECTION'].includes(el.tagName)) {
            el.contentEditable = true;
            // Record state before editing
            el.addEventListener('focus', () => {
                saveHistory(el, 'text', el.innerHTML);
            });
            // Check changes on blur
            el.addEventListener('blur', () => {
                const lastState = historyStack[historyStack.length - 1];
                if (lastState && lastState.target === el && lastState.val !== el.innerHTML) {
                    // Update the history entry or push new one? 
                    // For simplicity, we just rely on the 'focus' snapshot for undo
                }
            });
        }

        // Image Replacement
        if (el.tagName === 'IMG') {
            el.ondblclick = () => {
                const oldSrc = el.src;
                const newUrl = prompt('Enter new image URL:', el.src);
                if (newUrl && newUrl !== oldSrc) {
                    saveHistory(el, 'src', oldSrc);
                    el.src = newUrl;
                }
            }
        }

        // Drag Logic (Requires Shift Key)
        el.onmousedown = (e) => {
            if (!isEditMode) return;
            if (!e.shiftKey) return; // Pass through if Shift not held

            e.preventDefault();
            e.stopPropagation(); // detailed selection

            const startX = e.clientX;
            const startY = e.clientY;

            // Get initial transform
            const style = window.getComputedStyle(el);
            const matrix = new WebKitCSSMatrix(style.transform);
            const initialX = matrix.m41;
            const initialY = matrix.m42;
            const currentScale = matrix.a;

            saveHistory(el, 'transform', style.transform);

            document.onmousemove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                el.style.transform = `translate(${initialX + dx}px, ${initialY + dy}px) scale(${currentScale})`;
            };

            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };

        // Scale Logic (Wheel)
        el.onwheel = (e) => {
            if (!isEditMode) return;
            if (e.ctrlKey) return; // Allow normal zoom
            e.preventDefault();
            e.stopPropagation();

            // Save state on first scroll event? (Tricky due to continuous events)
            // Simplified: we won't undo every single scroll tick, maybe just let user manually reset if needed.

            const style = window.getComputedStyle(el);
            const matrix = new WebKitCSSMatrix(style.transform);
            let scale = matrix.a;

            if (e.deltaY < 0) scale += 0.05;
            else scale -= 0.05;

            if (scale < 0.1) scale = 0.1;

            el.style.transform = `translate(${matrix.m41}px, ${matrix.m42}px) scale(${scale})`;
        };
    });
}

function saveHistory(element, type, value) {
    historyStack.push({
        target: element,
        type: type,
        val: value
    });
    // Limit stack size
    if (historyStack.length > 50) historyStack.shift();
}

function undoLastAction() {
    if (historyStack.length === 0) return;
    const action = historyStack.pop();

    if (action.type === 'transform') {
        action.target.style.transform = action.val;
    } else if (action.type === 'text') {
        action.target.innerHTML = action.val;
    } else if (action.type === 'src') {
        action.target.src = action.val;
    }
}

function getCurrentScale(el) {
    const style = window.getComputedStyle(el);
    const matrix = new WebKitCSSMatrix(style.transform);
    return matrix.a;
}

function disableInteractions() {
    const editables = document.querySelectorAll('.editable');
    editables.forEach(el => {
        el.classList.remove('editable');
        el.contentEditable = false;
        el.onmousedown = null;
        el.onwheel = null;
        if (el.tagName === 'IMG') el.ondblclick = null;
    });
}

function exportPage() {
    const clone = document.documentElement.cloneNode(true);

    const toolbar = clone.querySelector('#editor-toolbar');
    if (toolbar) toolbar.remove();

    const editorScript = clone.querySelector('script[src="editor.js"]');
    if (editorScript) editorScript.remove();

    const editables = clone.querySelectorAll('.editable');
    editables.forEach(el => {
        el.classList.remove('editable');
        el.removeAttribute('contenteditable');
    });

    const body = clone.querySelector('body');
    body.classList.remove('edit-mode-active');

    const htmlContent = "<!DOCTYPE html>\n" + clone.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fashion_trend_report_static.html';
    a.click();
}
