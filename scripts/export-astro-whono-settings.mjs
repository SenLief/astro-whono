import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const TOOL_NAME = 'astro-whono-settings-exporter';
const TOOL_VERSION = 1;
const SCHEMA_VERSION = 1;
const INCLUDED_SCOPES = ['settings'];
const EXCLUDES = ['content', 'images', '.local', 'private-files', 'credentials'];
const SETTINGS_GROUPS = ['site', 'shell', 'home', 'page', 'ui'];
const DEFAULT_SETTINGS_DIR = path.join(process.cwd(), 'src', 'data', 'settings');
const DEFAULT_LEGACY_CONFIG_PATH = path.join(process.cwd(), 'site.config.mjs');

const toPosixPath = (value) => value.split(path.sep).join('/');

const formatDisplayPath = (filePath) => {
  const resolved = path.resolve(filePath);
  const relative = path.relative(process.cwd(), resolved);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return toPosixPath(relative);
  }
  return toPosixPath(resolved);
};

const isSameOrInsidePath = (targetPath, basePath) => {
  const relative = path.relative(path.resolve(basePath), path.resolve(targetPath));
  return relative === '' || (relative && !relative.startsWith('..') && !path.isAbsolute(relative));
};

const normalizeOutputStamp = (value) =>
  value
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/[^0-9TZ]/g, '');

const createDefaultOutputPath = (createdAt) =>
  path.join(process.cwd(), `astro-whono-settings-backup-${normalizeOutputStamp(createdAt)}.json`);

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeLocale = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const createWarning = ({ code, message, group, path: filePath, detail }) => ({
  code,
  ...(group ? { group } : {}),
  ...(filePath ? { path: filePath } : {}),
  message,
  ...(detail ? { detail } : {})
});

const fail = (message) => {
  console.error(`导出失败: ${message}`);
  process.exit(1);
};

const printHelp = () => {
  console.log(`Usage: node scripts/export-astro-whono-settings.mjs [options]

Options:
  --settings-dir <dir>   Settings JSON directory. Default: ./src/data/settings
  --out <file>           Output backup file path.
  --include-legacy       Also save raw site.config.mjs text when available.
  --force                Allow overwriting the output file.
  --help                 Show this help.
`);
};

const parseCliArgs = (argv) => {
  const options = {
    settingsDir: DEFAULT_SETTINGS_DIR,
    out: null,
    includeLegacy: false,
    force: false,
    help: false
  };

  const readValue = (index, flag, inlineValue) => {
    if (inlineValue !== undefined) {
      if (!inlineValue) fail(`${flag} 参数不能为空`);
      return { value: inlineValue, nextIndex: index };
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      fail(`${flag} 需要提供参数值`);
    }
    return { value: next, nextIndex: index + 1 };
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const [flag, inlineValue] = arg.includes('=') ? arg.split(/=(.*)/s, 2) : [arg, undefined];

    if (flag === '--help' || flag === '-h') {
      if (inlineValue !== undefined) fail(`${flag} 不接受参数值`);
      options.help = true;
      continue;
    }

    if (flag === '--include-legacy') {
      if (inlineValue !== undefined) fail(`${flag} 不接受参数值`);
      options.includeLegacy = true;
      continue;
    }

    if (flag === '--force') {
      if (inlineValue !== undefined) fail(`${flag} 不接受参数值`);
      options.force = true;
      continue;
    }

    if (flag === '--settings-dir') {
      const result = readValue(index, flag, inlineValue);
      options.settingsDir = path.resolve(result.value);
      index = result.nextIndex;
      continue;
    }

    if (flag === '--out') {
      const result = readValue(index, flag, inlineValue);
      options.out = path.resolve(result.value);
      index = result.nextIndex;
      continue;
    }

    fail(`未知参数: ${arg}`);
  }

  return options;
};

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const readSettingsFile = async ({ group, settingsDir, warnings }) => {
  const filePath = path.join(settingsDir, `${group}.json`);
  const displayPath = formatDisplayPath(filePath);
  const fileInfo = {
    path: displayPath,
    exists: false,
    parseOk: false,
    rootOk: false,
    bytes: 0,
    sha256: null
  };

  let buffer;
  try {
    buffer = await readFile(filePath);
  } catch (error) {
    const code = error?.code === 'ENOENT' ? 'missing-settings-file' : 'read-settings-file-failed';
    warnings.push(createWarning({
      code,
      group,
      path: displayPath,
      message: code === 'missing-settings-file'
        ? 'settings file does not exist'
        : 'settings file could not be read',
      detail: error?.message
    }));
    return { fileInfo, rawText: null, parsedObject: null };
  }

  const rawText = buffer.toString('utf8');
  fileInfo.exists = true;
  fileInfo.bytes = buffer.byteLength;
  fileInfo.sha256 = sha256(buffer);

  let parsed;
  try {
    parsed = JSON.parse(rawText);
    fileInfo.parseOk = true;
  } catch (error) {
    warnings.push(createWarning({
      code: 'invalid-json',
      group,
      path: displayPath,
      message: 'settings file is not valid JSON',
      detail: error?.message
    }));
    return { fileInfo, rawText, parsedObject: null };
  }

  if (!isRecord(parsed)) {
    warnings.push(createWarning({
      code: 'invalid-root',
      group,
      path: displayPath,
      message: 'settings JSON root must be an object'
    }));
    return { fileInfo, rawText, parsedObject: null };
  }

  fileInfo.rootOk = true;
  return { fileInfo, rawText, parsedObject: parsed };
};

