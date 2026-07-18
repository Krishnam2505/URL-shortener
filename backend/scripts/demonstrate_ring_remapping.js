import hashRing from '../services/hashRing_service.js';

// The number of fake cache keys we will test
const TOTAL_KEYS = 10000;
const keys = [];

for (let i = 0; i < TOTAL_KEYS; i++) {
  keys.push(`test-url-key-${i}`);
}

console.log(`\n======================================================`);
console.log(`CONSISTENT HASH RING MATHEMATICAL DEMONSTRATION`);
console.log(`======================================================\n`);

// 1. Build the initial ring with 3 servers
console.log(`1. Building ring with 3 servers (shard0, shard1, shard2)...`);
hashRing.buildRing(['shard0', 'shard1', 'shard2']);

// Record exactly which server owns each of the 10,000 keys
const initialMapping = new Map();
for (const key of keys) {
  initialMapping.set(key, hashRing.getShardForKey(key));
}

// 2. Simulate a massive traffic spike! We need to add a 4th server (shard3).
console.log(`2. Traffic spike! Adding a 4th server (shard3) to the ring...`);
hashRing.buildRing(['shard0', 'shard1', 'shard2', 'shard3']);

// Check which server owns the keys NOW
let keysRemapped = 0;
let keysKeptSafe = 0;

for (const key of keys) {
  const oldServer = initialMapping.get(key);
  const newServer = hashRing.getShardForKey(key);
  
  if (oldServer !== newServer) {
    keysRemapped++;
  } else {
    keysKeptSafe++;
  }
}

// 3. Output the results
console.log(`\n======================================================`);
console.log(`RESULTS FOR 10,000 CACHED KEYS:`);
console.log(`======================================================`);
console.log(`Keys that stayed safely on their original server : ${keysKeptSafe} (${(keysKeptSafe/TOTAL_KEYS*100).toFixed(1)}%)`);
console.log(`Keys that had to be moved to a new server        : ${keysRemapped} (${(keysRemapped/TOTAL_KEYS*100).toFixed(1)}%)`);
console.log(`\nConclusion:`);
console.log(`If we had used basic modulo hashing (hash % 3), adding a 4th server`);
console.log(`would have caused roughly 75-100% of the keys to remap, instantly destroying our cache.`);
console.log(`Because we used a Consistent Hash Ring, we only lost ~25% of our cache,`);
console.log(`and the other ~75% stayed perfectly intact and lightning fast!\n`);
