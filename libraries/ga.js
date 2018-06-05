// Daniel Shiffman
// Nature of Code: Intelligence and Learning
// https://github.com/shiffman/NOC-S17-2-Intelligence-Learning

// This flappy bird implementation is adapted from:
// https://youtu.be/cXgA1d_E-jY&


// This file includes functions for creating a new generation
// of birds.

// Start the game over
function resetGame() {
  counter = 0;
  // Resetting best bird score to 0
  if (bestAgent) {
    bestAgent.score = 0;
  }
}

// Create the next generation
function nextGeneration() {
  resetGame();
  // Normalize the fitness values 0-1
  normalizeFitness(allAgents);
  // Generate a new set of birds
  activeAgents = generate(allAgents);
  // Copy those birds to another array
  allAgents = activeAgents.slice();
}

// Generate a new population of birds
function generate(oldAgents) {
  let newAgents = [];
  for (let i = 0; i < oldAgents.length; i++) {
    // Select a bird based on fitness
    let agent = poolSelection(oldAgents);
    newAgents[i] = agent;
  }
  return newAgents;
}

// Normalize the fitness of all birds
function normalizeFitness(agents) {
  // Make score exponentially better?
  for (let i = 0; i < agents.length; i++) {
    agents[i].score = pow(agents[i].score, 2);
  }

  // Add up all the scores
  let sum = 0;

  for (let i = 0; i < agents.length; i++) {
    sum += agents[i].score;
  }
  // Divide by the sum
  for (let i = 0; i < agents.length; i++) {
    agents[i].fitness = agents[i].score / sum;
  }
}


// An algorithm for picking one bird from an array
// based on fitness
function poolSelection(agents) {
  // Start at 0
  let index = 0;

  // Pick a random number between 0 and 1
  let r = random(1);

  // Keep subtracting probabilities until you get less than zero
  // Higher probabilities will be more likely to be fixed since they will
  // subtract a larger number towards zero
  while (r > 0) {
    r -= agents[index].fitness;
    // And move on to the next
    index += 1;
  }

  // Go back one
  index -= 1;

  // Make sure it's a copy!
  // (this includes mutation)
  return agents[index].copy();
}
