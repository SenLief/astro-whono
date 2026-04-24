import type {
  ThemeSettingsEditableErrorState,
  ThemeSettingsReadDiagnostic
} from '@/lib/theme-settings';

const getDiagnosticHeadline = (diagnostic: ThemeSettingsReadDiagnostic): string => {
  const fileName = diagnostic.path.split('/').pop() || diagnostic.path;
  if (diagnostic.code === 'invalid-json') return `${fileName} 格式错误`;
  if (diagnostic.code === 'invalid-root') return `${fileName} 结构错误`;
  if (diagnostic.code === 'schema-mismatch') return `${fileName} 配置不一致`;
  return `${fileName} 读取失败`;
};

const createDiagnosticMeta = (label: string, value: string, options: { mono?: boolean } = {}): HTMLElement => {
  const row = document.createElement('div');
  row.className = 'admin-banner__meta';

  const labelEl = document.createElement('span');
  labelEl.className = 'admin-banner__meta-label';
  labelEl.textContent = label;

  const valueEl = document.createElement(options.mono ? 'code' : 'span');
  valueEl.className = options.mono
    ? 'admin-banner__meta-value admin-banner__meta-value--mono'
    : 'admin-banner__meta-value';
  valueEl.textContent = value;

  row.append(labelEl, valueEl);
  return row;
};

const shouldCollapseDiagnosticDetail = (value: string): boolean =>
  value.includes('\n') || value.length > 72;

const createDiagnosticDetails = (value: string): HTMLElement => {
  const details = document.createElement('details');
  details.className = 'admin-banner__details';

  const summary = document.createElement('summary');
  summary.className = 'admin-banner__details-summary';
  summary.textContent = '原始报错';

  const body = document.createElement('code');
  body.className = 'admin-banner__details-body';
  body.textContent = value;

  details.append(summary, body);
  return details;
};

const createDiagnosticListItem = (diagnostic: ThemeSettingsReadDiagnostic): HTMLElement => {
  const item = document.createElement('li');
  item.className = 'admin-banner__list-item admin-banner__list-item--diagnostic';

  const title = document.createElement('p');
  title.className = 'admin-banner__item-title';
  title.textContent = getDiagnosticHeadline(diagnostic);
  item.appendChild(title);

  item.appendChild(createDiagnosticMeta('文件', diagnostic.path, { mono: true }));

  if (typeof diagnostic.line === 'number' && typeof diagnostic.column === 'number') {
    item.appendChild(createDiagnosticMeta('位置', `第 ${diagnostic.line} 行，第 ${diagnostic.column} 列`));
  }

  if (diagnostic.detail) {
    if (shouldCollapseDiagnosticDetail(diagnostic.detail)) {
      item.appendChild(createDiagnosticDetails(diagnostic.detail));
    } else {
      item.appendChild(createDiagnosticMeta('说明', diagnostic.detail, { mono: true }));
    }
  }

  return item;
};

export const createInvalidSettingsBannerItems = (
  invalidState: ThemeSettingsEditableErrorState
): HTMLElement[] => invalidState.diagnostics.map((diagnostic) => createDiagnosticListItem(diagnostic));
