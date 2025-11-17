const permissionOverlay = document.getElementById('permission-overlay');
const grantButton = document.getElementById('grant-permission');
const textInput = document.getElementById('text-input');
const debugInfo = document.getElementById('debug-info');

let currentItalicValue = 50; // 현재 italic 값 저장

// 권한 요청 버튼 클릭
grantButton.addEventListener('click', async () => {
    // iOS 13+ 권한 요청
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                startOrientationTracking();
                permissionOverlay.classList.add('hidden');
            }
        } catch (error) {
            console.error('Permission error:', error);
        }
    } else {
        // Android 또는 iOS 12 이하
        startOrientationTracking();
        permissionOverlay.classList.add('hidden');
    }
});

// 방향 센서 추적 시작
function startOrientationTracking() {
    window.addEventListener('deviceorientation', handleOrientation);
}

// 방향 센서 처리
function handleOrientation(event) {
    const gamma = event.gamma; // 좌우 기울기: -90 ~ +90
    
    if (gamma !== null) {
        // gamma를 italic axis 값으로 변환 (0-100)
        const italicValue = ((gamma + 90) / 180) * 100;
        
        // 범위 제한
        currentItalicValue = Math.max(0, Math.min(100, italicValue));
        
        // 디버그 정보 표시
        debugInfo.textContent = `gamma: ${gamma.toFixed(1)}° | italic: ${currentItalicValue.toFixed(1)}`;
    }
}

// 텍스트 입력 처리
textInput.addEventListener('input', handleInput);

function handleInput(event) {
    // 현재 커서 위치 저장
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const cursorOffset = getCursorOffset(textInput, range);
    
    // 모든 텍스트 노드를 span으로 감싸기
    processTextNodes(textInput);
    
    // 커서 위치 복원
    restoreCursor(textInput, cursorOffset);
}

function processTextNodes(element) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.textContent.trim() !== '') {
            textNodes.push(node);
        }
    }
    
    textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const fragment = document.createDocumentFragment();
        
        for (let char of text) {
            const span = document.createElement('span');
            span.textContent = char;
            
            // 이미 span으로 감싸진 것이 아닌 새 글자만 현재 italic 값 적용
            if (!textNode.parentElement || textNode.parentElement.tagName !== 'SPAN') {
                span.style.fontVariationSettings = `'wght' 90, 'wdth' 100, 'ital' ${currentItalicValue}`;
            }
            
            fragment.appendChild(span);
        }
        
        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

function getCursorOffset(element, range) {
    const preRange = range.cloneRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.endContainer, range.endOffset);
    return preRange.toString().length;
}

function restoreCursor(element, offset) {
    const selection = window.getSelection();
    const range = document.createRange();
    
    let charCount = 0;
    let found = false;
    
    function searchNode(node) {
        if (found) return;
        
        if (node.nodeType === Node.TEXT_NODE) {
            const length = node.textContent.length;
            if (charCount + length >= offset) {
                range.setStart(node, offset - charCount);
                range.collapse(true);
                found = true;
                return;
            }
            charCount += length;
        } else {
            for (let child of node.childNodes) {
                searchNode(child);
                if (found) return;
            }
        }
    }
    
    searchNode(element);
    
    if (found) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
}