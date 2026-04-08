export {};

const refreshForm = document.querySelector<HTMLFormElement>('[data-admin-checks-refresh-form]');
const refreshButton = document.querySelector<HTMLButtonElement>('[data-admin-checks-refresh-button]');
const statusLiveEl = document.querySelector<HTMLElement>('[data-admin-checks-status-live]');

const FEEDBACK_KEY = 'admin-checks:refresh-feedback';
const LOADING_LABEL = '检测中...';
const SUCCESS_LABEL = '✅ 已重新检测';
const SUCCESS_TIMEOUT_MS = 2000;

const getDefaultLabel = (): string => refreshButton?.dataset.defaultLabel?.trim() || '重新检测';

const getCurrentFeedbackPath = (): string => {
  const query = new URLSearchParams(window.location.search).toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
};

const setLiveStatus = (state: 'idle' | 'loading' | 'done', message: string, announce = true) => {
  if (!statusLiveEl || announce === false) return;

  const liveState = statusLiveEl.dataset.state ?? '';
  const liveMessage = statusLiveEl.textContent?.trim() || '';
  if (liveState === state && liveMessage === message) return;

  statusLiveEl.dataset.state = state;
  statusLiveEl.textContent = message;
};

const clearLiveStatus = () => {
  if (!statusLiveEl) return;
  statusLiveEl.dataset.state = 'idle';
  statusLiveEl.textContent = '';
};

const setButtonState = (state: 'idle' | 'loading' | 'done', announce = false) => {
  if (!refreshButton) return;

  refreshButton.dataset.state = state;
  refreshButton.disabled = state === 'loading';
  refreshButton.textContent = state === 'loading'
    ? LOADING_LABEL
    : state === 'done'
      ? SUCCESS_LABEL
      : getDefaultLabel();

  if (state === 'idle') {
    clearLiveStatus();
    return;
  }

  setLiveStatus(state, state === 'loading' ? '正在重新检测' : '已重新检测', announce);
};

const markRefreshPending = () => {
  try {
    window.sessionStorage.setItem(FEEDBACK_KEY, getCurrentFeedbackPath());
  } catch {
    // sessionStorage 不可用时，静默退化为无完成反馈。
  }
};

const consumeRefreshPending = (): boolean => {
  try {
    const pendingPath = window.sessionStorage.getItem(FEEDBACK_KEY);
    if (pendingPath !== getCurrentFeedbackPath()) return false;
    window.sessionStorage.removeItem(FEEDBACK_KEY);
    return true;
  } catch {
    return false;
  }
};

if (refreshButton) {
  refreshButton.dataset.defaultLabel = refreshButton.textContent?.trim() || '重新检测';
  setButtonState('idle', false);
}

if (consumeRefreshPending()) {
  setButtonState('done', true);
  window.setTimeout(() => {
    setButtonState('idle', false);
  }, SUCCESS_TIMEOUT_MS);
}

if (refreshForm instanceof HTMLFormElement && refreshButton instanceof HTMLButtonElement) {
  refreshForm.addEventListener('submit', (event) => {
    if (refreshButton.disabled) return;

    event.preventDefault();
    markRefreshPending();
    setButtonState('loading', true);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        HTMLFormElement.prototype.submit.call(refreshForm);
      });
    });
  });
}
