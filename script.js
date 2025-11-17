const permissionOverlay = document.getElementById('permission-overlay');
const grantButton = document.getElementById('grant-permission');
const textInput = document.getElementById('text-input');
const debugInfo = document.getElementById('debug-info');

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
        const clampedItalic = Math.max(0, Math.min(100, italicValue));
        
        // font-variation-settings 업데이트
        textInput.style.fontVariationSettings = `'wght' 90, 'wdth' 100, 'ital' ${clampedItalic}`;
        
        // 디버그 정보 표시
        debugInfo.textContent = `gamma: ${gamma.toFixed(1)}° | italic: ${clampedItalic.toFixed(1)}`;
    }
}