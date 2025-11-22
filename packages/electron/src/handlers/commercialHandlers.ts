import http from "http";

export async function getCommercialsHandler(): Promise<PrismMediaItem[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/get-all-commercials",
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

export async function createCommercialHandler(
  commercial: PrismMediaItem
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(commercial);

    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/create-commercial",
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

export async function deleteCommercialHandler(
  commercial: PrismMediaItem
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const mediaItemId = commercial.mediaItemId;

    const options = {
      hostname: "localhost",
      port: 3001,
      path: `/api/admin/v1/delete-commercial?mediaItemId=${mediaItemId}`,
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

export async function updateCommercialHandler(
  commercial: PrismMediaItem
): Promise<{ message: string; status: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(commercial);
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/admin/v1/update-commercial",
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