const readLegacyConfig = async (warnings) => {
  const displayPath = formatDisplayPath(DEFAULT_LEGACY_CONFIG_PATH);
  try {
    return {
      rawText: await readFile(DEFAULT_LEGACY_CONFIG_PATH, 'utf8'),
      path: displayPath
    };
  } catch (error) {
    const code = error?.code === 'ENOENT' ? 'missing-legacy-file' : 'read-legacy-file-failed';
    warnings.push(createWarning({
      code,
      path: displayPath,
      message: code === 'missing-legacy-file'
        ? 'site.config.mjs does not exist'
        : 'site.config.mjs could not be read',
      detail: error?.message
    }));
    return null;
  }
};

const assertOutputTargetAllowed = (outputPath, settingsDir) => {
  if (isSameOrInsidePath(outputPath, settingsDir)) {
    fail(`输出文件不能写入 settings 目录: ${formatDisplayPath(outputPath)}`);
  }

  if (path.resolve(outputPath) === path.resolve(DEFAULT_LEGACY_CONFIG_PATH)) {
    fail(`输出文件不能覆盖 legacy 配置文件: ${formatDisplayPath(outputPath)}`);
  }
};

const assertOutputWritable = async (outputPath, force) => {
  const outputDir = path.dirname(outputPath);
  try {
    const dirStat = await stat(outputDir);
    if (!dirStat.isDirectory()) {
      fail(`输出目录不是目录: ${formatDisplayPath(outputDir)}`);
    }
    await access(outputDir, fsConstants.W_OK);
  } catch (error) {
    fail(`输出目录不可写: ${formatDisplayPath(outputDir)} (${error?.message ?? 'unknown error'})`);
  }

  if (!force) {
    try {
      await access(outputPath, fsConstants.F_OK);
      fail(`输出文件已存在，请使用 --force 覆盖: ${formatDisplayPath(outputPath)}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        fail(`无法检查输出文件状态: ${formatDisplayPath(outputPath)} (${error?.message ?? 'unknown error'})`);
      }
    }
  }
};

const createCompatibility = ({ completeSettings, legacyOnly }) => {
  if (completeSettings && !legacyOnly) {
    return {
      dataConsoleDryRunCandidate: 'eligible',
      reason: 'all settings JSON files parsed as objects; final compatibility still requires /admin/data/ dry-run'
    };
  }

  if (legacyOnly) {
    return {
      dataConsoleDryRunCandidate: 'needs-migration',
      reason: 'legacy-only backup cannot be imported directly by Data Console'
    };
  }

  return {
    dataConsoleDryRunCandidate: 'needs-migration',
    reason: 'settings JSON files are missing, invalid, or incomplete; use rawFiles as migration input'
  };
};

const createBundle = async ({ settingsDir, includeLegacy, createdAt }) => {
  const warnings = [];
  const files = {};
  const rawFiles = {};
  const settings = {};

  for (const group of SETTINGS_GROUPS) {
    const result = await readSettingsFile({ group, settingsDir, warnings });
    files[group] = result.fileInfo;
    if (result.rawText !== null) rawFiles[group] = result.rawText;
    if (result.parsedObject !== null) settings[group] = result.parsedObject;
  }

  const legacy = includeLegacy ? await readLegacyConfig(warnings) : null;
  const readableSettingsCount = Object.keys(rawFiles).length;
  const parsedSettingsCount = Object.keys(settings).length;

  if (readableSettingsCount === 0 && !legacy) {
    fail('当前目录下找不到任何可读取的 settings JSON；如需仅备份 site.config.mjs，请传入 --include-legacy');
  }

  const completeSettings = SETTINGS_GROUPS.every((group) => files[group].exists && files[group].parseOk && files[group].rootOk);
  const legacyOnly = readableSettingsCount === 0 && Boolean(legacy);

  if (legacyOnly) {
    warnings.push(createWarning({
      code: 'legacy-only-backup',
      path: legacy.path,
      message: 'legacy-only backup cannot be imported directly by Data Console'
    }));
  }

  const sourceFiles = SETTINGS_GROUPS.map((group) => formatDisplayPath(path.join(settingsDir, `${group}.json`)));
  const bundle = {
    manifest: {
      tool: TOOL_NAME,
      toolVersion: TOOL_VERSION,
      schemaVersion: SCHEMA_VERSION,
      createdAt,
      includedScopes: INCLUDED_SCOPES,
      excludes: EXCLUDES,
      locale: normalizeLocale(settings.site?.defaultLocale),
      settingsDir: formatDisplayPath(settingsDir),
      sourceFiles
    },
    compatibility: createCompatibility({ completeSettings, legacyOnly }),
    settings,
    rawFiles,
    files,
    warnings,
    errors: []
  };

  if (legacy) {
    bundle.legacyRawFiles = {
      siteConfig: legacy.rawText
    };
  }

  return {
    bundle,
    summary: {
      parsedSettingsCount,
      readableSettingsCount,
      warningCount: warnings.length,
      dryRunCandidate: bundle.compatibility.dataConsoleDryRunCandidate
    }
  };
};

const main = async () => {
  const options = parseCliArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const createdAt = new Date().toISOString();
  const outputPath = options.out ?? createDefaultOutputPath(createdAt);
  assertOutputTargetAllowed(outputPath, options.settingsDir);
  await assertOutputWritable(outputPath, options.force);

  const { bundle, summary } = await createBundle({
    settingsDir: options.settingsDir,
    includeLegacy: options.includeLegacy,
    createdAt
  });

  const outputText = `${JSON.stringify(bundle, null, 2)}\n`;
  try {
    await writeFile(outputPath, outputText, {
      encoding: 'utf8',
      flag: options.force ? 'w' : 'wx'
    });
  } catch (error) {
    const message = error?.code === 'EEXIST'
      ? '输出文件已存在，请使用 --force 覆盖'
      : `写入输出文件失败: ${error?.message ?? 'unknown error'}`;
    fail(`${message}: ${formatDisplayPath(outputPath)}`);
  }

  console.log(`导出完成: ${formatDisplayPath(outputPath)}`);
  console.log(`settings parsed: ${summary.parsedSettingsCount}/${SETTINGS_GROUPS.length}`);
  console.log(`settings readable: ${summary.readableSettingsCount}/${SETTINGS_GROUPS.length}`);
  console.log(`warnings: ${summary.warningCount}`);
  console.log(`Data Console dry-run candidate: ${summary.dryRunCandidate}`);
};

await main();
