const http = require('http');
const udp = require('dgram');

const UDP_PORT = 3000;
const HEARTBEAT_INTERVAL = 500; // milliseconds
const CANDIDATE_TIMEOUT = 1000; // milliseconds

let isGoose = false;
let gooseId = null;
let candidates = new Map();
let knownNodes = new Set();

const basePort = 8000;
let appPort;
 
if (process.argv.length < 3) {
    console.error('Unexpected parameters.')
}
let nodeIndex = process.argv[2];
appPort = basePort + parseInt(nodeIndex);

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end(`I am a ${isGoose ? 'Goose' : 'Duck'}!\n`);
});

server.listen(appPort, () => {
  console.log(`Server running at http://localhost:${appPort}/`);
});

const sendHeartbeat = (socket) => {
  const message = Buffer.from(`heartbeat:${appPort}`);
  socket.send(message, 0, message.length, UDP_PORT, '224.0.0.1');
};

const checkCandidates = () => {
  let highestTimestamp = 0;
  let highestNodeId = null;
  
  for (const [nodeId, timestamp] of candidates) {

    if (Date.now() - timestamp > CANDIDATE_TIMEOUT) {
      console.log('Deleting candidate: ', nodeId);
      candidates.delete(nodeId);
      if (gooseId == nodeId) {
        // reset gooseId if current goose is dead
        gooseId = null;
      }
    } else if (timestamp > highestTimestamp) {
      highestTimestamp = timestamp;
      highestNodeId = nodeId;
    }
  }
  if (highestNodeId && (!gooseId || highestNodeId > gooseId)) {
    gooseId = highestNodeId;
    isGoose = (gooseId == appPort);
    console.log(`New Goose: ${gooseId}`);
  }
};

const socket = udp.createSocket({ type: 'udp4', reuseAddr: true });

socket.bind(UDP_PORT, () => {
  socket.addMembership('224.0.0.1');
  setInterval(() => {
    sendHeartbeat(socket);
  }, HEARTBEAT_INTERVAL);
});

socket.on('message', (message, rinfo) => {
  const [type, nodeId] = message.toString().split(':');
  // console.log('onMessage: ', type, nodeId, appPort);
  if (type === 'heartbeat') {
    if (!knownNodes.has(nodeId)) {
        console.log('Adding new node: ', nodeId);
    }
    knownNodes.add(nodeId);
    if (nodeId !== appPort) {
      candidates.set(nodeId, Date.now());
      checkCandidates();
    }
  }
});

socket.on('error', (err) => {
  console.log(`Socket error: ${err}`);
});
