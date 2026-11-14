const test = require('node:test');
const assert = require('node:assert/strict');
const { ESLint } = require('eslint10');

const rules = {
  'import/no-unresolved': 'error',
  'jsx-a11y/alt-text': 'error',
  'react/jsx-key': 'error',
};

test('ESLint 10 호환 계층에서도 import·접근성·React 규칙이 실제 위반을 탐지한다', async () => {
  const lint = new ESLint({ overrideConfig: { rules } });
  const [result] = await lint.lintText(`
    import Missing from './__missing_lint_compat_module__';
    export default function Example() {
      return <><Missing /><img src="/example.png" />{[1].map(n => <div>{n}</div>)}</>;
    }
  `, { filePath: 'src/components/__lint_compat_probe.tsx' });
  const detected = new Set(result.messages.map(message => message.ruleId));
  for (const rule of Object.keys(rules)) assert.ok(detected.has(rule), `${rule}: ${JSON.stringify(result.messages)}`);
});

test('ESLint 10 호환 계층은 유효한 import·alt·React key를 위반으로 처리하지 않는다', async () => {
  const lint = new ESLint({ overrideConfig: { rules } });
  const [result] = await lint.lintText(`
    import Footer from './Footer';
    export default function Example() {
      return <><Footer /><img src="/example.png" alt="예시" />{[1].map(n => <div key={n}>{n}</div>)}</>;
    }
  `, { filePath: 'src/components/__lint_compat_probe.tsx' });
  assert.deepEqual(result.messages.filter(message => Object.hasOwn(rules, message.ruleId || '') || message.fatal), []);
});
