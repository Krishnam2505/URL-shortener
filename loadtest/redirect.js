import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Ramp up to 50 users over 10 seconds
    { duration: '30s', target: 50 }, // Hold at 50 users for 30 seconds
    { duration: '5s', target: 0 },   // Ramp down to 0 users over 5 seconds
  ],
};

// We test the 'f' short code we created earlier.
// You can replace 'f' with any valid short code from your local database.
const TARGET_URL = 'http://localhost:8000/f';

export default function () {
  // We use redirects: 0 so k6 doesn't automatically follow the 302 redirect.
  // We want to measure the performance of OUR server generating the 302 response,
  // not the performance of the external site we are redirecting to!
  const res = http.get(TARGET_URL, { redirects: 0 });

  check(res, {
    'status is 302': (r) => r.status === 302,
  });

  // Adding a tiny sleep (100ms) prevents k6 from going into an unrealistic tight loop.
  // Real users take time between clicks (even automated API consumers usually have some latency).
  sleep(0.1);
}

/*
--- UNDERSTANDING p95 AND p99 LATENCY ---

When k6 finishes, you will see a summary with "http_req_duration".
It will list "avg, min, med, max, p(90), p(95)".

Why do we care about p95 / p99?
If you say "My API has an average response time of 5ms", that sounds great! 
But averages hide outliers. If 90% of requests take 1ms, and 10% take 100ms, your average is still very low.
But those 10% of users had a TERRIBLE experience.

"p95 = 12ms" means "95% of all requests completed in 12ms or less."
This is a much more honest and strict metric for performance in large-scale systems.
*/
