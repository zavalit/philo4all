/*
 * Astro integration: `astro dev` starts on the first port, from 4321 or --port upwards, that nothing answers on.
 *
 * Vite checks a port by listening on the wildcard addresses and then on "localhost", which resolves to ::1
 * first. A server on 127.0.0.1 (astro dev --host 127.0.0.1 in another project) is noticed by neither, so two
 * dev servers end up on the same port number and "localhost" reaches whichever one the client tries first.
 * Connecting finds a listener whichever address it bound.
 */
import { connect } from 'node:net';

// Does anything accept connections on host:port? A refused or unreachable address is an error, so false.
const answers = (port, host) => new Promise((done) => {
  const socket = connect({ port, host });
  socket.setTimeout(1000, () => { socket.destroy(); done(false); });
  socket.once('connect', () => { socket.destroy(); done(true); });
  socket.once('error', () => done(false));
});

const taken = async (port) => (await Promise.all(['127.0.0.1', '::1'].map((host) => answers(port, host)))).includes(true);

export default function devPort() {
  return {
    name: 'dev-port',
    hooks: {
      'astro:config:setup': async ({ command, isRestart, config, updateConfig, logger }) => {
        // A restart keeps its listening socket, and with it the port.
        if (command !== 'dev' || isRestart) return;
        const wanted = config.server.port;
        let port = wanted;
        while (port < wanted + 100 && await taken(port)) port++;
        if (port === wanted) return;
        logger.info(`Port ${wanted} is in use, using ${port} instead.`);
        updateConfig({ server: { port } });
      },
    },
  };
}
