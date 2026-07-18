import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 20 },  // Ramp up to 20 users over 5 seconds
    { duration: '15s', target: 20 }, // Hold for 15 seconds
  ],
};

export default function () {
  const url = 'http://localhost:8000/api/shorten';
  
  // Create a unique URL for each iteration to avoid collisions
  const payload = JSON.stringify({
    originalUrl: `https://example.com/test/${__VU}/${__ITER}`
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  // We consider both 201 (Created) and 429 (Too Many Requests) as "Success" for this test.
  // 429 means our Rate Limiter successfully intercepted the burst and protected the server!
  check(res, {
    'status is 201 or 429': (r) => r.status === 201 || r.status === 429,
  });

  sleep(0.1);
}

/*
--- WHY ARE 429 ERRORS "CORRECT"? ---

In a normal test, you want 100% 200/201 Success codes.
But this is a test of a Rate Limiter. 
If we blast the server with 20 concurrent users, and every single request returns a 201,
IT MEANS OUR RATE LIMITER IS BROKEN or configured with too high of a capacity!

Seeing a mix of 201s and 429s under heavy load proves that the token bucket algorithm
is working flawlessly: allowing the initial burst, and then strictly throttling traffic 
down to the refill rate.
*/
