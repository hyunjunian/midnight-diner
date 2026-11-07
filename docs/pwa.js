(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const standalone = () => navigator.standalone === true ||
    ['standalone', 'fullscreen', 'minimal-ui'].some(mode => matchMedia(`(display-mode: ${mode})`).matches);
  let installPrompt = null, registration = null, applyingUpdate = false, launched = false;
  function launch() {
    if (launched) return;
    launched = true; $('install-screen').hidden = true; window.MidnightApp.launch();
  }
  function installGuide() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|CriOS/.test(navigator.userAgent);
    $('install-guide').hidden = false;
    $('install-guide').innerHTML = ios ? '<p>Safari에서 <b>공유 ↑ → 홈 화면에 추가</b>를 선택해 주세요.</p><p>설치한 심야식당 아이콘을 누르면 게임이 시작됩니다.</p>' : safari ? '<p>Safari의 <b>파일 → Dock에 추가</b>를 선택해 주세요.</p><p>Dock의 심야식당 아이콘에서 게임을 실행해 주세요.</p>' : '<p>Chrome 또는 Edge의 주소창에 있는 <b>설치 아이콘</b>이나 브라우저 메뉴의 <b>앱 설치 / 홈 화면에 추가</b>를 선택해 주세요.</p><p>설치한 심야식당 아이콘을 누르면 게임이 시작됩니다.</p>';
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event;
    $('install-app').textContent = '앱 설치하기 ↓';
    $('install-hint').textContent = '한 번 설치하면 인터넷 없이도 식당을 열 수 있어요.';
  });
  $('install-app').addEventListener('click', async () => {
    if (!installPrompt) return installGuide();
    const prompt = installPrompt; installPrompt = null;
    try {
      await prompt.prompt(); const choice = await prompt.userChoice;
      $('install-status').textContent = choice.outcome === 'accepted' ? '설치한 심야식당 아이콘에서 실행해 주세요.' : '준비되면 언제든 다시 설치할 수 있어요.';
    } catch { installGuide(); }
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null; $('install-app').textContent = '설치한 아이콘에서 실행해 주세요';
    $('install-status').textContent = '앱 설치가 완료되었습니다.';
  });
  const mode = matchMedia('(display-mode: standalone)');
  mode.addEventListener?.('change', () => { if (standalone()) launch(); });
  const full = matchMedia('(display-mode: fullscreen)');
  full.addEventListener?.('change', () => { if (standalone()) launch(); });
  if (standalone()) launch();
  else $('install-screen').hidden = false;

  function updateAvailable() {
    $('update-app').hidden = false;
    $('offline-status').textContent = '새 버전이 준비됐어요. 진행을 저장하고 다시 열 수 있어요.';
  }
  $('update-app').addEventListener('click', () => {
    if (!registration?.waiting) return;
    if (window.MidnightApp.isCooking()) return;
    window.MidnightApp.save(); applyingUpdate = true; registration.waiting.postMessage({type: 'SKIP_WAITING'});
  });
  navigator.serviceWorker?.addEventListener('controllerchange', () => { if (applyingUpdate) location.reload(); });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js', {scope: './', updateViaCache: 'none'}).then(async reg => {
      registration = reg;
      if (reg.waiting) updateAvailable();
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) updateAvailable();
          if (worker.state === 'redundant') {
            $('offline-status').textContent = '오프라인 저장을 완료하지 못했어요. 연결과 저장 공간을 확인해 주세요.';
            $('install-status').textContent = '오프라인 준비가 중단됐어요. 연결과 저장 공간을 확인해 주세요.';
          }
        });
      });
      await navigator.serviceWorker.ready;
      if (!reg.waiting) $('offline-status').textContent = '인트로와 게임이 저장됐어요. 오프라인으로 실행할 수 있어요.';
      $('install-status').textContent = '오프라인 실행 준비 완료';
    }).catch(() => {
      $('offline-status').textContent = '오프라인 저장에 실패했어요. 연결과 저장 공간을 확인해 주세요.';
      $('install-status').textContent = '앱 설치 준비를 완료하지 못했어요. 다시 연결해 주세요.';
    });
  } else {
    $('offline-status').textContent = '이 환경에서는 앱 설치와 오프라인 저장을 지원하지 않아요.';
    $('install-status').textContent = 'HTTPS에서 Chrome·Edge 또는 Safari로 열어 주세요.';
  }
})();
