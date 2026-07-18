import crypto from 'crypto';

/**
 * CONSISTENT HASH RING
 * 
 * Why Virtual Nodes? 
 * If we only had 3 physical shards, putting exactly 3 points on the hash ring 
 * would lead to terrible data distribution. One shard might accidentally own 60% of the ring!
 * By creating 150 "virtual" nodes for each physical shard, we plot 450 points 
 * evenly around the ring. This guarantees a statistically even distribution of keys.
 * 
 * Why Consistent Hashing instead of simple modulo (hash(key) % 3)?
 * If you use modulo and you add a 4th server, (hash(key) % 4) changes for ALMOST EVERY KEY.
 * 90% of your cache would instantly become "misses". 
 * With a Hash Ring, adding a 4th server only takes over the space directly next to its 
 * virtual nodes. Roughly ~25% of keys remap, and 75% stay perfectly intact!
 */
class ConsistentHashRing {
  constructor() {
    this.ring = []; // Will hold objects: { position: number, shardId: string }
    this.VIRTUAL_NODES_PER_SHARD = 150;
  }

  // Generates a numerical position on the ring for any string
  _getHashPosition(str) {
    const hashHex = crypto.createHash('md5').update(str).digest('hex');
    // Take the first 8 characters of the hex string and convert to an integer
    return parseInt(hashHex.substring(0, 8), 16);
  }

  buildRing(shardIds) {
    this.ring = [];
    
    for (const shardId of shardIds) {
      for (let i = 0; i < this.VIRTUAL_NODES_PER_SHARD; i++) {
        const virtualNodeStr = `${shardId}#${i}`;
        const position = this._getHashPosition(virtualNodeStr);
        this.ring.push({ position, shardId });
      }
    }

    // Sort the ring mathematically from lowest position to highest position
    this.ring.sort((a, b) => a.position - b.position);
  }

  getShardForKey(key) {
    if (this.ring.length === 0) {
      throw new Error("Ring is empty. Call buildRing first.");
    }

    const keyPosition = this._getHashPosition(key);

    // Binary search to find the first virtual node that has a position >= keyPosition
    let low = 0;
    let high = this.ring.length - 1;
    let foundIndex = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid].position >= keyPosition) {
        foundIndex = mid;
        high = mid - 1; // Keep searching left for the *first* one
      } else {
        low = mid + 1;
      }
    }

    // Wrapping around the ring:
    // If the key's position is greater than ALL nodes on the ring, it wraps around
    // to the very first node on the ring.
    if (foundIndex === -1) {
      return this.ring[0].shardId;
    }

    return this.ring[foundIndex].shardId;
  }
}

// We instantiate and build a singleton ring that our entire app will share
const hashRing = new ConsistentHashRing();

// In our setup, we have 3 shards corresponding to indices 0, 1, and 2 in config.js
hashRing.buildRing(['shard0', 'shard1', 'shard2']);

export default hashRing;
