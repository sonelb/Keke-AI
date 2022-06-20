// BABA IS Y'ALL SOLVER - DFS TEMPLATE
// Version 1.0
// Code by Sarah

// get imports (NODEJS)
const simjs = require("../js/simulation");

const possActions = ["space", "right", "up", "left", "down"];

const stateSet = new Set();
const stack = [];
var an_action_set = [];

class Node {
  constructor(m, a, p, w, d, c, v, s) {
    this.state = m;
    this.actionHistory = a;
    this.parent = p;
    this.won = w;
    this.died = d;
    this.children = c;
    this.visit = v;
    this.score = s;
  }
}

function newState(kekeState, map) {
  simjs.clearLevel(kekeState);
  kekeState.orig_map = map;
  [kekeState.back_map, kekeState.obj_map] = simjs.splitMap(kekeState.orig_map);
  simjs.assignMapObjs(kekeState);
  simjs.interpretRules(kekeState);
}

function getChildNode(currState, action, parent) {
  // Append the child direction to the existing movement path.
  const nextActions = [];
  nextActions.push(...parent.actionHistory);
  nextActions.push(action);

  let won = false;
  let died = false;
  for (let a = 0, b = nextActions.length; a < b; a += 1) {
    const nextMove = simjs.nextMove(nextActions[a], currState);
    const nextState = nextMove.next_state;
    won = nextMove.won;
    if (nextState.players.length === 0) {
      won = false;
      died = true;
    }
  }

  const childMap = simjs.doubleMap2Str(currState.obj_map, currState.back_map);
  const child = new Node(
    childMap,
    nextActions,
    parent,
    won,
    died,
    [],
    0.0,
    0.0
  );
  return child;
}

function getChildren(parent, map) {
  const children = [];
  for (let i = 0, j = possActions.length; i < j; i += 1) {
    const currState = {};
    newState(currState, map);
    const childNode = getChildNode(currState, possActions[i], parent);
    if (!stateSet.has(childNode.state) && !childNode.died)
      children.push(childNode);
  }
  return children;
}

function backpropagateStep(node, scoreVal) {
  let tempNode = node;
  while (tempNode != null) {
    tempNode.visit++;
    tempNode.score += scoreVal;
    tempNode = tempNode.parent;
  }
}

function simulateStep(node) {
  let tmpNode = new Node(
    node.state,
    node.actionHistory,
    node.parent,
    node.won,
    node.died,
    [],
    0.0,
    0.0
  );

  let leafNodeFound = false;
  let counter = 0;
  let MAX_ITERATIONS = 20;

  while (!leafNodeFound) {

    simjs.setupLevel(simjs.parseMap(tmpNode.state));
    let state = simjs.getGamestate();

    let sol = [];
    let MAX_SEQ = 50;
    for (let i = 0; i < MAX_SEQ; i++) {
      let action = possActions[Math.floor(Math.random() * possActions.length)];
      sol.push(action);
    }
    an_action_set = sol;

    for (let i = 0; i < sol.length; i++) {
      //iterate overgame state
      let res = simjs.nextMove(sol[i], state);
      state = res["next_state"];
      didwin = res["won"];

      //winning solution reached
      if (didwin) {
        return 1;
      }
    }
    counter++;
    if(counter > MAX_ITERATIONS){
      leafNodeFound = true;
    }
  }

  return -1;
}

function getRandomChildNode(node) {
  let randomNo = Math.floor(Math.random() * node.children.length);

  return node.children[randomNo] != null ? node.children[randomNo] : node;
}

function expansionStep(node) {
  const children = getChildren(node, simjs.parseMap(node.state));
  node.children.push(...children);
}

function uctValue(totalVisit, nodeWinScore, nodeVisit) {
  if (nodeVisit == 0) {
    return Number.MAX_VALUE;
  }
  return (
    nodeWinScore / parseFloat(nodeVisit) +
    1.41 * Math.sqrt(Math.log(totalVisit) / parseFloat(nodeVisit))
  );
}

function selectionStep(parent) {
  let node = parent;

  while (node.children.length > 0) {
    node = node.children.reduce((pre, curr) =>
      uctValue(node.visit, pre.visit, pre.score) >
      uctValue(node.visit, curr.visit, curr.score)
        ? pre
        : curr
    );
  }

  return node;
}

// NEXT ITERATION STEP FOR SOLVING
function iterSolve(initState) {
  // PERFORM ITERATIVE CALCULATIONS HERE //
  if (stack.length > 0) {
    const parent = stack.pop();
    stack.push(parent);

    let currentNode = selectionStep(parent);

    //Step 2: Expansion
    if (!currentNode.won && !currentNode.died) {
      expansionStep(currentNode);
    }

    //Step 3: Simulation
    let expansionNode = currentNode;
    if (expansionNode.children.length > 0) {
      expansionNode = getRandomChildNode(currentNode);
    }
    let simulationRes = simulateStep(expansionNode);

    //Step 4: Update all nodes in tree
    if (simulationRes === 1) {
      return an_action_set;
    } else {
        backpropagateStep(expansionNode, simulationRes);
    }
  }
  // return a sequence of actions or empty list
  return [];
}

function initStack(initState) {
  const parent = new Node(
    simjs.map2Str(initState.orig_map),
    [],
    null,
    false,
    false,
    [],
    0.0,
    0.0
  );
  stack.push(parent);
}

// VISIBLE FUNCTION FOR OTHER JS FILES (NODEJS)
module.exports = {
  step(initState) {
    return iterSolve(initState);
  },
  init(initState) {
    initStack(initState);
  },
  best_sol() {
    return an_action_set;
  },
};
