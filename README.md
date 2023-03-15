# Duck Duck Goose
This repo is a fun excercise to spawn a server cluster using NodeJs.

## Requirements
- Design a system that will select a single node as a “Goose” within a cluster of nodes. Every other node should be considered a “Duck”.
- If the Goose dies, another Duck should become the new Goose. 
- If a dead Goose rejoins, it should become a Duck (assuming there is already another Goose)
- There can be only one Goose, even if some working nodes are unreachable (network partition)
- Each node should run an http server with an endpoint allowing us to check if that node is a Duck or a Goose.

## Approach
To design a system that selects a single node as a "Goose" within a cluster of nodes, we can follow the approach of the Leader Election Algorithm, which ensures that one node is elected as a leader in a distributed system. Here's how we can modify it to fit our requirements:

- Each node in the cluster should have a unique ID.
- Initially, all nodes are considered "Ducks."
- The nodes should communicate with each other through a message-passing protocol, such as UDP or TCP.
- Each node should periodically send out a "heartbeat" message to all other nodes in the cluster to indicate that it is still alive.
- When a node receives a heartbeat message from another node, it updates its list of known nodes in the cluster.
- If a node doesn't receive a heartbeat message from another node for a certain amount of time, it assumes that the other node has died and removes it from its list of known nodes.
- Each node maintains a "candidate list" of nodes that it believes could be the current Goose.
- To be a candidate, a node must have sent a heartbeat message more recently than any other node in the cluster.
- If a node believes that it is the current Goose, it sends out a message to all other nodes in the cluster announcing that it is the new Goose.
- When a node receives a "Goose" announcement, it adds the sending node to its candidate list and updates its list of known nodes.
- If a node receives a "Goose" announcement from a node that is not in its candidate list, it adds the sending node to its candidate list.
- If a node receives a "Goose" announcement from a node that is in its candidate list, it compares the timestamps of the two nodes' heartbeat messages to determine which node has sent a message more recently.
- If a node is not in any candidate list, it assumes that it is a Duck.
- Each node should expose an HTTP endpoint that can be used to check if that node is a Duck or a Goose.

With this approach, if the current Goose dies, another node will become the new Goose based on the candidate list. When a dead Goose rejoins, it will become a Duck unless there is already another Goose. This system ensures that there is always one and only one Goose, even if there is a network partition.

## Install
- install nodejs: https://nodejs.org/en/
- install dependencies by shell command `npm i` 

## Running a demo
- Start 5 nodes by shell command `node index.js 0` ... and ...  `node index.js 4` in seperate terminal tabs.
- You will notice there are now 5 local HTTP servers running, at port 8000~8004. 8004 should be the Goose, and rest are ducks.
- Stop node #4, you will notice port 8003 is no longer available.
- Start node #4, you will notice port 8003 is available again as a duck.

## Discussion 
- One limitation of this implementation is that all nodes must be on same local network. Because it takes advantage of UDP broadcast.   
- An obvious alternative to this design is to use Raft: https://raft.github.io/, which is more robust with more complexity. 