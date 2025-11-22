import http from "http";

export async function getBumpersHandler(): Promise<PrismMediaItem[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/get-all-bumpers",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const shorts: PrismMediaItem[] = JSON.parse(data);
          resolve(shorts);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

export async function createBumperHandler(
  bumper: PrismMediaItem
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(bumper);

    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/create-bumper",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ message: response.message, status: res.statusCode || 200 });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

export async function deleteBumperHandler(
  bumper: PrismMediaItem
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const mediaItemId = bumper.mediaItemId;

    const options = {
      hostname: "localhost",
      port: 3001,
      path: `/api/admin/v1/delete-bumper?mediaItemId=${mediaItemId}`,
      method: "DELETE",
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ message: response.message, status: res.statusCode || 200 });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

export async function updateBumperHandler(
  bumper: PrismMediaItem
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(bumper);
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/update-bumper",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ message: response.message, status: res.statusCode || 200 });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}
