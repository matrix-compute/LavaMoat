const test = require('ava')
const { scaffold, runScriptWithSES } = require('./scaffold.js')
const { makeConfig } = require('./fixtures/main/webpack.config.js')
const path = require('path')

test.before(async (t) => {
  const webpackConfig = makeConfig({
    generatePolicy: true,
    emitPolicySnapshot: true,
    diagnosticsVerbosity: 1,
  })
  await t.notThrowsAsync(async () => {
    t.context.build = await scaffold(webpackConfig)
  }, 'Expected the build to succeed')
  t.context.bundle = t.context.build.snapshot['/dist/app.js']
})

test('webpack/policy-gen - dist shape', (t) => {
  t.snapshot(t.context.build.snapshot['/dist/policy-snapshot.json'])
})

test('webpack/policy-gen - bundle runs without throwing', (t) => {
  t.notThrows(() => {
    runScriptWithSES(t.context.bundle)
  })
})

test('webpack/policy-gen - policy-overrides get applied', async (t) => {
  const webpackConfig = makeConfig({
    emitPolicySnapshot: true,
    policyLocation: path.resolve(__dirname, 'fixtures/main/policy-broken'),
    diagnosticsVerbosity: 1,
  })
  const build = await scaffold(webpackConfig)
  t.throws(
    () => {
      runScriptWithSES(build.snapshot['/dist/app.js'])
    },
    {
      message:
        'Policy does not allow importing umd-package from commonjs-package',
    }
  )
})

test('webpack/policy-gen - policy-overrides get applied on generated', async (t) => {
  const webpackConfig = makeConfig({
    generatePolicy: true,
    emitPolicySnapshot: true,
    policyLocation: path.resolve(__dirname, 'fixtures/main/policy-broken'),
    diagnosticsVerbosity: 1,
  })
  const build = await scaffold(webpackConfig)
  t.throws(
    () => {
      runScriptWithSES(build.snapshot['/dist/app.js'])
    },
    {
      message:
        'Policy does not allow importing umd-package from commonjs-package',
    }
  )
})