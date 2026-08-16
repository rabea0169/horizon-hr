const url = "http://localhost:3000/api/trpc/auth.horizonLogin?batch=1";
const body = {
  "0": {
    "json": {
      "username": "admin",
      "password": "admin123"
    }
  }
};

async function test() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

test().catch(console.error);
