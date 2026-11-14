const net = require('node:net');
const dns = require('node:dns');

function isLoopback(host) {
  return ['127.0.0.1', 'localhost', '::1', '[::1]', '::ffff:127.0.0.1'].includes(String(host).toLowerCase());
}

function assertLocalHost(host) {
  if (!isLoopback(host)) throw new Error(`Isolated preview blocked network destination: ${host}`);
}

function assertLocalDestination(value) {
  const url = new URL(typeof value === 'string' || value instanceof URL ? value : value.url);
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Isolated preview blocked network destination: ${url.origin}`);
  }
  assertLocalHost(url.hostname);
}

function getGuardNodeOptions(filename) {
  return `--require "${filename.replace(/\\/g, '/')}"`;
}

function installNetworkGuard() {
  if (globalThis.__isolatedNetworkGuard) return;
  globalThis.__isolatedNetworkGuard = true;
  const originalConnect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (...args) {
    // net.connect passes its already normalized [options, callback] array to
    // Socket.connect; normalizing that array again would hide its real host.
    const options = Array.isArray(args[0]) ? args[0][0] : net._normalizeArgs(args)[0];
    // Next worker IPC uses local named pipes. TCP always requires a loopback host.
    if (!options.path) assertLocalHost(options.host || 'localhost');
    return originalConnect.apply(this, args);
  };
  const originalLookup = dns.lookup;
  dns.lookup = function (hostname, ...args) {
    assertLocalHost(hostname);
    return originalLookup.call(this, hostname, ...args);
  };
  const originalPromiseLookup = dns.promises.lookup;
  dns.promises.lookup = async function (hostname, ...args) {
    assertLocalHost(hostname);
    return originalPromiseLookup.call(this, hostname, ...args);
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = function (input, init) {
    assertLocalDestination(input);
    // Redirect hops remain covered by the TCP and DNS checks above.
    return originalFetch.call(this, input, init);
  };
}

if (process.env.NEXT_PUBLIC_ISOLATED_PREVIEW === '1') installNetworkGuard();
module.exports = { assertLocalDestination, assertLocalHost, isLoopback, installNetworkGuard, getGuardNodeOptions };
