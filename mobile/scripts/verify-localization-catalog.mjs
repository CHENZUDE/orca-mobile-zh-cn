#!/usr/bin/env node
// Why: validate that every non-empty zh-CN catalog entry mirrors en.json's key tree
// and that {{placeholders}} match 鈥?silent placeholder drift would render wrong text.
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', 'src', 'i18n', 'locales');

function flatten(obj, out = {}, prefix = '') {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) {
      const next = prefix ? prefix + '.' + k : k;
      flatten(obj[k], out, next);
    }
  } else if (typeof obj === 'string') {
    out[prefix] = obj;
  }
  return out;
}

function placeholders(s) {
  if (typeof s !== 'string') return [];
  const re = /\{\{([^}]+)\}\}/g;
  const set = new Set();
  let m;
  while ((m = re.exec(s))) set.add(m[1]);
  return [...set];
}

async function load(name) {
  const p = resolve(root, name);
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch (err) {
    console.error('read ' + name + ' failed:', err.message);
    process.exit(1);
  }
}

const en = await load('en.json');
const zh = await load('zh.json');
const enFlat = flatten(en);
const zhFlat = flatten(zh);

let missing = 0;
let placeholderMismatch = 0;
for (const key of Object.keys(enFlat)) {
  if (enFlat[key] === '') continue;
  if (!(key in zhFlat)) {
    console.error('MISSING zh: ' + key);
    missing++;
    continue;
  }
  if (zhFlat[key] === undefined || zhFlat[key] === null) {
    console.error('EMPTY zh: ' + key);
    missing++;
    continue;
  }
  const enPh = placeholders(enFlat[key]).sort().join(',');
  const zhPh = placeholders(zhFlat[key]).sort().join(',');
  if (enPh !== zhPh) {
    console.error('PLACEHOLDER MISMATCH: ' + key + ' | en={' + enPh + '} zh={' + zhPh + '}');
    placeholderMismatch++;
  }
}

let extra = 0;
for (const key of Object.keys(zhFlat)) {
 if (!(key in enFlat)) {
 console.error('EXTRA zh (no en): ' + key);
 extra++;
 }
}

console.log('Checked ' + Object.keys(enFlat).length + ' en keys; missing=' + missing + ', placeholderMismatch=' + placeholderMismatch + ', extra=' + extra);
if (missing || placeholderMismatch || extra) process.exit(1);

